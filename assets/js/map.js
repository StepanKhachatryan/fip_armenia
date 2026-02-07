// =========================================
// 1. VARIABLES
// =========================================
var map;
var markersLayer = new L.LayerGroup();

var floodIcon = L.icon({
    iconUrl: 'assets/icons/flood_marker.png', // Ensure this file exists!
    iconSize:     [24, 24], 
    iconAnchor:   [12, 24], 
    popupAnchor:  [0, -24]  
});

// =========================================
// 2. MAP SETUP
// =========================================
function initMap() {
    if (!document.getElementById('map')) return;

    // Center the map on Armenia
    map = L.map('map', { zoomControl: true }).setView([40.50, 44.50], 9);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    markersLayer.addTo(map);
}

function updateMarkers(data) {
    markersLayer.clearLayers();
    data.forEach(function(item) {
        var marker = L.marker([item.lat, item.lng], { icon: floodIcon });
        
        // When clicked, open the sidebar
        marker.on('click', function() { 
            openSidebar(item); 
        });
        
        // Store date inside the marker options for filtering
        marker.options.date = new Date(item.date); 
        
        markersLayer.addLayer(marker);
    });
}

// =========================================
// 3. SIDEBAR LOGIC (YouTube & Facebook)
// =========================================
function openSidebar(item) {
    var sidebar = document.getElementById('video-sidebar');
    var contentDiv = document.getElementById('sidebar-content');
    
    var videoHtml = '';
    
    if (item.videos && item.videos.length > 0) {
        item.videos.forEach(url => {
            // Check if it's Facebook (needs more height) or YouTube
            let height = "300"; 
            if (url.includes("facebook.com")) {
                height = "500"; // Facebook Reels are tall
            }

            videoHtml += `
                <div class="sidebar-video-container" style="margin-bottom: 20px;">
                    <iframe 
                        src="${url}" 
                        width="100%" 
                        height="${height}" 
                        frameborder="0" 
                        style="border:none; overflow:hidden;" 
                        allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share" 
                        allowfullscreen>
                    </iframe>
                </div>
            `;
        });
    } else {
        videoHtml = '<p>No videos available.</p>';
    }

    contentDiv.innerHTML = `
        <h3 class="sidebar-title" style="margin-top:0;">${item.title}</h3>
        <p class="sidebar-date" style="color:#666; font-weight:bold;">📅 ${item.date}</p>
        <p class="sidebar-description">${item.description}</p>
        <hr>
        ${videoHtml} 
    `;
    
    sidebar.classList.add('active');
}

function closeSidebar() {
    document.getElementById('video-sidebar').classList.remove('active');
}

// =========================================
// 4. NEW SLIDER LOGIC (Updated with Years & Callback)
// =========================================
function initTimeSlider(allData, callback) {
    var slider = document.getElementById('slider');
    var dateLabel = document.getElementById('date-label');

    // 1. Calculate Min/Max Years
    var dates = allData.map(d => new Date(d.date).getTime());
    var minDateObj = new Date(Math.min(...dates));
    var maxDateObj = new Date(Math.max(...dates));

    var startYear = minDateObj.getFullYear();
    var endYear = maxDateObj.getFullYear();
    
    // Set range from Jan 1st of Start Year to Dec 31st of End Year
    var minTimestamp = new Date(startYear, 0, 1).getTime(); 
    var maxTimestamp = new Date(endYear, 11, 31).getTime(); 

    if (slider.noUiSlider) {
        slider.noUiSlider.destroy();
    }

    noUiSlider.create(slider, {
        start: [minTimestamp, maxTimestamp], 
        connect: true,
        range: { 'min': minTimestamp, 'max': maxTimestamp },
        step: 24 * 60 * 60 * 1000, // 1 Day

        // Tooltips show Short Month + Year (e.g., "May 2023")
        tooltips: [
            { to: function(v) { return new Date(parseInt(v)).toLocaleDateString("en-US", { month: 'short', year: 'numeric' }); } },
            { to: function(v) { return new Date(parseInt(v)).toLocaleDateString("en-US", { month: 'short', year: 'numeric' }); } }
        ],

        // Pips only show Start and End Years at the edges
        pips: {
            mode: 'range', 
            density: 100,  
            format: {
                to: function (value) { return new Date(value).getFullYear(); }
            }
        }
    });

    slider.noUiSlider.on('update', function (values) {
        var startDate = new Date(parseInt(values[0]));
        var endDate = new Date(parseInt(values[1]));
        
        // Update the label text on screen
        if(dateLabel) {
            dateLabel.style.display = 'block';
            dateLabel.innerHTML = `Showing: <b>${startDate.toLocaleDateString()}</b> - <b>${endDate.toLocaleDateString()}</b>`;
        }

        var filteredData = allData.filter(item => {
            var itemDate = new Date(item.date).getTime();
            return itemDate >= startDate.getTime() && itemDate <= endDate.getTime();
        });

        // Run the callback (updateMarkers)
        if(callback) callback(filteredData);
    });
}

// =========================================
// 5. START ENGINE (Fetching 'data/floods.json')
// =========================================
document.addEventListener('DOMContentLoaded', function() {
    console.log("App starting...");
    initMap(); 

    // IMPORTANT: This file must be in 'data/floods.json'
    fetch('data/floods.json') 
        .then(response => {
            if (!response.ok) throw new Error("HTTP error " + response.status);
            return response.json();
        })
        .then(data => {
            console.log("Floods data loaded:", data);
            
            // 1. Show all markers initially
            updateMarkers(data);
            
            // 2. Initialize the Slider and pass 'updateMarkers' as the callback
            initTimeSlider(data, updateMarkers);
        })
        .catch(error => {
            console.error("Error loading JSON:", error);
            // Fallback for debugging if file fails to load
            alert("Error loading map data. Are you using Live Server?");
        });
});
