var map;
var markersLayer = new L.LayerGroup();

// --- 1. Define Custom Icon ---
// Make sure you save your image as 'flood_marker.png' in the icons folder
var floodIcon = L.icon({
    iconUrl: 'assets/icons/flood_marker.png',
    
    iconSize:     [40, 40], // size of the icon (adjust if your image is different)
    iconAnchor:   [20, 40], // point of the icon which will correspond to marker's location
    popupAnchor:  [0, -40]  // point from which the popup should open relative to the iconAnchor
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
        // --- 2. Use Custom Icon Here ---
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
