// namespace
var mixtape = {};

// set global variables
var origin;
var destination;

var orgAddress;
var destAddress;

var latlng;
var geocoder;
var map;

var distance;
var drivingTime;
var drivingTimeValue;

var genre;
var genreName;

var videoId;
var videoURL;

mixtape.YTkey = 'AIzaSyC-9taR1ub2rdbKEZkpeNYPrGUBXY-UyQY';
mixtape.ENkey = 'UFGYPYEHNZHWIKORQ';

mixtape.codeAddress = function(){
	// reset 
	origin = null;
	destination = null;
	
	// creates new geocode object
	geocoder = new google.maps.Geocoder();

	// get address values from inputs
	orgAddress = $('input[name="origin-address"]').val();
	destAddress = $('input[name="destination-address"]').val();

	// get geocode coords
	if(geocoder) {

		geocoder.geocode({'address': orgAddress},function(results, status){
			// check if status from google geocoder is okay
			// if is okay, store results in origin
			if(status == google.maps.GeocoderStatus.OK) {
				origin = results[0].geometry.location;
				geocoder.geocode({'address': destAddress},function(results, status){
					if(status == google.maps.GeocoderStatus.OK) {
						destination = results[0].geometry.location;
						// if both locations are okay, display map
						if(destination && origin) {
							$('section#bottom').css('display','block');
							mixtape.displayMap();
							mixtape.showRoute();
							$('input[type="radio"]').attr('checked', false);
							$("#bottom").get(0).scrollIntoView();
						} else {
							alert('Broken!');
						}
					// fail alert
					} else {
						swal({   
							title: "Error!",
							text: "Please enter a valid location.",
							type: "error",
							confirmButtonText: "Got it!"
						});
					}
				});
			} else {
				// fail alert
				swal({   
					title: "Error!",
					text: "Please enter a valid location.",
					type: "error",
					confirmButtonText: "Got it!"
				});
			}
		});
		// reset inputs
		$('input[name="origin-address"]').val('');
		$('input[name="destination-address"]').val('');
	}
};

// creates and displays map
mixtape.displayMap = function(){

	// center of the map (calculates mean value between two locations)
	latlng = new google.maps.LatLng((origin.lat()+destination.lat())/2,(origin.lng()+destination.lng())/2);
	// console.log('latlng',latlng);

	// map styles
	var mapStyle = [{"featureType":"administrative","elementType":"labels.text.fill","stylers":[{"color":"#444444"}]},{"featureType":"landscape","elementType":"all","stylers":[{"color":"#f2f2f2"}]},{"featureType":"poi","elementType":"all","stylers":[{"visibility":"off"}]},{"featureType":"road","elementType":"all","stylers":[{"saturation":-100},{"lightness":45}]},{"featureType":"road.highway","elementType":"all","stylers":[{"visibility":"simplified"}]},{"featureType":"road.arterial","elementType":"labels.icon","stylers":[{"visibility":"off"}]},{"featureType":"transit","elementType":"all","stylers":[{"visibility":"off"}]},{"featureType":"water","elementType":"all","stylers":[{"color":"#46bcec"},{"visibility":"on"}]}];

	var windowSize = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);

	// if window size is greater than 480px, allow draggable
	var isDraggable = windowSize > 480 ? true : false;

	// set map options
	var mapOptions = {
		zoom: 1,
		center: latlng,
		styles: mapStyle,
		scrollwheel: false,
		draggable: isDraggable
	};

	// creates map object, set map into div
	map = new google.maps.Map(document.getElementById('mapCanvas'), mapOptions);

	// show route between the points
	directionsService = new google.maps.DirectionsService();
	directionsDisplay = new google.maps.DirectionsRenderer(
	{
		suppressMarkers: true,
		suppressInfoWindows: true
	});

	directionsDisplay.setMap(map);

	var request = {
		origin: origin,
		destination: destination,
		travelMode: google.maps.DirectionsTravelMode.DRIVING
	};

	directionsService.route(request,function(response, status){
		if(status == google.maps.DirectionsStatus.OK) {
			directionsDisplay.setDirections(response);

			// distance between two points
			distance = response.routes[0].legs[0].distance.text;

			// driving time
			drivingTime = response.routes[0].legs[0].duration.text;

			// driving time value, no string
			drivingTimeValue = response.routes[0].legs[0].duration.value;
			drivingTimeValue = drivingTimeValue / 60;
			var drivingTimeRounded = Math.round(drivingTimeValue);

			// console.log(drivingTimeRounded);
			// put text into divs
			$('.from').text(orgAddress);
			$('.to').text(destAddress);
			$('.distance').text(distance);
			$('.duration').text(drivingTime);

			mixtape.estimateNumberSongs(drivingTimeRounded);

		// if status of route is not okay, do fail alert
		} else {
			swal({   
				title: "Error!",
				text: "This route may not be drivable or the location needs to be more specific. Please try again.",
				type: "error",
				confirmButtonText: "Got it!"
			}, function(){
				// reload window at top when alert is done
				location.reload();
				window.onbeforeunload = function(){ window.scrollTo(0,0); }
			});

		}
	});
};

