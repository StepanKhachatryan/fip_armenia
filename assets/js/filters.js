function initTimeSlider(allData, callback) {
    var slider = document.getElementById('slider');
    var dateLabel = document.getElementById('date-label');

    // 1. Find Min and Max dates from your data automatically
    var dates = allData.map(d => new Date(d.date).getTime());
    var minDate = Math.min(...dates);
    var maxDate = Math.max(...dates);

    // Buffer: Add 1 week before and after so points aren't on the exact edge
    minDate -= 604800000; 
    maxDate += 604800000;

    // 2. Create the Slider
    noUiSlider.create(slider, {
        start: [minDate, maxDate], // Start with full range selected
        connect: true,
        range: {
            'min': minDate,
            'max': maxDate
        },
        step: 24 * 60 * 60 * 1000, // 1 Day steps
    });

    // 3. Listen for changes
    slider.noUiSlider.on('update', function (values) {
        var startDate = new Date(parseInt(values[0]));
        var endDate = new Date(parseInt(values[1]));

        // Update the text label
        dateLabel.innerHTML = `Showing: ${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`;

        // Filter the data
        var filteredData = allData.filter(item => {
            var itemDate = new Date(item.date);
            return itemDate >= startDate && itemDate <= endDate;
        });

        // Trigger the callback (which will update the map)
        callback(filteredData);
    });
}
