// 1. Fetch the JSON data
fetch('data/floods.json')
    .then(response => response.json())
    .then(data => {
        // 2. Send data to Map Module to draw pins
        initMapMarkers(data); 
        
        // 3. Send data to Filter Module to setup slider limits
        initTimeSlider(data);
    });
