$(document).ready(function(){

////VARIABLES

tmdbApiKey = '303bfe0cb9291c31c52f02191ab37d68';
ajaxURL = {
	popular:'http://api.themoviedb.org/3/person/popular?api_key='+tmdbApiKey+'&page=',
	movies:'http://api.themoviedb.org/3/person/{id}?api_key='+tmdbApiKey+'&append_to_response=movie_credits',
	actors:'http://api.themoviedb.org/3/movie/{id}?api_key='+tmdbApiKey+'&append_to_response=credits',
};
actors = [];
difficulty = 'easy';
bacon = false;
actorStart = {};
actorEnd = {};
actorA = {};
actorB = {};
listA = [];
listB = [];

///////FUNCTIONS

//Function to get list of popular actors from tmdb (20 at a time)
function getPopularActors(page){
	$.ajax({
		type: 'GET',
		url: ajaxURL.popular+page,
		success: function(response) {
			for (var i=0; i<response.results.length;i++){
				//store {id, name, and photo (thumb)} in actors array
				actors.push({id:response.results[i].id,name:response.results[i].name,thumb:'https://image.tmdb.org/t/p/w154'+response.results[i].profile_path})
			}
			//Get 200 actors (10 x 20)
			if(page < 10){
				page++;
				getPopularActors(page);
			} else {
				//Once all actors attained start The Game
				startGame();
			}
		},
		fail: function(response) {
			console.error('Error');
		}
	});
}

function startGame(){
	//Remove previous cards and chains, reset the dropdown menus and hide the success message
	$('#content .card').remove();
	$('#content i.fa-chain').remove();
	$('[id^=dropdown]').addClass('actors');
	$('[id^=dropdown]').removeClass('movies');
	$('[id^=dropdown]').show();
	$('#degs-sep span').text('');
	$('#degs-sep').hide();
	$('#task .chain').removeClass('linked');
	/*Set difficulty. Actors are ranked by tmdb by popularity from highest to lowest, so the higher the position
	in the actors array the less popular. Set limits of the random number generator based on difficulty selected
	at the start. Actors in location 0 - 100 are more famous than those in position 50-150 who are in turn more
	popular than actors in position 100 - 200*/
	var rand1,rand2,randLimits = {easy:{min:0,max:100},medium:{min:50,max:150},hard:{min:100,max:200}};
	//Generate random numbers based on limits which are in turn based on difficulty selected
	rand1 = Math.floor(Math.random()*(randLimits[difficulty].max-randLimits[difficulty].min+1)+randLimits[difficulty].min);
	//listA and listB are arrays where the links from actorStart and actorEnd will be stored respectively
	listA = [];
	listB = [];
	//Copy actor object {id,name,thumb} from actors array at the randomly selected position to listA
	listA.push(actors[rand1])
	//if kevin bacon is selected at start then put kevin bacon object in listB
	if(bacon){
		listB.push({id:4724,name:'Kevin Bacon',thumb:'https://image.tmdb.org/t/p/w154/p1uCaOjxSC1xS5TgmD4uloAkbLd.jpg'});
	} else {
		//Ensure second random number is not same as first
		rand2 = rand1;
		while(rand2 === rand1){
			rand2 = Math.floor(Math.random()*(randLimits[difficulty].max-randLimits[difficulty].min+1)+randLimits[difficulty].min)
		}
		listB.push(actors[rand2])
	}
	//Add card for first actor
	$('#content').prepend('<div class="card actor sectionA"><div class="img-div"><img></div><div class="caption"><strong class="name"></strong></div></div>')
	//Add first actor name to the card and the task area
	$('#content .card:last .name,#task p.actorA strong').text(listA[0].name)
	//If first actor has a thumb add to the card and the task area
	if(listA[0].thumb !== 'null')
	  $('#content .card:last img,#task img.actorA').attr('src',listA[0].thumb).show();
	//get the actor's movies
	getMovies(listA[0],'A');

	//Repeat above for second actor
	$('#content').append('<div class="card actor sectionB"><div class="img-div"><img></div><div class="caption"><strong class="name"></strong></div></div>')
	$('#content .card:last .name,#task p.actorB strong').text(listB[0].name)
	if(listB[0].thumb !== 'null')
		$('#content .card:last img,#task img.actorB').attr('src',listB[0].thumb).show();
	getMovies(listB[0],'B');

	//show the game area
	$('#home').hide();
	$('#game').show();
}

//function to get the movies for the selected actor and store them in the corresponding dropdown list
function getMovies(actor,DOM){
	//Get the actor's movies from tmdb using actor id and store results is actor object as list array
	var url = ajaxURL.movies.replace('{id}',actor.id);
	$.ajax({
		type: 'GET',
		url: url,
		success: function(response) {
			actor.list = [];
			for (var i=0; i<response.movie_credits.cast.length;i++){
				actor.list.push({id:response.movie_credits.cast[i].id,title:response.movie_credits.cast[i].title});
				if(response.movie_credits.cast[i].poster_path)
					actor.list[i].thumb = 'https://image.tmdb.org/t/p/w154'+response.movie_credits.cast[i].poster_path;
				if(response.movie_credits.cast[i].character)
					actor.list[i].char = response.movie_credits.cast[i].character;
				if(response.movie_credits.cast[i].date !== 'null')
					actor.list[i].date = response.movie_credits.cast[i].release_date;
			}
			//Sort movies alphabetically
			actor.list.sort(function(a,b){return (b.title < a.title) ? 1 : ((b.title > a.title) ? -1 : 0);});
			//To sort movies by release date use the following code
			//actor.list.sort(function(a,b){return (a.release_date < b.release_date) ? 1 : ((a.release_date > b.release_date) ? -1 : 0);});
			//Empty dropdown and store the movie titles in it
			$('#dropdown'+DOM+' ul').html('');
			for (var i=0; i<actor.list.length;i++){
				$('#dropdown'+DOM+' .dropdown-menu').append('<li><a href="#">'+actor.list[i].title+'</a>');
			}
			//Put actor name in the dropdown button text
			$('#dropdown'+DOM+' button').html(actor.name+' Movies <span class="caret"></span>');
			//Toggle from 'movies' class to 'actors' class
			$('#dropdown'+DOM).toggleClass('movies actors');
		},
		fail: function(response) {
			console.error('Error');
		}
	})
}

function getActors(movie,DOM){
	//Get the movie's actors from tmdb using movie id and store results is movie object as list array
	var url = ajaxURL.actors.replace('{id}',movie.id);
	$.ajax({
		type: 'GET',
		url: url,
		success: function(response) {
			movie.list = [];
			for (var i=0; i<response.credits.cast.length;i++){
				movie.list.push({id:response.credits.cast[i].id,name:response.credits.cast[i].name});
				if(response.credits.cast[i].profile_path)
					movie.list[i].thumb = 'https://image.tmdb.org/t/p/w154'+response.credits.cast[i].profile_path;
				if(response.credits.cast[i].character)
					movie.list[i].char = response.credits.cast[i].character;
			}
			//Empty dropdown and store the movie titles in it
			$('#dropdown'+DOM+' ul').html('')
			for(var i=0; i<movie.list.length;i++){
				$('#dropdown'+DOM+' .dropdown-menu').append('<li><a href="#">'+movie.list[i].name+'</a></li>')
			}
			//Put movie name in the dropdown button text
			$('#dropdown'+DOM+' button').html('\''+movie.title+'\' Actors <span class="caret"></span>');
			//Toggle from 'actors' class to 'movies' class
			$('#dropdown'+DOM).toggleClass('movies actors');
		},
		fail: function(response) {
			console.error('Error');
		}
	});
}

//Function to run when game completed
function gameComplete(){
	//Hide close buttons and edit success message in task area with number of links (movies)
	$('.card i.fa-times').hide();
	var i = $('#content .card.movie').length;
	var x = i.toString()+' degree';
	//Add 's' to 'degree' if multiple links
	if (i>1)
		x += 's';
	$('#degs-sep span').text(x);
	//Add 'linked' class to close the chain in task area
	$('#task .chain,#content .card').addClass('linked');
	//Show success message
	$('#degs-sep').show();
}

///////BINDED FUNCTIONS

//When play button clicked
$('.cta').click(function(){
	bacon = true;
	//If Kevin Bacon checkbox unchecked then dont use Kevin Bacon as second actor
	if(!($('input[name="bacon"]').is(":checked")))
		bacon = false;
	//Set difficulty based on user input
	difficulty = $('input[name="difficulty"]:checked').attr('value');
	/*If gamed played before in same session, popular actors will be stored in actors,
	no need to get them from tmdb, otherwise get them using getPopulatActors()*/
	if(actors.length > 0)
		startGame();
	else
		getPopularActors(1);
})

//When refresh button clicked restart game with different actors
$('nav .fa-refresh').click(function(){
	startGame();
});

//When back button clickedngo baxk to home page
$('i.back-btn').click(function(){
	$('#home').show();
	$('#game').hide();
})


//When actor or movie selected from dropdown list
/*Note: listA and listB arrays contain the chain of movies/actors.
  listA starts from the top actor (actorA) and elements are added to the end of the array.
  listB starts from the bottom actor (actorB) and elements are added to the top of the array*/
$('[id^=dropdown]').on('click','.dropdown-menu li',function(){
	var index = $(this).index();
	//Find out which dropdown used 'A' or 'B' and set 'list' variable to
	var DOM = $(this).parents('[id^=dropdown]').attr('id').slice(-1);
	list = window['list'+DOM];

	//If list of movies
	if($(this).parents('[id^=dropdown]').hasClass('movies')){
		if(DOM === 'A'){
			//If id of movie selected from dropdown A matches id of the top item in listB then game is complete
			if(list[list.length-1].list[index].id === listB[0].id){
				//Add final chain, hide dropdowns and run gameComplete()
				$('#dropdownA').before('<i class="fa fa-chain"></i>');
				$('[id^=dropdown]').hide();
				gameComplete();
			} else{
				//Add selected movie to the end of listA array
				list.push(list[list.length-1].list[index])
				//Remove 'last' class from previous card, which hides the close button using CSS
				$('#dropdownA').prevAll().removeClass('last');
				//Add a card with movie details
				$('#dropdownA').before('<i class="fa fa-chain"></i><div class="card movie last section'+DOM+'"><i class="fa fa-times close"></i><div class="img-div"><img src="'+list[list.length-1].thumb+'"></div><div class="caption"><strong class="name">'+list[list.length-1].title+'</strong></div></div>')
				//Get the movie's actors and store in dropdown list
				getActors(list[list.length-1],DOM);
			}
		}
		if(DOM === 'B'){
			//If id of movie selected from dropdown B matches id of the bottom item in listA then game is complete
			if(list[0].list[index].id === listA[listA.length-1].id){
				//Add final chain, hide dropdowns and run gameComplete()
				$('#dropdownB').after('<i class="fa fa-chain"></i>');
				$('[id^=dropdown]').hide();
				gameComplete();
			} else {
				//Add selected movie to the top of listB array
				list.unshift(list[0].list[index])
				//Remove 'last' class of the next card, which hides the close button using CSS
				$('#dropdownB').nextAll().removeClass('last');
				//Add a card with movie details
				$('#dropdownB').after('<div class="card movie last section'+DOM+'"><i class="fa fa-times close"></i><div class="img-div"><img src="'+list[0].thumb+'"></div><div class="caption"><strong class="name">'+list[0].title+'</strong></div></div><i class="fa fa-chain"></i>')
				//Get the movie's actors and store in dropdown list
				getActors(list[0],DOM);
			}
		}
	}
	//Else if list of actors, repeat above but for actors
	else if($(this).parents('[id^=dropdown]').hasClass('actors')){
		if(DOM === 'A'){
			//If id of actor selected from dropdown A matches id of the top item in listB then game is complete
			if(list[list.length-1].list[index].id === listB[0].id){
				//Add final chain, hide dropdowns and run gameComplete()
				$('#dropdownA').before('<i class="fa fa-chain"></i>');
				$('[id^=dropdown]').hide();
				gameComplete();
			} else{
				//Add selected actor to the end of listA array
				list.push(list[list.length-1].list[index])
				//Remove 'last' class from previous card, which hides the close button using CSS
				$('#dropdownA').prevAll().removeClass('last');
				//Add a card with actor details
				$('#dropdownA').before('<i class="fa fa-chain"></i><div class="card actor last section'+DOM+'"><i class="fa fa-times close"></i><div class="img-div"><img src="'+list[list.length-1].thumb+'"></div><div class="caption"><strong class="name">'+list[list.length-1].name+'</strong></div></div>')
				//Get the actor's movies and store in dropdown list
				getMovies(list[list.length-1],DOM);
			}
		}
		if(DOM === 'B'){
			//If id of actor selected from dropdown B matches id of the bottom item in listA then game is complete
			if(list[0].list[index].id === listA[listA.length-1].id){
				//Add final chain, hide dropdowns and run gameComplete()
				$('#dropdownB').after('<i class="fa fa-chain"></i>');
				$('[id^=dropdown]').hide();
				gameComplete();
			} else{
				//Add selected actor to the top of listB array
				list.unshift(list[0].list[index])
				//Remove 'last' class of the next card, which hides the close button using CSS
				$('#dropdownB').nextAll().removeClass('last');
				//Add a card with actor details
				$('#dropdownB').after('<div class="card actor last section'+DOM+'"><i class="fa fa-times close"></i><div class="img-div"><img src="'+list[0].thumb+'"></div><div class="caption"><strong class="name">'+list[0].name+'</strong></div></div><i class="fa fa-chain"></i>')
				//Get the actor's movies and store in dropdown list
				getMovies(list[0],DOM);
			}
		}
	}
});


//When a card's close button is clicked
$('#content').on('click','.close',function(){
	//For section A
	if($(this).parent().hasClass('sectionA')){
		//Remove chain and add 'last' class to the prev element
		$(this).parent().prev().remove();
		$(this).parent().prev().addClass('last');
		//Remove element from array
		listA.pop();
		//Get card to be removed is an actor get actors and put in dropdown
		if($(this).parent().hasClass('actor'))
			getActors(listA[listA.length-1],'A');
		//else get movies
		else if($(this).parent().hasClass('movie')){
			getMovies(listA[listA.length-1],'A');
		}
	//Repeat above for sectionB
	}	else if($(this).parent().hasClass('sectionB')){
		$(this).parent().next().remove();
		$(this).parent().next().addClass('last');
		listB.shift();
		if($(this).parent().hasClass('actor'))
			getActors(listB[0],'B');
		else if($(this).parent().hasClass('movie')){
			getMovies(listB[0],'B');
		}
	}
	//Remove card
	$(this).parent().remove();
})



})//end document.ready
