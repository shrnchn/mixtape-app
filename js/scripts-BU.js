var app = {};

// set global variables
var origin;
var destination;

var orgAddress;
var destAddress;

var latlng;
var geocoder;
var map;

var distance;
var time;

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
				console.log(origin);
			} else {
				// fail alert
				console.log('Geocode was not successful for the following reason: ' + status);
			}
		});

		geocoder.geocode({'address': destAddress},function(results, status){
			if(status == google.maps.GeocoderStatus.OK) {
				destination = results[0].geometry.location;
				// if both locations are okay, display map
				console.log(destination);
				// app.displayMap();
				// app.showRoute();
			} else {
				console.log('Geocode was not successful for the following reason: ' + status);
			}
		});

		var checker = window.setInterval(function(){
			if(destination && origin) {
				app.displayMap();
				app.showRoute();
				// stop the checker
				clearInterval(checker);
			}
		},200);

	}
};


// creates and displays map
app.displayMap = function(){

	// center of the map (calculates mean value between two locations)
	latlng = new google.maps.LatLng((origin.lat()+destination.lat())/2,(origin.lng()+destination.lng())/2);
	console.log('latlng',latlng);

	// map styles
	var mapStyle = [{"featureType":"administrative","elementType":"labels.text.fill","stylers":[{"color":"#444444"}]},{"featureType":"landscape","elementType":"all","stylers":[{"color":"#f2f2f2"}]},{"featureType":"poi","elementType":"all","stylers":[{"visibility":"off"}]},{"featureType":"road","elementType":"all","stylers":[{"saturation":-100},{"lightness":45}]},{"featureType":"road.highway","elementType":"all","stylers":[{"visibility":"simplified"}]},{"featureType":"road.arterial","elementType":"labels.icon","stylers":[{"visibility":"off"}]},{"featureType":"transit","elementType":"all","stylers":[{"visibility":"off"}]},{"featureType":"water","elementType":"all","stylers":[{"color":"#46bcec"},{"visibility":"on"}]}];

	// set map options
	var mapOptions = {
		zoom: 1,
		center: latlng,
		styles: mapStyle 
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
			console.log(distance);

			// driving time
			time = response.routes[0].legs[0].duration.text;
			console.log(time);

			$('.distance').text('Distance: ' + distance);
			$('.duration').text('Duration: ' + time);
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

app.init = function(){
	$('#routes').on('submit', function(e){
		e.preventDefault();
		app.codeAddress();
	});
		// app.codeAddress();
};

$(function(){
	app.init();
});