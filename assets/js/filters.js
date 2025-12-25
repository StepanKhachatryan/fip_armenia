function initTimeSlider(allData, callback) {
    var slider = document.getElementById('slider');
    var dateLabel = document.getElementById('date-label');

    // 1. Calculate the exact start and end years from your data
    var dates = allData.map(d => new Date(d.date).getTime());
    var minDateObj = new Date(Math.min(...dates));
    var maxDateObj = new Date(Math.max(...dates));

    // Force the range to start at Jan 1st of the first year and end Dec 31st of last year
    var startYear = minDateObj.getFullYear();
    var endYear = maxDateObj.getFullYear();
    
    var minTimestamp = new Date(startYear, 0, 1).getTime();       // Jan 1
    var maxTimestamp = new Date(endYear, 11, 31).getTime();       // Dec 31

    // 2. Destroy slider if it already exists (prevents bugs when reloading)
    if (slider.noUiSlider) {
        slider.noUiSlider.destroy();
    }

    // 3. Helper: Generate a list of all months between start and end
    // We need this to tell the slider exactly where to put the small lines
    function generateMonthPips(startTs, endTs) {
        var pips = [];
        var current = new Date(startTs);
        var end = new Date(endTs);

        while (current <= end) {
            pips.push(current.getTime());
            // Move to next month
            current.setMonth(current.getMonth() + 1);
        }
        return pips;
    }

    var allMonths = generateMonthPips(minTimestamp, maxTimestamp);

    // 4. Create the Slider
    noUiSlider.create(slider, {
        start: [minTimestamp, maxTimestamp], 
        connect: true,
        range: {
            'min': minTimestamp,
            'max': maxTimestamp
        },
        step: 24 * 60 * 60 * 1000, // User drags in 1-day increments
        
        // THE NEW PIPS CONFIGURATION
        pips: {
            mode: 'values',
            values: allMonths, // Place a pip at every month
            density: 2,        // How close they are allowed to be
            
            // Filter: Decide which lines are Big (Year) vs Small (Month)
            filter: function (value, type) {
                var date = new Date(value);
                // If Month is 0 (January), it's a new Year -> Big Line (1)
                if (date.getMonth() === 0) {
                    return 1; 
                }
                // Otherwise -> Small Line (0) - Note: in noUiSlider 0=small, 1=large, 2=no label
                return 0; 
            },

            // Format: Only return text for the Years
            format: {
                to: function (value) {
                    var date = new Date(value);
                    // Only return the Year number if it's January
                    if (date.getMonth() === 0) {
                        return date.getFullYear();
                    }
                    return ""; // Empty string for months
                }
            }
        }
    });

    // 5. Logic for Filtering (Same as before)
    slider.noUiSlider.on('update', function (values) {
        var startDate = new Date(parseInt(values[0]));
        var endDate = new Date(parseInt(values[1]));

        dateLabel.innerHTML = `Time Range: ${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`;

        var filteredData = allData.filter(item => {
            var itemDate = new Date(item.date);
            return itemDate >= startDate && itemDate <= endDate;
        });

        if(callback) callback(filteredData);
    });
}