// blue and green road lines
mixtape.showRoute = function(){

	// show route between origin and destination
	var route = new google.maps.Polyline({
		map: map,
		path: [origin, destination],
		strokeWeight: 10,
		strokeOpacity: 0.7,
		strokeColor: "#b4da55"
	});

	// creates markers for origin and destination
	var orgMarker = new google.maps.Marker({
		map: map,
		position: origin,
		title: "Origin"
	});

	var destMarker = new google.maps.Marker({
		map: map,
		position: destination,
		title: "Destination"
	});

	// creates info windows for origin and destination, set text inside
	var orgInfo = 'Start: '+ orgAddress;
	var destInfo = 'End: ' + destAddress;

	var orgWindow = new google.maps.InfoWindow({
		content: orgInfo
	});
	var destWindow = new google.maps.InfoWindow({
		content: destInfo
	});

	// origin
	google.maps.event.addListener(orgMarker, 'click', function() {
	 // set the content and open the window
	 orgWindow.setContent(orgInfo);
	 orgWindow.open(map, orgMarker);
	});

	// destination
	google.maps.event.addListener(destMarker, 'click', function() {
	 // set the content and open the window
	 destWindow.setContent(destInfo);
	 destWindow.open(map, destMarker);
	});

};

// get music genre from input radio, only one choice can be selected
mixtape.getMusicGenre = function(){

	$('input[type="radio"]').on('click', function(){
	// when button is clicked, store the genre in a variable
		genreName = $(this).data('genre');
		// encode genres with multiple words
		genre = encodeURIComponent(genreName);
	});
};

// get number of songs, just an estimation..rounded up
// avg of 4.5mins per song...estimating driving minutes/hrs divided per song
// note: echonest api won't display pass 250 songs for results
// todo: write this more efficiently
mixtape.estimateNumberSongs = function(drivingtime){

	var numberOfSongs;

	if(drivingtime >= 0 && drivingtime <= 60) {
		numberOfSongs = 15;
	} else if(drivingtime >= 60 && drivingtime <= 120) {
		numberOfSongs = 30;
	} else if(drivingtime >= 120 && drivingtime <= 180) {
		numberOfSongs = 40;
	} else if(drivingtime >= 180 && drivingtime <= 240) {
		numberOfSongs = 55;
	} else if(drivingtime >= 240 && drivingtime <= 300) {
		numberOfSongs = 70;
	} else if(drivingtime >= 300 && drivingtime <= 360) {
		numberOfSongs = 80;
	} else if(drivingtime >= 360 && drivingtime <= 420) {
		numberOfSongs = 90;
	} else if(drivingtime >= 420 && drivingtime <= 480) {
		numberOfSongs = 110;
	} else if(drivingtime >= 480 && drivingtime <= 540) {
		numberOfSongs = 120;
	} else if(drivingtime >= 540 && drivingtime <= 600) {
		numberOfSongs = 135;
	} else if(drivingtime >= 600 && drivingtime <= 660) {
		numberOfSongs = 150
	} else if(drivingtime >= 660 && drivingtime <= 700) {
		numberOfSongs = 160;
	} else if(drivingtime >= 700 && drivingtime <= 760) {
		numberOfSongs = 170;
	} else if(drivingtime >= 760 && drivingtime <= 800) {
		numberOfSongs = 180;
	} else if(drivingtime >= 800 && drivingtime <= 860) {
		numberOfSongs = 190;
	} else if(drivingtime >= 860 && drivingtime <= 920) {
		numberOfSongs = 210;
	} else if(drivingtime >= 920 && drivingtime <= 980) {
		numberOfSongs = 220;
	} else if(drivingtime >= 980 && drivingtime <= 1040) {
		numberOfSongs = 230;
	} else {
		numberOfSongs = 250;
	}

	// pass in estimation number of songs to create playlist..display that number
	mixtape.createPlaylist(numberOfSongs);
};

