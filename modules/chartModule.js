// chartModule.js
export function getActivityTypesAndColours() {
    return [
        { type: 'acquisition', color: 'salmon' },
        { type: 'practice', color: 'pink' },
        { type: 'investigation', color: 'orange' },
        { type: 'reflection', color: 'gold' },
        { type: 'production', color: 'thistle' },
        { type: 'discussion', color: 'lightgreen' },
        { type: 'cooperation', color: 'lightblue' },
        { type: 'collaboration', color: 'bisque' }
    ];
}

export function createPieChart(container, data) {
    if (!container) {
        console.error('Chart container is null or undefined');
        return;
    }

    if (!Array.isArray(data) || data.length === 0) {
        container.innerHTML = '<p>No data available for chart.</p>';
        return;
    }

    // Clear any existing chart
    container.innerHTML = '';

    const width = 500; // Increase width to provide space for labels
    const height = 500; // Increase height to provide space for labels
    const radius = Math.min(width, height) / 2 - 120; // Reduce radius slightly to keep labels within bounds

    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("width", width);
    svg.setAttribute("height", height);
    container.appendChild(svg);

    const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
    g.setAttribute("transform", `translate(${width / 2},${height / 2})`);
    svg.appendChild(g);

    let startAngle = 0;
    const activityColours = getActivityTypesAndColours(); // Get the activity types and colours

    data.forEach((item, index) => {
        const sliceAngle = 2 * Math.PI * parseFloat(item.totalHours);
        const endAngle = startAngle + sliceAngle;

        const x1 = radius * Math.cos(startAngle);
        const y1 = radius * Math.sin(startAngle);
        const x2 = radius * Math.cos(endAngle);
        const y2 = radius * Math.sin(endAngle);

        const largeArcFlag = sliceAngle > Math.PI ? 1 : 0;

        const pathData = [
            `M 0 0`,
            `L ${x1} ${y1}`,
            `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
            `Z`
        ].join(' ');

        const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
        
        // Match the color based on activity type
        const matchedColour = activityColours.find(activity => activity.type === item.type)?.color || 'gray'; // Default to 'gray' if not found
        path.setAttribute("d", pathData);
        path.setAttribute("fill", matchedColour);
        g.appendChild(path);

        // Add label
        const labelAngle = startAngle + sliceAngle / 2;
        const labelRadius = radius - 10; // Move labels further out, but within the SVG bounds
        const labelX = labelRadius * Math.cos(labelAngle);
        const labelY = labelRadius * Math.sin(labelAngle);

        const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
        text.setAttribute("x", labelX);
        text.setAttribute("y", labelY);

        // Adjust text-anchor for better positioning
        if (labelAngle > Math.PI / 2 && labelAngle < 3 * Math.PI / 2) {
            text.setAttribute("text-anchor", "end");
        } else {
            text.setAttribute("text-anchor", "start");
        }

        text.setAttribute("alignment-baseline", "middle");
        text.setAttribute("font-size", "12px"); // Adjust font size for better visibility
        text.setAttribute("fill", "#000"); // Set text color for better contrast
        text.textContent = `${item.type} (${(item.totalHours * 100).toFixed(1)}%)`;
        g.appendChild(text);

        startAngle = endAngle;
    });
}


