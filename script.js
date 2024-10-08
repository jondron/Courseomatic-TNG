import { initializeCourse, loadSavedCourse } from './modules/courseModule.js';
import { saveToLocalStorage, loadFromLocalStorage, exportToJSON, importFromJSON } from './modules/storageModule.js';
import { initializeUI, updateUI, setupEventListeners } from './modules/uiModule.js';

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

