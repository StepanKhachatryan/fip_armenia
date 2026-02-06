var map;
var markersLayer = new L.LayerGroup();

// --- 1. Define Custom Icon ---
var floodIcon = L.icon({
    iconUrl: 'assets/icons/flood_marker.png', // MAKE SURE THIS FILE EXISTS
    iconSize:     [24, 24], 
    iconAnchor:   [12, 24], 
    popupAnchor:  [0, -24]  
});

// --- 2. TEMPORARY DATA (So you can see points!) ---
var floodData = [
   {
    "id": 9,
    "lat": 40.266148, 
    "lng": 44.615583,
    "date": "2026-02-04",
    "title": "Ջրածածկում Աբովյան քաղաքում",
    "videos": [
      "https://www.facebook.com/plugins/video.php?height=476&href=https%3A%2F%2Fwww.facebook.com%2Freel%2F918174374233362%2F&show_text=false&width=267&t=0"
    ],
    "description": "Ձնհալի և անձրևի հետևանքով Աբովյան քաղաքի փողոցում ջրածածկում է"
   },
   // Add another point to test
   {
    "id": 10,
    "lat": 40.0691, 
    "lng": 45.0382,
    "date": "2026-02-05",
    "title": "Test Location",
    "videos": [],
    "description": "Testing map center"
   }
];

function initMap() {
    // Check if map container exists to avoid errors
    if (!document.getElementById('map')) return;

    map = L.map('map', {
        zoomControl: true 
    }).setView([40.0691, 45.0382], 8);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    markersLayer.addTo(map);
}

function closeSidebar() {
    var sidebar = document.getElementById('video-sidebar');
    if (sidebar) sidebar.classList.remove('active');
}

function updateMarkers(data) {
    markersLayer.clearLayers();

    data.forEach(function(item) {
        var marker = L.marker([item.lat, item.lng], { icon: floodIcon });
        
        marker.on('click', function() {
            openSidebar(item);
        });

        // Store date for filtering later
        marker.options.date = new Date(item.date);
        markersLayer.addLayer(marker);
    });
}

function openSidebar(item) {
    var sidebar = document.getElementById('video-sidebar');
    var contentDiv = document.getElementById('sidebar-content');

    var videoHtmlBlock = '';
    
    if (item.videos && item.videos.length > 0) {
        item.videos.forEach(function(url) {
            videoHtmlBlock += `
                <div class="sidebar-video-container" style="margin-bottom: 20px;">
                    <iframe src="${url}" width="100%" height="400" frameborder="0" allowfullscreen></iframe>
                </div>
            `;
        });
    } else {
        videoHtmlBlock = '<p>No videos available for this event.</p>';
    }

    contentDiv.innerHTML = `
        <div class="sidebar-title">${item.title}</div>
        <span class="sidebar-date">📅 ${item.date}</span>
        
        ${videoHtmlBlock} <p class="sidebar-description">${item.description}</p>
    `;

    sidebar.classList.add('active');
}

// --- 3. THE "START ENGINE" COMMAND ---
// This listens for the page to load, then runs the map and adds data
document.addEventListener('DOMContentLoaded', function() {
    console.log("Page loaded, initializing map...");
    initMap();
    updateMarkers(floodData);
});
