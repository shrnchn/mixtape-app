var app = {};

////////////////// google maps api //////////////////

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


app.codeAddress = function(){
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
							app.displayMap();
							app.showRoute();
							$('input[type="radio"]').attr('checked', false);
							$("#bottom").get(0).scrollIntoView();
						} 

					} else {
						alert('Please enter valid location');
					}
				});
			} else {
				// fail alert
				alert('Please enter valid location');
			}
		});



		// reset inputs
		$('input[name="origin-address"]').val('');
		$('input[name="destination-address"]').val('');

	}
};

// creates and displays map
app.displayMap = function(){

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

			console.log(drivingTimeValue, 'seconds');

			drivingTimeValue = drivingTimeValue / 60;
			console.log(drivingTimeValue, 'mins');
			var drivingTimeRounded = Math.round(drivingTimeValue);
			console.log(drivingTimeRounded, 'mins rounded');

			$('.distance').text(distance);
			$('.duration').text(drivingTime);

			app.estimateNumberSongs(drivingTimeRounded);
		}
	});
};

app.showRoute = function(){

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
	var orgInfo = 'Origin: '+ orgAddress;
	var destInfo = 'Destination: ' + destAddress;

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

////////////////// echonest api //////////////////

var genre;

app.getMusicGenre = function(){

	$('input[type="radio"]').on('click', function(){
	// when button is clicked, store the genre in a variable
		genre = $(this).data('genre');
		// encode genres with multiple words
		genre = encodeURIComponent(genre);
	});
};

// get number of songs
app.estimateNumberSongs = function(drivingtime){
	
	var numberOfSongs;

	if(drivingtime >= 0.5 && drivingtime <= 60) {
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

	app.createPlaylist(numberOfSongs);
};

app.createPlaylist = function(numberOfSongs){

	var api_key = 'UFGYPYEHNZHWIKORQ';
	
	$.ajax({
		url: 'http://developer.echonest.com/api/v4/playlist/basic?api_key='+api_key+'&genre='+genre+'&format=json&results='+numberOfSongs+'&type=genre-radio',

		type: 'GET',
		dataType: 'json',
		success: function(result){
			console.log(result);
			app.songs = result.response.songs;

			$.each(result.response.songs,function(i,song){
				var li = $('<li>').text(song.title + ' by ' + song.artist_name);
				$('.playlist ol').append(li);


				console.log(song.title + ' by ' + song.artist_name);
			});

		},
		error: function(err){
			console.log(err);
		}
	});
};

app.init = function(){

	var getMusic = app.getMusicGenre();

	$('input[type="button"]').on('click', function(e){
		e.preventDefault();

		if(genre === undefined) {
			alert('Please select a genre.');
		} else {
			app.codeAddress();
		}
	});

	$('#reset').on('click', function() {
	    location.reload();
	})
};


////////////////// doc ready //////////////////

$(function(){
	app.init();
});