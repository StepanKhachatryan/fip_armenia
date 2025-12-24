// Global variable to hold the map instance
var map;
var markersLayer = new L.LayerGroup(); // Group to hold all markers

function initMap() {
    // 1. Initialize Map centered on Armenia
    map = L.map('map').setView([40.0691, 45.0382], 8);

    // 2. Add OpenStreetMap Tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    // 3. Add the layer group to the map
    markersLayer.addTo(map);
}

function updateMarkers(data) {
    // Clear existing markers before adding new ones
    markersLayer.clearLayers();

    data.forEach(function(item) {
        var marker = L.marker([item.lat, item.lng]);

        // Build the Popup HTML
        var popupContent = `
            <div class="video-popup">
                <h3>${item.title}</h3>
                <p>📅 ${item.date}</p>
                <iframe src="${item.video_url}" frameborder="0" allowfullscreen></iframe>
                <p>${item.description}</p>
            </div>
        `;

        marker.bindPopup(popupContent);
        markersLayer.addLayer(marker);
    });
}
