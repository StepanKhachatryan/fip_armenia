var map;
var markersLayer = new L.LayerGroup();

// --- 1. Define Custom Icon ---
var floodIcon = L.icon({
    iconUrl: 'assets/icons/flood_marker.png',
    
    // UPDATED: Smaller size values
    iconSize:     [24, 24], 
    iconAnchor:   [12, 24], 
    popupAnchor:  [0, -24]  
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

    // --- NEW LOGIC: Loop through multiple videos ---
    var videoHtmlBlock = '';
    
    // Check if the 'videos' array exists and has items
    if (item.videos && item.videos.length > 0) {
        item.videos.forEach(function(url) {
            videoHtmlBlock += `
                <div class="sidebar-video-container" style="margin-bottom: 20px;">
                    <iframe src="${url}" allowfullscreen></iframe>
                </div>
            `;
        });
    } else {
        // Fallback if no video is found
        videoHtmlBlock = '<p>No videos available for this event.</p>';
    }

    // Inject the content
    contentDiv.innerHTML = `
        <div class="sidebar-title">${item.title}</div>
        <span class="sidebar-date">📅 ${item.date}</span>
        
        ${videoHtmlBlock} <p class="sidebar-description">${item.description}</p>
    `;

    sidebar.classList.add('active');
}
