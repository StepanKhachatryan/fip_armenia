// Function to convert JSON data to CSV
function jsonToCSV(data) {
    if (!Array.isArray(data) || data.length === 0) {
        return '';
    }

    // Define CSV headers
    const headers = ['ID', 'Title', 'Date', 'Latitude', 'Longitude', 'Description', 'Video Count'];
    
    // Build CSV rows
    const rows = data.map(item => [
        item.id || '',
        `"${(item.title || '').replace(/"/g, '""')}"`, // Escape quotes
        item.date || '',
        item.lat || '',
        item.lng || '',
        `"${(item.description || '').replace(/"/g, '""')}"`, // Escape quotes
        (item.videos && Array.isArray(item.videos)) ? item.videos.length : 0
    ]);

    // Combine headers and rows
    const csv = [
        headers.join(','),
        ...rows.map(row => row.join(','))
    ].join('\n');

    return csv;
}

// Function to download CSV file
function downloadDataAsCSV() {
    if (!auth.isLoggedIn()) {
        alert('Խնդրում ենք մուտք գործել տվյալները ներբեռնելու համար');
        return;
    }

    // Fetch the JSON data
    fetch('data/floods.json')
        .then(response => response.json())
        .then(data => {
            // Convert to CSV
            const csv = jsonToCSV(data);
            
            // Create a blob from CSV data
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
            
            // Create download link
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            
            link.setAttribute('href', url);
            link.setAttribute('download', `floods-data-${new Date().toISOString().split('T')[0]}.csv`);
            link.style.visibility = 'hidden';
            
            // Trigger download
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            // Clean up
            URL.revokeObjectURL(url);
        })
        .catch(error => {
            console.error('Error downloading data:', error);
            alert('Տվյալները ներբեռնելու ժամանակ տեղի ունեցավ սխալ');
        });
}

// Handle auth button click
function handleAuthClick() {
    if (auth.isLoggedIn()) {
        // Logout
        auth.logout();
    } else {
        // Show login prompt
        const username = prompt('Մուտքագրեք ձեր անուն (կամ ցանկացած անունակ):');
        if (username && username.trim()) {
            auth.login(username.trim());
        }
    }
}
