// namespace
var mixTape = {};

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

var videoId;
var videoURL;

mixTape.YTkey = 'AIzaSyC-9taR1ub2rdbKEZkpeNYPrGUBXY-UyQY';
mixTape.ENkey = 'UFGYPYEHNZHWIKORQ';

mixTape.codeAddress = function(){
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
							mixTape.displayMap();
							mixTape.showRoute();
							$('input[type="radio"]').attr('checked', false);
							$("#bottom").get(0).scrollIntoView();
						} 

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
mixTape.displayMap = function(){

	// center of the map (calculates mean value between two locations)
	latlng = new google.maps.LatLng((origin.lat()+destination.lat())/2,(origin.lng()+destination.lng())/2);
	// console.log('latlng',latlng);

	// map styles
	var mapStyle = [{"featureType":"administrative","elementType":"labels.text.fill","stylers":[{"color":"#444444"}]},{"featureType":"landscape","elementType":"all","stylers":[{"color":"#f2f2f2"}]},{"featureType":"poi","elementType":"all","stylers":[{"visibility":"off"}]},{"featureType":"road","elementType":"all","stylers":[{"saturation":-100},{"lightness":45}]},{"featureType":"road.highway","elementType":"all","stylers":[{"visibility":"simplified"}]},{"featureType":"road.arterial","elementType":"labels.icon","stylers":[{"visibility":"off"}]},{"featureType":"transit","elementType":"all","stylers":[{"visibility":"off"}]},{"featureType":"water","elementType":"all","stylers":[{"color":"#46bcec"},{"visibility":"on"}]}];

	// set map options
	var mapOptions = {
		zoom: 1,
		center: latlng,
		styles: mapStyle,
		scrollwheel: false
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
			$('.distance').text(distance);
			$('.duration').text(drivingTime);

			mixTape.estimateNumberSongs(drivingTimeRounded);
		}
	});
};

mixTape.showRoute = function(){

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

	// creates info windows for origin and destination
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

mixTape.getMusicGenre = function(){

	$('input[type="radio"]').on('click', function(){
	// when button is clicked, store the genre in a variable
		genre = $(this).data('genre');
		$('.genre-name').text(genre);
		// encode genres with multiple words
		genre = encodeURIComponent(genre);
	});
};

// get number of songs
mixTape.estimateNumberSongs = function(drivingtime){
	
	var numberOfSongs;

	if(drivingtime = 0 || drivingtime <= 60) {
		numberOfSongs = 15;
	} else if(drivingtime >= 61 && drivingtime <= 120) {
		numberOfSongs = 30;
	} else if(drivingtime >= 121 && drivingtime <= 240) {
		numberOfSongs = 60;
	} else if(drivingtime >= 241 && drivingtime <= 360) {
		numberOfSongs = 90;
	} else if(drivingtime >= 361 && drivingtime <= 480) {
		numberOfSongs = 120;
	} else {
		numberOfSongs = 250;
	}

	mixTape.createPlaylist(numberOfSongs);
};

mixTape.createPlaylist = function(numberOfSongs){
	
	$.ajax({
		url: 'http://developer.echonest.com/api/v4/playlist/basic?api_key='+mixTape.ENkey+'&genre='+genre+'&format=json&results='+numberOfSongs+'&type=genre-radio',

		type: 'GET',
		dataType: 'json',
		success: function(result){
			console.log(result);
			mixTape.songs = result.response.songs;

			$.each(result.response.songs,function(i,song){
				var youtube = 'https://www.youtube.com/watch?v=';
				var li = $('<li>').text(song.title + ' by ' + song.artist_name);
				$('.playlist ol').append(li);

				mixTape.getVideoId(song.title + song.artist_name);

				// $('li').html('<a href="'+youtube+'">'+li);

			});

		},
		error: function(err){
			console.log(err);
		}
	});
};

mixTape.getVideoId = function(songName){
	$.ajax({
		url: "https://www.googleapis.com/youtube/v3/search",
		type: "GET",
		data: {
			v:3,
			part: "snippet",
			q: songName,
			type: "video",
			maxResults: 1,
			key: mixTape.YTkey
		},
		success: function(result){
			console.log(result);
			videoId = result.items[0].id.videoId;
			console.log(videoId);
		}
	});
};

mixTape.createVideoLink = function(){

};

mixTape.init = function(){

	var getMusic = mixTape.getMusicGenre();

	$('input[type="button"]').on('click', function(e){
		e.preventDefault();

		if(genre === undefined) {
			swal({   
				title: "Error!",
				text: "Please select a genre.",
				type: "error",
				confirmButtonText: "Got it!"
			});
		} else {
			mixTape.codeAddress();
		}
	});

	$('#reset').on('click', function() {
	    location.reload();
	    $(window).scrollTop(0);
	});
};

$(function(){
	mixTape.init();
});
