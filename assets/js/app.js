document.addEventListener('DOMContentLoaded', function() {
    
    // --- 1. Start the Map ---
    initMap();

    // --- 2. Modal Logic (New) ---
    // Get the modal elements
    var modal = document.getElementById("info-modal");
    var btn = document.getElementById("btn-more-info");
    var span = document.getElementsByClassName("close-modal")[0];

    // Open the modal when the "More Info" button is clicked
    if (btn) {
        btn.onclick = function() {
            modal.style.display = "block";
        }
    }

    // Close the modal when the "X" is clicked
    if (span) {
        span.onclick = function() {
            modal.style.display = "none";
        }
    }

    // Close the modal when clicking anywhere outside the box
    window.onclick = function(event) {
        if (event.target == modal) {
            modal.style.display = "none";
        }
    }

    // --- 3. Fetch the Data ---
    fetch('data/floods.json')
        .then(response => response.json())
        .then(data => {
            
            // 4. Initialize the Slider
            // We pass the data AND a function to run when the slider moves
            initTimeSlider(data, function(filteredData) {
                // When slider moves, update map markers
                updateMarkers(filteredData);
            });

            // 5. Show all markers initially
            updateMarkers(data);
        })
        .catch(error => console.error('Error loading data:', error));
});
