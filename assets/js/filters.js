function initTimeSlider(allData, callback) {
    var slider = document.getElementById('slider');

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
        
        var filteredData = allData.filter(item => {
            var itemDate = new Date(item.date);
            return itemDate >= startDate && itemDate <= endDate;
        });

        if(callback) callback(filteredData);
    });
}
