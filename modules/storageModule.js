// storageModule.js

import { getCourseData, loadSavedCourse, saveCourse } from './courseModule.js';

const LOCAL_STORAGE_KEY = 'courseStoryboardData';

export function saveToLocalStorage() {
    const courseData = getCourseData();
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(courseData));
}

export function loadFromLocalStorage() {
    const savedData = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (savedData) {
        const parsedData = JSON.parse(savedData);
        loadSavedCourse(parsedData);
        return parsedData;
    }
    return null;
}

export function clearLocalStorage() {
    localStorage.removeItem(LOCAL_STORAGE_KEY);
}

export function exportToJSON() {
    const courseData = getCourseData();
    const dataStr = JSON.stringify(courseData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = 'course_storyboard_data.json';

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
}

export function importFromJSON(jsonString) {
    try {
        const importedData = JSON.parse(jsonString);
        
        // Validate the imported data structure
        if (!importedData.program || !importedData.course || !Array.isArray(importedData.units) || !Array.isArray(importedData.activities)) {
            throw new Error('Invalid data structure in imported JSON');
        }

        // Update the course data with the imported data
        saveCourse(importedData);

        // Reload the course data
        loadSavedCourse();

        // Update the UI
        updateUI();

        //console.log('Course data imported successfully');
    } catch (error) {
        console.error('Error importing course data:', error);
        alert('There was an error importing the course data. Please check the file and try again.');
    }
}


export function copyToClipboard() {
    const courseData = getCourseData();
    const dataStr = JSON.stringify(courseData, null, 2);
    
    navigator.clipboard.writeText(dataStr).then(
        function() {
            //console.log('Copying to clipboard was successful!');
            alert('Course data copied to clipboard!');
        },
        function(err) {
            console.error('Could not copy text: ', err);
            alert('Failed to copy course data to clipboard. Please try again.');
        }
    );
}

export function saveToPDF() {
    // This is a placeholder function. Actual PDF generation would require a PDF library.
    //console.log('PDF generation not implemented in this module. Consider using a library like jsPDF.');
    alert('PDF generation is not implemented in this demo. In a full application, this would save the course data as a PDF.');
}

export function saveToHTML() {
    const courseData = getCourseData();
    let htmlContent = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>${courseData.course.name} - Course Storyboard</title>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                h1, h2, h3 { color: #2c3e50; }
                .unit { margin-bottom: 20px; border: 1px solid #ddd; padding: 10px; }
                .activity { margin: 10px 0; padding: 10px; background-color: #f9f9f9; }
            </style>
        </head>
        <body>
            <h1>${courseData.course.name} (${courseData.course.code})</h1>
            <p><strong>Credit Hours:</strong> ${courseData.course.creditHours}</p>
            <p><strong>Course Goal:</strong> ${courseData.course.goal}</p>
            <p><strong>Course Description:</strong> ${courseData.course.description}</p>
            <h2>Learning Outcomes:</h2>
            <ol>
                ${courseData.course.learningOutcomes.map(outcome => `<li>${outcome}</li>`).join('')}
            </ol>
            <h2>Units:</h2>
            ${courseData.units.map(unit => `
                <div class="unit">
                    <h3>${unit.title}</h3>
                    <p>${unit.description}</p>
                    <h4>Activities:</h4>
                    ${courseData.activities.filter(activity => activity.unitId === unit.id).map(activity => `
                        <div class="activity">
                            <h5>${activity.title}</h5>
                            <p><strong>Type:</strong> ${activity.type}</p>
                            <p><strong>Description:</strong> ${activity.description}</p>
                            <p><strong>Study Hours:</strong> ${activity.studyHours}</p>
                            ${activity.isAssessed ? `
                                <p><strong>Assessed:</strong> Yes</p>
                                <p><strong>Pass Mark:</strong> ${activity.passMark}%</p>
                                <p><strong>Weighting:</strong> ${activity.weighting}%</p>
                                <p><strong>Marking Hours:</strong> ${activity.markingHours}</p>
                            ` : ''}
                        </div>
                    `).join('')}
                </div>
            `).join('')}
        </body>
        </html>
    `;

    const dataUri = 'data:text/html;charset=utf-8,'+ encodeURIComponent(htmlContent);
    const exportFileDefaultName = 'course_storyboard.html';

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
}