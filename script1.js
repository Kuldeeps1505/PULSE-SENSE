// Declare global variables
var map = L.map('map').setView([51.505, -0.09], 13);  // Default location
var isEmergencyMode = false;
var userLocation = null;
var currentRoute = null;  // To store the current route for time estimation

// Add OpenStreetMap tiles to the map
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

// Get the user's current location
map.locate({setView: true, maxZoom: 16});

// Event handler when map is successfully located
map.on('locationfound', function(e) {
    userLocation = e.latlng;
    L.marker(e.latlng).addTo(map).bindPopup("You are here").openPopup();
    map.setView(e.latlng, 13);
    if (isEmergencyMode) {
        findNearbyHospitals(e.latlng);  // Show hospitals if in emergency mode
    }
});

// Event handler for location error
map.on('locationerror', function() {
    alert("Could not get your location.");
});

// Toggle Emergency Mode
function toggleEmergencyMode() {
    isEmergencyMode = !isEmergencyMode;
    if (isEmergencyMode && userLocation) {
        findNearbyHospitals(userLocation);  // Show hospitals in emergency mode
    } else {
        alert("Emergency mode is now " + (isEmergencyMode ? "on" : "off"));
    }
}

// Find nearby hospitals function (based on Overpass API)
function findNearbyHospitals(latlng) {
    var overpassAPI = `https://overpass-api.de/api/interpreter?data=[out:json];(node["amenity"="hospital"](around:5000,${latlng.lat},${latlng.lng}););out;`;
    
    fetch(overpassAPI)
        .then(response => response.json())
        .then(data => {
            data.elements.forEach(function(hospital) {
                var marker = L.marker([hospital.lat, hospital.lon]).addTo(map);
                marker.bindPopup("Hospital: " + (hospital.tags.name || 'Unknown'));
                marker.on('click', function() {
                    // Remove the previous route if it exists
                    if (currentRoute) {
                        map.removeControl(currentRoute);
                    }

                    // Create routing control to this hospital using OSRM
                    currentRoute = L.Routing.control({
                        waypoints: [
                            L.latLng(latlng.lat, latlng.lng), // User location
                            L.latLng(hospital.lat, hospital.lon) // Hospital location
                        ],
                        routeWhileDragging: true,
                        createMarker: function() { return null; }, // No marker on route
                        instructions: true,
                        router: L.Routing.osrmv1()  // Using OSRM as routing engine
                    }).on('routesfound', function(e) {
                        var time = e.routes[0].summary.totalTime / 60; // Time in minutes
                        alert("Estimated time: " + time.toFixed(0) + " minutes");
                    }).addTo(map);

                    // Show the Start Navigation button
                    showStartNavigationButton(hospital);
                });
            });
        })
        .catch(err => console.log("Error finding hospitals: ", err));
}

// Show Start Navigation button and handle click event
function showStartNavigationButton(hospital) {
    // Create or update the button for starting navigation
    let button = document.getElementById('startNavButton');
    if (!button) {
        button = document.createElement('button');
        button.id = 'startNavButton';
        button.innerText = 'Start Navigation';
        button.style.marginTop = '10px';
        button.onclick = function() {
            // Start the route navigation with instructions
            if (currentRoute) {
                currentRoute.setWaypoints([
                    L.latLng(userLocation.lat, userLocation.lng),
                    L.latLng(hospital.lat, hospital.lon)
                ]);
                currentRoute.getRouter().route();
            }
        };
        document.body.appendChild(button);
    } else {
        button.style.display = 'block'; // Make sure the button is visible
    }
}

// Search hospitals function (non-emergency search)
function searchHospital() {
    var searchQuery = document.getElementById("searchHospital").value;
    if (searchQuery) {
        var geocoder = L.Control.Geocoder.nominatim();
        geocoder.geocode(searchQuery, function(results) {
            if (results && results.length > 0) {
                var latlng = results[0].center;
                map.setView(latlng, 13);
                L.marker(latlng).addTo(map).bindPopup("Found: " + searchQuery).openPopup();

                // After searching, let's set up routing to the hospital
                if (userLocation) {
                    // Use OSRM to route to the found hospital
                    currentRoute = L.Routing.control({
                        waypoints: [
                            L.latLng(userLocation.lat, userLocation.lng),
                            latlng
                        ],
                        routeWhileDragging: true,
                        createMarker: function() { return null; }, // No marker on route
                        instructions: true,
                        router: L.Routing.osrmv1()  // Using OSRM as routing engine
                    }).on('routesfound', function(e) {
                        var time = e.routes[0].summary.totalTime / 60; // Time in minutes
                        alert("Estimated time: " + time.toFixed(0) + " minutes");
                    }).addTo(map);
                }
            } else {
                alert("No hospitals found.");
            }
        });
    } else {
        alert("Please enter a search term.");
    }
}
