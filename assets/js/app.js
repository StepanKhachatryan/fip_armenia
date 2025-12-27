document.addEventListener('DOMContentLoaded', function() {
    
    // --- 1. Start the Map ---
    initMap();

    // ==========================================
    // 2. MODAL LOGIC
    // ==========================================

    // --- A. INFO MODAL ("More Info") ---
    var infoModal = document.getElementById("info-modal");
    var btnInfo = document.getElementById("btn-more-info");
    // We select the first close button found in the info modal
    var spanInfo = infoModal.querySelector(".close-modal"); 

    // Open Info Modal
    if (btnInfo) {
        btnInfo.onclick = function() {
            infoModal.style.display = "block";
        }
    }
    // Close Info Modal
    if (spanInfo) {
        spanInfo.onclick = function() {
            infoModal.style.display = "none";
        }
    }

    // --- B. SUBMIT MODAL ("Submit Video") ---
    var submitModal = document.getElementById("submit-modal");
    // Use querySelector because it is a class on an <a> tag
    var btnSubmit = document.querySelector(".btn-submit"); 
    var spanSubmit = document.getElementById("close-submit");

    // Open Submit Modal
    if (btnSubmit) {
        btnSubmit.onclick = function(e) {
            e.preventDefault(); // Prevents the link from opening a new tab
            submitModal.style.display = "block";
        }
    }
    // Close Submit Modal
    if (spanSubmit) {
        spanSubmit.onclick = function() {
            submitModal.style.display = "none";
        }
    }

    // --- C. GLOBAL CLOSE (Clicking outside any modal closes it) ---
    window.onclick = function(event) {
        if (event.target == infoModal) {
            infoModal.style.display = "none";
        }
        if (event.target == submitModal) {
            submitModal.style.display = "none";
        }
    }

    // ==========================================
    // 3. FETCH DATA & INIT SLIDER
    // ==========================================
    fetch('data/floods.json')
        .then(response => response.json())
        .then(data => {
            
            // Initialize the Slider
            // We pass the data AND a function to run when the slider moves
            initTimeSlider(data, function(filteredData) {
                // When slider moves, update map markers
                updateMarkers(filteredData);
            });

            // Show all markers initially
            updateMarkers(data);
        })
        .catch(error => console.error('Error loading data:', error));
});
