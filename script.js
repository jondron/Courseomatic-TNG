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