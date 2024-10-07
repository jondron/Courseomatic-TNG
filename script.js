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

// Initialize TinyMCE for rich text editors
tinymce.init({
    selector: '#programDescription, #courseGoal, #courseDescription, #courseNotes, #courseDevelopmentNotes, #unitDescription, #activityDescription, #activityDevNotes', 
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