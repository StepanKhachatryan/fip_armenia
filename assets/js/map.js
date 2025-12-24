var map = L.map('map-container').setView([40.0691, 45.0382], 8);
var markersLayer = L.layerGroup().addTo(map);

function initMapMarkers(data) {
    data.forEach(item => {
        // Logic to choose icon color based on severity
        var marker = L.marker([item.lat, item.lng]);
        
        // Logic to build the iframe popup
        marker.bindPopup(buildPopupHTML(item));
        
        // Add date metadata to the object for filtering later
        marker.options.date = new Date(item.date);
        
        markersLayer.addLayer(marker);
    });
}
