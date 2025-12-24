document.addEventListener('DOMContentLoaded', function() {
    
    // 1. Start the Map
    initMap();

    // 2. Fetch the Data
    fetch('data/floods.json')
        .then(response => response.json())
        .then(data => {
            
            // 3. Initialize the Slider
            // We pass the data AND a function to run when the slider moves
            initTimeSlider(data, function(filteredData) {
                // When slider moves, update map markers
                updateMarkers(filteredData);
            });

            // 4. Show all markers initially
            updateMarkers(data);
        })
        .catch(error => console.error('Error loading data:', error));
});
