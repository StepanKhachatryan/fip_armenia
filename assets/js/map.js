// =========================================
// 1. VARIABLES
// =========================================
var map;
var markersLayer = new L.LayerGroup();

var floodIcon = L.icon({
    iconUrl: 'assets/icons/flood_marker.png', 
    iconSize:     [24, 24], 
    iconAnchor:   [12, 24], 
    popupAnchor:  [0, -24]  
});

// =========================================
// 2. MAP SETUP
// =========================================
function initMap() {
    if (!document.getElementById('map')) return;

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
        marker.on('click', function() { openSidebar(item); });
        marker.options.date = new Date(item.date); 
        markersLayer.addLayer(marker);
    });
}

// =========================================
// 3. SIDEBAR LOGIC (Smart Resizing)
// =========================================
function openSidebar(item) {
    var sidebar = document.getElementById('video-sidebar');
    var contentDiv = document.getElementById('sidebar-content');
    
    var videoHtml = '';
    
    if (item.videos && item.videos.length > 0) {
        item.videos.forEach(url => {
            
            // --- SMART VIDEO SIZING ---
            var isFacebook = url.includes("facebook.com");
            
            // Default settings for YouTube (Landscape/Wide)
            var width = "100%";
            var height = "300";
            var containerStyle = "margin-bottom: 20px;";

            // Special settings for Facebook (Vertical Reels)
            if (isFacebook) {
                width = "270";   // Fixed width (like a phone screen)
                height = "480";  // Fixed height (9:16 aspect ratio)
                // This centers the vertical video in the sidebar
                containerStyle = "margin-bottom: 20px; display: flex; justify-content: center;"; 
            }

            videoHtml += `
                <div class="sidebar-video-container" style="${containerStyle}">
                    <iframe 
                        src="${url}" 
                        width="${width}" 
                        height="${height}" 
                        frameborder="0" 
                        style="border:none; overflow:hidden; border-radius: 8px;" 
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
// 4. SLIDER LOGIC
// =========================================
function initTimeSlider(allData, callback) {
    var slider = document.getElementById('slider');
    var dateLabel = document.getElementById('date-label');

    var dates = allData.map(d => new Date(d.date).getTime());
    var minDateObj = new Date(Math.min(...dates));
    var maxDateObj = new Date(Math.max(...dates));

    var startYear = minDateObj.getFullYear();
    var endYear = maxDateObj.getFullYear();
    
    var minTimestamp = new Date(startYear, 0, 1).getTime(); 
    var maxTimestamp = new Date(endYear, 11, 31).getTime(); 

    if (slider.noUiSlider) slider.noUiSlider.destroy();

    noUiSlider.create(slider, {
        start: [minTimestamp, maxTimestamp], 
        connect: true,
        range: { 'min': minTimestamp, 'max': maxTimestamp },
        step: 24 * 60 * 60 * 1000, 
        tooltips: [
            { to: function(v) { return new Date(parseInt(v)).toLocaleDateString("en-US", { month: 'short', year: 'numeric' }); } },
            { to: function(v) { return new Date(parseInt(v)).toLocaleDateString("en-US", { month: 'short', year: 'numeric' }); } }
        ],
        pips: {
            mode: 'range', 
            density: 100,  
            format: { to: function (value) { return new Date(value).getFullYear(); } }
        }
    });

    slider.noUiSlider.on('update', function (values) {
        var startDate = new Date(parseInt(values[0]));
        var endDate = new Date(parseInt(values[1]));
        
        if(dateLabel) {
            dateLabel.style.display = 'block';
            dateLabel.innerHTML = `Showing: <b>${startDate.toLocaleDateString()}</b> - <b>${endDate.toLocaleDateString()}</b>`;
        }

        var filteredData = allData.filter(item => {
            var itemDate = new Date(item.date).getTime();
            return itemDate >= startDate.getTime() && itemDate <= endDate.getTime();
        });

        if(callback) callback(filteredData);
    });
}

// =========================================
// 5. START ENGINE
// =========================================
document.addEventListener('DOMContentLoaded', function() {
    console.log("App starting...");

    // --- A. SETUP MODALS ---
    var infoModal = document.getElementById("info-modal");
    var btnInfo = document.getElementById("btn-more-info");
    var closeInfo = infoModal ? infoModal.querySelector(".close-modal") : null;

    if (btnInfo) btnInfo.onclick = function() { infoModal.style.display = "block"; };
    if (closeInfo) closeInfo.onclick = function() { infoModal.style.display = "none"; };

    var submitModal = document.getElementById("submit-modal");
    var btnSubmit = document.querySelector(".btn-submit");
    var closeSubmit = document.getElementById("close-submit");

    if (btnSubmit) {
        btnSubmit.onclick = function(e) {
            e.preventDefault();
            submitModal.style.display = "block";
        }
    }
    if (closeSubmit) closeSubmit.onclick = function() { submitModal.style.display = "none"; };

    window.onclick = function(event) {
        if (event.target == infoModal) infoModal.style.display = "none";
        if (event.target == submitModal) submitModal.style.display = "none";
    }

    // --- B. START MAP ---
    initMap(); 

    // --- C. FETCH DATA ---
    fetch('data/floods.json') 
        .then(response => {
            if (!response.ok) throw new Error("HTTP error " + response.status);
            return response.json();
        })
        .then(data => {
            console.log("Data loaded:", data);
            updateMarkers(data);
            initTimeSlider(data, updateMarkers);
        })
        .catch(error => {
            console.error("Error loading JSON:", error);
        });
});
