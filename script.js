import { initializeCourse, saveCourse, loadSavedCourse, clearCourse } from './modules/courseModule.js';
import { createUnit, editUnit, deleteUnit, cloneUnit } from './modules/unitModule.js';
import { createActivity, editActivity, deleteActivity, cloneActivity } from './modules/activityModule.js';
import { saveToLocalStorage, loadFromLocalStorage, exportToJSON, importFromJSON } from './modules/storageModule.js';
import { initializeUI, updateUI, setupEventListeners } from './modules/uiModule.js';
import { createPieChart } from './modules/chartModule.js';

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    //loadSavedCourse();  // Load saved course data
    initializeUI();
    setupEventListeners();
    const savedData = loadFromLocalStorage();
    if (savedData) {
        loadSavedCourse(savedData);
        updateUI();
    } else {
        initializeCourse();
    }
});
/*
// Event listeners for top menu buttons
document.getElementById('programInfoBtn').addEventListener('click', () => {
    // Open program info popup
    document.getElementById('programInfoPopup').style.display = 'block';
});

document.getElementById('courseInfoBtn').addEventListener('click', () => {
    // Open course info popup
    document.getElementById('courseInfoPopup').style.display = 'block';
});

document.getElementById('newUnitBtn').addEventListener('click', () => {
    // Open new unit popup
    document.getElementById('unitPopup').style.display = 'block';
});

document.getElementById('clearBtn').addEventListener('click', () => {
    if (confirm('Are you sure you want to clear all data? This action cannot be undone.')) {
        clearCourse();
        updateUI();
    }
});

// Event listeners for save/load menu options
document.getElementById('exportJson').addEventListener('click', () => {
    exportToJSON();
});

document.getElementById('importJson').addEventListener('click', () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (event) => {
        const file = event.target.files[0];
        const reader = new FileReader();
        reader.onload = (e) => {
            const contents = e.target.result;
            importFromJSON(contents);
            updateUI();
        };
        reader.readAsText(file);
    };
    input.click();
});

document.getElementById('printPdf').addEventListener('click', () => {
    // Implement PDF printing logic
});

document.getElementById('saveHtml').addEventListener('click', () => {
    // Implement HTML saving logic
});

document.getElementById('copyClipboard').addEventListener('click', () => {
    // Implement clipboard copying logic
});

// Event listeners for popups
document.getElementById('programInfoForm').addEventListener('submit', (event) => {
    event.preventDefault();
    // Save program info
    saveCourse({
        programName: document.getElementById('programName').value,
        programLevel: document.getElementById('programLevel').value,
        programDescription: document.getElementById('programDescription').value,
        // Add logic to save program learning outcomes
    });
    updateUI();
    document.getElementById('programInfoPopup').style.display = 'none';
});

document.getElementById('courseInfoForm').addEventListener('submit', (event) => {
    event.preventDefault();
    // Save course info
    saveCourse({
        courseName: document.getElementById('courseName').value,
        courseCode: document.getElementById('courseCode').value,
        creditHours: document.getElementById('creditHours').value,
        courseGoal: document.getElementById('courseGoal').value,
        courseDescription: document.getElementById('courseDescription').value,
        // Add logic to save course learning outcomes
    });
    updateUI();
    document.getElementById('courseInfoPopup').style.display = 'none';
});

document.getElementById('unitForm').addEventListener('submit', (event) => {
    event.preventDefault();
    const unitTitle = document.getElementById('unitTitle').value;
    const unitDescription = document.getElementById('unitDescription').value;
    createUnit(unitTitle, unitDescription);
    updateUI();
    document.getElementById('unitPopup').style.display = 'none';
});

document.getElementById('activityForm').addEventListener('submit', (event) => {
    event.preventDefault();
    // Save activity
    const activityData = {
        type: document.getElementById('activityType').value,
        title: document.getElementById('activityTitle').value,
        description: document.getElementById('activityDescription').value,
        specificActivity: document.getElementById('specificActivity').value,
        studyHours: document.getElementById('studyHours').value,
        unitId: document.getElementById('unitSelect').value,
        isAssessed: document.getElementById('isAssessed').checked,
        // Add logic for other activity fields
    };
    createActivity(activityData);
    updateUI();
    document.getElementById('activityPopup').style.display = 'none';
});

// Close popups when clicking cancel buttons
document.querySelectorAll('.popup .cancel').forEach(button => {
    button.addEventListener('click', () => {
        button.closest('.popup').style.display = 'none';
    });
});

// Event delegation for unit and activity actions
document.getElementById('units').addEventListener('click', (event) => {
    const target = event.target;
    if (target.classList.contains('edit-unit')) {
        const unitId = target.closest('.unit-panel').dataset.unitId;
        editUnit(unitId);
    } else if (target.classList.contains('delete-unit')) {
        const unitId = target.closest('.unit-panel').dataset.unitId;
        if (confirm('Are you sure you want to delete this unit?')) {
            deleteUnit(unitId);
            updateUI();
        }
    } else if (target.classList.contains('clone-unit')) {
        const unitId = target.closest('.unit-panel').dataset.unitId;
        cloneUnit(unitId);
        updateUI();
    } else if (target.classList.contains('new-activity')) {
        const unitId = target.closest('.unit-panel').dataset.unitId;
        document.getElementById('unitSelect').value = unitId;
        document.getElementById('activityPopup').style.display = 'block';
    } else if (target.classList.contains('edit-activity')) {
        const activityId = target.closest('.activity-card').dataset.activityId;
        editActivity(activityId);
    } else if (target.classList.contains('delete-activity')) {
        const activityId = target.closest('.activity-card').dataset.activityId;
        if (confirm('Are you sure you want to delete this activity?')) {
            deleteActivity(activityId);
            updateUI();
        }
    } else if (target.classList.contains('clone-activity')) {
        const activityId = target.closest('.activity-card').dataset.activityId;
        cloneActivity(activityId);
        updateUI();
    }
});


// Make units and activities draggable
$(document).ready(() => {
    $('#units').sortable({
        items: '.unit-panel',
        handle: '.unit-title',
        update: function(event, ui) {
            // Update unit order
            const newOrder = $(this).sortable('toArray', {attribute: 'data-unit-id'});
            // Implement logic to update unit order in the data model
            updateUI();
        }
    });

    $('.unit-panel').sortable({
        items: '.activity-card',
        connectWith: '.unit-panel',
        update: function(event, ui) {
            const activityId = ui.item.data('activity-id');
            const newUnitId = ui.item.closest('.unit-panel').data('unit-id');
            // Implement logic to move activity to new unit in the data model
            updateUI();
        }
    });
});
*/
// Autosave functionality
setInterval(() => {
    saveToLocalStorage();
}, 30000); // Autosave every 30 seconds

// Initialize TinyMCE for rich text editors
tinymce.init({
    selector: '#programDescription, #courseGoal, #courseDescription, #productionNotes, #unitDescription, #activityDescription',
    height: 300,
    menubar: false,
    plugins: [
        'advlist autolink lists link image charmap print preview anchor',
        'searchreplace visualblocks code fullscreen',
        'insertdatetime media table paste code help wordcount'
    ],
    toolbar: 'undo redo | formatselect | bold italic backcolor | \
        alignleft aligncenter alignright alignjustify | \
        bullist numlist outdent indent | removeformat | help'
});