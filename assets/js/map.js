var map;
var markersLayer = new L.LayerGroup();

// --- 1. Define Custom Icon ---
var floodIcon = L.icon({
    iconUrl: 'assets/icons/flood_marker.png',
    
    // UPDATED: Smaller size values
    iconSize:     [24, 24], // Adjusted to be much smaller
    iconAnchor:   [12, 24], // Half width, full height to anchor at bottom center
    popupAnchor:  [0, -24]  // Popup opens just above the icon
});

function initMap() {
    map = L.map('map', {
        zoomControl: true 
    }).setView([40.0691, 45.0382], 8);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    markersLayer.addTo(map);
}

function closeSidebar() {
    document.getElementById('video-sidebar').classList.remove('active');
}

function updateMarkers(data) {
    markersLayer.clearLayers();

    data.forEach(function(item) {
        var marker = L.marker([item.lat, item.lng], { icon: floodIcon });
        
        marker.on('click', function() {
            openSidebar(item);
        });

        marker.options.date = new Date(item.date);
        markersLayer.addLayer(marker);
    });
}

function openSidebar(item) {
    var sidebar = document.getElementById('video-sidebar');
    var contentDiv = document.getElementById('sidebar-content');

    contentDiv.innerHTML = `
        <div class="sidebar-title">${item.title}</div>
        <span class="sidebar-date">📅 ${item.date}</span>
        <div class="sidebar-video-container">
            <iframe src="${item.video_url}" allowfullscreen></iframe>
        </div>
        <p class="sidebar-description">${item.description}</p>
    `;

    sidebar.classList.add('active');
}