mixtape.createPlaylist = function(numberOfSongs){
	// ajax call to echonest api
	$.ajax({
		url: 'http://developer.echonest.com/api/v4/playlist/basic?api_key='+mixtape.ENkey+'&genre='+genre+'&format=json&results='+numberOfSongs+'&type=genre-radio',

		type: 'GET',
		dataType: 'json',
		success: function(result){
			// change playlist title
			$('.genre-name').text(genreName);

			// console.log(result);
			mixtape.songs = result.response.songs;
			// loop each song and display it as a list
			$.each(result.response.songs,function(i,song){
				// create a link with song title and artist name inside
				var a = $('<a>').text(song.title + ' by ' + song.artist_name);
				// append that link into the list item
				var li = $('<li>').append(a);

				$('.playlist ol').append(li);

				// pass song title and artist name in list to get youtube videos in order
				mixtape.getVideoId(song.title + song.artist_name, li);

			});
		}
	});
};

// get video ID to pass into youtube URL
mixtape.getVideoId = function(songName, li){
	// ajax call to youtube api
	$.ajax({
		url: "https://www.googleapis.com/youtube/v3/search",
		type: "GET",
		data: {
			part: "snippet",
			q: songName,
			type: "video",
			maxResults: 1,
			key: mixtape.YTkey
		},
		success: function(result){
			// if video can't be found in object, append msg to list item
			if(!result.items[0]) {
				var noVidMsg = " - No video sorry!";

				$(li).append('<span class="noVidMsg">'+noVidMsg+'</span>');
				return; // skip it! 
			}

			// store youtube vid id into variable, pass it into a string to create videoURL
			videoId = result.items[0].id.videoId;
			// console.log(videoId);

			var videoURL = 'https://www.youtube.com/watch?v=' + videoId;
			
			// in list, find anchor, replace href with videoURL, add class for styling
			$(li).find('a').attr({
				'href' : videoURL,
				target : '_blank',
				'class': 'slide-left-right'
			});
		}
	});
};

mixtape.init = function(){

	// get genre value
	mixtape.getMusicGenre();

	// when let's go button is clicked,
	$('input[type="button"]').on('click', function(e){
		e.preventDefault();
		// check if genre is undefined, if so..do fail alert
		if(genre === undefined) {
			swal({   
				title: "Error!",
				text: "Please select a genre.",
				type: "error",
				confirmButtonText: "Got it!"
			});
		// if not, code the routes on map and display the playlist with songs
		} else {
			$('.playlist ol').empty();
			mixtape.codeAddress();
		}
	});

	// if search again button is clicked, reload site to top of window
	$('#reset').on('click', function() {
	    // reload window at top
	    location.reload();
	    window.onbeforeunload = function(){ window.scrollTo(0,0); }
	});
};

// doc ready, run this shiz!
$(function(){
	mixtape.init();
});
