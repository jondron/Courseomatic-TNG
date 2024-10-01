// chartModule.js

export function createPieChart(container, data) {
   // // ("data for chart: ",data);

    if (!container) {
        console.error('Chart container is null or undefined');
        return;
    }

    if (!Array.isArray(data) || data.length === 0) {
        container.innerHTML = '<p>No data available for chart.</p>';
        return;
    }


    // Clear any existing chart
    container.innerHTML += '';

    const width = 300;
    const height = 300;
    const radius = Math.min(width, height) / 2;

    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("width", width);
    svg.setAttribute("height", height);
    container.appendChild(svg);

    const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
    g.setAttribute("transform", `translate(${width / 2},${height / 2})`);
    svg.appendChild(g);

    let startAngle = 0;
    // const colors = ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40', '#FF1111', '#990022'];
    const colors = ['salmon' , 'pink', 'orange', 'gold', 'thistle','lightgreen','lightblue','lightcoral'];


    data.forEach((item, index) => {
        const sliceAngle = 2 * Math.PI * parseFloat(item.totalHours);
        const endAngle = startAngle + sliceAngle;

        const x1 = radius * Math.cos(startAngle);
        const y1 = radius * Math.sin(startAngle);
        const x2 = radius * Math.cos(endAngle);
        const y2 = radius * Math.sin(endAngle);
       
      //  // ("array :",item,index);
       
        const largeArcFlag = sliceAngle > Math.PI ? 1 : 0;

        const pathData = [
            `M 0 0`,
            `L ${x1} ${y1}`,
            `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
            `Z`
        ].join(' ');

        const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
        path.setAttribute("d", pathData);
        path.setAttribute("fill", colors[index % colors.length]);
        g.appendChild(path);

        // Add label
        const labelAngle = startAngle + sliceAngle / 2;
        const labelRadius = radius * 0.8;
        const labelX = labelRadius * Math.cos(labelAngle);
        const labelY = labelRadius * Math.sin(labelAngle);

        const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
        text.setAttribute("x", labelX);
        text.setAttribute("y", labelY);
        text.setAttribute("text-anchor", "middle");
        text.setAttribute("alignment-baseline", "middle");
        text.textContent = `${item.type} (${(item.totalHours * 100).toFixed(1)}%)`;
        g.appendChild(text);

        startAngle = endAngle;
    });
}