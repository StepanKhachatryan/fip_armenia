function initTimeSlider(allData, callback) {
    var slider = document.getElementById('slider');

    // 1. Calculate Min and Max dates from data
    var dates = allData.map(d => new Date(d.date).getTime());
    var minDateObj = new Date(Math.min(...dates));
    var maxDateObj = new Date(Math.max(...dates));

    // Get Start and End Year (Jan 1st of Start, Dec 31st of End)
    var startYear = minDateObj.getFullYear();
    var endYear = maxDateObj.getFullYear();
    
    var minTimestamp = new Date(startYear, 0, 1).getTime(); 
    var maxTimestamp = new Date(endYear, 11, 31).getTime(); 

    // 2. Destroy slider if exists
    if (slider.noUiSlider) {
        slider.noUiSlider.destroy();
    }

    // 3. Create Slider
    noUiSlider.create(slider, {
        start: [minTimestamp, maxTimestamp], 
        connect: true, // This creates the colored bar between handles
        range: {
            'min': minTimestamp,
            'max': maxTimestamp
        },
        step: 24 * 60 * 60 * 1000, // 1 Day steps

        // --- NEW: TOOLTIPS CONFIGURATION ---
        tooltips: [
            {
                to: function(value) {
                    // Format the date inside the box (e.g., "May 2024")
                    var date = new Date(parseInt(value));
                    return date.toLocaleDateString("en-US", { month: 'short', year: 'numeric' });
                }
            },
            {
                to: function(value) {
                    var date = new Date(parseInt(value));
                    return date.toLocaleDateString("en-US", { month: 'short', year: 'numeric' });
                }
            }
        ],

        // --- NEW: PIPS (LABELS) CONFIGURATION ---
        pips: {
            mode: 'range', // Only show Min and Max (The ends)
            density: 100,  // Determines how many lines. 100 = fewer lines
            
            // Format the bottom labels to only show the Year
            format: {
                to: function (value) {
                    var date = new Date(value);
                    return date.getFullYear();
                }
            }
        }
    });

    // 4. Filtering Logic
    slider.noUiSlider.on('update', function (values) {
        var startDate = new Date(parseInt(values[0]));
        var endDate = new Date(parseInt(values[1]));

        // Note: We deleted the dateLabel.innerHTML update since we now use tooltips

        var filteredData = allData.filter(item => {
            var itemDate = new Date(item.date);
            return itemDate >= startDate && itemDate <= endDate;
        });

        if(callback) callback(filteredData);
    });
}
