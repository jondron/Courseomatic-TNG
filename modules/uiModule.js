// uiModule.js - Part 1: Imports and Initial Setup

import { getCourseData, saveCourse, addProgramLearningOutcome, addCourseLearningOutcome, 
    getActivityTypeProportions, getUnassessedLearningOutcomes,getUnitStudyHours, getUnitMarkingHours,getTotalStudyHours, getTotalMarkingHours,
     recalculateHours, generateCourseReport, clearCourse} from './courseModule.js';
import { createUnit, editUnit, deleteUnit, cloneUnit } from './unitModule.js';
import { createActivity, editActivity, deleteActivity, cloneActivity, getActivityTypes, getSpecificActivities, addCustomActivityType } from './activityModule.js';
import { createPieChart, getActivityTypesAndColours } from './chartModule.js';
import { formatTimeForDisplay, timeToMinutes } from './timeUtils.js';

export function initializeUI() {
    setupEventListeners();
    setupFormValidation();
    //setupCourseInfoToggle();
    setTitle();
    updateUI();
}

export function updateUI() {
    updateCourseInfo();
    updateUnits();
    updateActivityTypePieChart();
    updateUnassessedLearningOutcomes();
    setTitle();
}

function setupEventListeners() {
        //debug
    

        try {
            document.getElementById('units').addEventListener('click', handleUnitEvents);
        } catch (error) {
            console.error('Error setting up units event listener:', error);
        }
    
        try {
            document.getElementById('courseInfoBtn').addEventListener('click', () => {
                populateCourseForm();
                document.getElementById('courseInfoPopup').style.display = 'block';
            });
        } catch (error) {
            console.error('Error setting up course info button event listener:', error);
        }
    
        try {
            document.getElementById('newUnitBtn').addEventListener('click', () => {
                document.getElementById('unitForm').reset();
                document.getElementById('unitPopup').style.display = 'block';
            });
        } catch (error) {
            console.error('Error setting up new unit button event listener:', error);
        }

        try {
            document.getElementById('saveHtml').addEventListener('click', () => {
                saveHtmlReport();
            });
        } catch (error) {
            console.error('Error saving report:', error);
        }

        try {
            document.getElementById('saveSyllabus').addEventListener('click', () => {
                saveSyllabus();
            });
        } catch (error) {
            console.error('Error saving syllabus:', error);
        }
    
    
        try {
            document.getElementById('clearBtn').addEventListener('click', () => {
                if (confirm('Are you sure you want to clear all data? This action cannot be undone.')) {
                    clearCourse();
                    updateUI();
                }
            });
        } catch (error) {
            console.error('Error setting up clear button event listener:', error);
        }
    
        // JSON export and import
    const exportJsonBtn = document.getElementById('exportJson');
    const importJsonBtn = document.getElementById('importJson');


    if (exportJsonBtn) {
    //    //('Export JSON button found, attaching listener');
        exportJsonBtn.addEventListener('click', handleExportJson);
    } else {
        console.error('Export JSON button not found');
    }

    if (importJsonBtn) {
        importJsonBtn.addEventListener('click', handleImportJson);
    } else {
        console.error('Import JSON button not found');
    }     


    // Form submit listeners
   // document.getElementById('programInfoForm').addEventListener('submit', handleProgramFormSubmit);
    document.getElementById('courseInfoForm').addEventListener('submit', handleCourseFormSubmit);
    document.getElementById('unitForm').addEventListener('submit', handleUnitFormSubmit);
     // Remove existing listeners before adding new ones
     document.getElementById('activityForm').removeEventListener('submit', handleActivityFormSubmit);
     document.getElementById('activityForm').addEventListener('submit', handleActivityFormSubmit);
 
    // Other form-related listeners
    document.getElementById('addPLO').addEventListener('click', addNewPLO);
    document.getElementById('addCLO').addEventListener('click', addNewCLO);
    document.getElementById('activityType').addEventListener('change', updateSpecificActivityDropdown);
    document.getElementById('isAssessed').addEventListener('change', toggleAssessmentDetails);
    document.getElementById('specificActivity').addEventListener('change', function() {
        document.getElementById('otherActivityContainer').style.display = this.value === 'other' ? 'block' : 'none';
    });
   

    // Close buttons for popups
    document.querySelectorAll('.popup .cancel').forEach(button => {
        button.addEventListener('click', () => {
            button.closest('.popup').style.display = 'none';
        });
    });
    // Add a keydown event listener for the entire document
    // Get all buttons with the class 'cancel'
    const cancelButtons = document.querySelectorAll('.cancel');

    // Add a keydown event listener for the entire document
    document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape') {  // Check if the 'Escape' key was pressed
            cancelButtons.forEach(button => button.click()); // Simulate a click on each cancel button
        }
    });
   
    //study hour calculator 
     // Main form elements
     const activityForm = document.getElementById('activityForm');
     const studyHoursInput = document.getElementById('studyHours');
     const openCalculatorBtn = document.getElementById('openCalculator');

     // Popup elements
     const calculatorPopup = document.getElementById('calculatorPopup');
     const closePopupBtn = document.getElementById('closePopup');
     const calculatorForm = document.getElementById('calculatorForm');
     const calcActivityTypeSelect = document.getElementById('calcActivityType');
     const inputTypeSelect = document.getElementById('inputType');
     const pageTypeContainer = document.getElementById('pageTypeContainer');
     const pageTypeSelect = document.getElementById('pageType');
     const inputValueField = document.getElementById('inputValue');
     const calculatorResultDiv = document.getElementById('calculatorResult');

     // Open calculator popup
     openCalculatorBtn.addEventListener('click', (e) => {
         e.preventDefault();
         calculatorPopup.style.display = 'block';
     });

     // Close calculator popup
     closePopupBtn.addEventListener('click', () => {
         calculatorPopup.style.display = 'none';
     });

     // Close popup when clicking outside
     window.addEventListener('click', (e) => {
         if (e.target === calculatorPopup) {
             calculatorPopup.style.display = 'none';
         }
     });

     // Toggle page type visibility
     inputTypeSelect.addEventListener('change', function() {
         pageTypeContainer.style.display = this.value === 'pages' ? 'block' : 'none';
         inputValueField.placeholder = `Enter number of ${this.value}`;
     });

     // Calculator form submission
     calculatorForm.addEventListener('submit', function(e) {
         e.preventDefault();
         const activity = calcActivityTypeSelect.value;
         const inputType = inputTypeSelect.value;
         const pageType = pageTypeSelect.value;
         const inputValue = parseFloat(inputValueField.value);

         if (!activity || !inputValue) {
             calculatorResultDiv.textContent = 'Please select an activity and provide the required input.';
             return;
         }

         const wordCount = inputType === 'words' ? inputValue : inputValue * parseFloat(pageType);
         const studyTimeMinutes = calculateStudyTime(activity, wordCount);
         const studyTimeHours = Math.floor(studyTimeMinutes / 60);
         const studyTimeRemainingMinutes = Math.round(studyTimeMinutes % 60);

         const formattedTime = `${studyTimeHours}:${studyTimeRemainingMinutes.toString().padStart(2, '0')}`;
         
         calculatorResultDiv.textContent = `Estimated study time: ${formattedTime}`;
         studyHoursInput.value = formattedTime;
     });

}

function handleUnitEvents(event) {
    const target = event.target;
    const unitPanel = target.closest('.unit-panel');
    if (!unitPanel) return; // Click was not within a unit panel

    const unitId = unitPanel.dataset.unitId;

    if (target.closest('.add-activity-button')) {
        handleAddActivity(unitId);
    } else if (target.classList.contains('edit-unit')) {
        handleEditUnit(unitId);
    } else if (target.classList.contains('clone-unit')) {
        handleCloneUnit(unitId);
    } else if (target.classList.contains('delete-unit')) {
        handleDeleteUnit(unitId);
    } else if (target.classList.contains('move-unit-up')) {
        handleMoveUnitUp(unitId);
    } else if (target.classList.contains('move-unit-down')) {
        handleMoveUnitDown(unitId);
    } else if (target.classList.contains('unit-title')) {
        toggleUnitCollapse(unitPanel);
    } else if (target.classList.contains('toggle-icon')) {
        toggleUnitCollapse(unitPanel);    
    } else {
        const activityCard = target.closest('.activity-card');
        if (activityCard) {
            const activityId = activityCard.dataset.activityId;
            handleActivityEvents(event, activityCard, activityId);
        }
    }
}

// uiModule.js - Part 2: Event Handlers


function handleActivityEvents(event, activityCard, activityId) {
    const target = event.target;

    // Check if the click is on a button
    if (target.closest('.activity-buttons')) {
        // Handle button clicks
        if (target.classList.contains('edit-activity')) {
            handleEditActivity(activityId);
        } else if (target.classList.contains('clone-activity')) {
            handleCloneActivity(activityId);
        } else if (target.classList.contains('delete-activity')) {
            handleDeleteActivity(activityId);
        } else if (target.classList.contains('move-activity-up')) {
            handleMoveActivityUp(activityId);
        } else if (target.classList.contains('move-activity-down')) {
            handleMoveActivityDown(activityId);
        }
    } else if (target.closest('.activity-card-clickable')) {
        // Expand/collapse the card
        const isExpanded = activityCard.classList.contains('expanded');
        if (isExpanded) {
            collapseActivityCard(activityId);
        } else {
            expandActivityCard(activityId);
        }
    }
}

function handleAddActivity(unitId) {
    const form = document.getElementById('activityForm');
    form.reset();
    populateActivityForm();
    delete form.dataset.activityId; // Ensure we're not in edit mode
    document.getElementById('unitSelect').value = unitId;
    
    // Clear TinyMCE editor
    if (tinymce.get('activityDescription')) {
        tinymce.get('activityDescription').setContent('');
    }
    
    document.getElementById('activityPopup').style.display = 'block';
    setupFormValidation();
}

function handleEditUnit(unitId) {
    const courseData = getCourseData();
    const unit = courseData.units.find(u => u.id === unitId);
    if (unit) {
        const unitForm = document.getElementById('unitForm');
        unitForm.elements.unitTitle.value = unit.title;
        unitForm.elements.unitDescription.value = unit.description;
         // Handle TinyMCE editor for course description
        if (tinymce.get('unitDescription')) {
            tinymce.get('unitDescription').setContent(unit.description || '');
        } else {
            console.error('TinyMCE editor for unitDescription not found');
        }
        unitForm.dataset.unitId = unitId;
        document.getElementById('unitPopup').style.display = 'block';
        setupFormValidation();
    }
}

function handleCloneUnit(unitId) {
    const clonedUnit = cloneUnit(unitId);
    if (clonedUnit) {
        updateUI();
    }
}

function handleDeleteUnit(unitId) {
    if (confirm('Are you sure you want to delete this unit? This action cannot be undone.')) {
        deleteUnit(unitId);
        updateUI();
    }
}

function handleMoveUnitUp(unitId) {
    const courseData = getCourseData();
    const unitIndex = courseData.units.findIndex(u => u.id === unitId);
    if (unitIndex > 0) {
        [courseData.units[unitIndex - 1], courseData.units[unitIndex]] = 
        [courseData.units[unitIndex], courseData.units[unitIndex - 1]];
        saveCourse(courseData);
        updateUI();
    }
}

function handleMoveUnitDown(unitId) {
    const courseData = getCourseData();
    const unitIndex = courseData.units.findIndex(u => u.id === unitId);
    if (unitIndex < courseData.units.length - 1) {
        [courseData.units[unitIndex], courseData.units[unitIndex + 1]] = 
        [courseData.units[unitIndex + 1], courseData.units[unitIndex]];
        saveCourse(courseData);
        updateUI();
    }
}

function toggleUnitCollapse(unitPanel) {
    const content = unitPanel.querySelector('.unit-collapsible');
    const toggleIcon = unitPanel.querySelector('.toggle-icon');
    content.style.display = content.style.display === 'none' ? 'block' : 'none';
    toggleIcon.textContent = content.style.display === 'none' ? '▼' : '▲';
}

function handleEditActivity(activityId) {
    const courseData = getCourseData();
    const activity = courseData.activities.find(a => a.id === activityId);
    if (activity) {
        populateActivityForm(activity);
        document.getElementById('activityPopup').style.display = 'block';
        setupFormValidation();
    }
}

function handleCloneActivity(activityId) {
    const clonedActivity = cloneActivity(activityId);
    if (clonedActivity) {
        updateUI();
    }
}

function handleDeleteActivity(activityId) {
    if (confirm('Are you sure you want to delete this activity? This action cannot be undone.')) {
        deleteActivity(activityId);
        updateUI();
    }
}

function handleMoveActivityUp(activityId) {
    const courseData = getCourseData();
    const activities = courseData.activities;
    const currentIndex = activities.findIndex(a => a.id === activityId);
    
    if (currentIndex > 0) {
        let swapIndex = currentIndex - 1;
        // Find the previous activity in the same unit
        while (swapIndex >= 0 && activities[swapIndex].unitId !== activities[currentIndex].unitId) {
            swapIndex--;
        }
        
        if (swapIndex >= 0) {
            // Swap the activities
            [activities[swapIndex], activities[currentIndex]] = [activities[currentIndex], activities[swapIndex]];
            saveCourse({activities: activities});
            updateUI();
        }
    }
}

function handleMoveActivityDown(activityId) {
    const courseData = getCourseData();
    const activities = courseData.activities;
    const currentIndex = activities.findIndex(a => a.id === activityId);
    
    if (currentIndex < activities.length - 1) {
        let swapIndex = currentIndex + 1;
        // Find the next activity in the same unit
        while (swapIndex < activities.length && activities[swapIndex].unitId !== activities[currentIndex].unitId) {
            swapIndex++;
        }
        
        if (swapIndex < activities.length) {
            // Swap the activities
            [activities[currentIndex], activities[swapIndex]] = [activities[swapIndex], activities[currentIndex]];
            saveCourse({activities: activities});
            updateUI();
        }
    }
}

// uiModule.js - Part 3: Form Handling and UI Updates

function handleProgramFormSubmit(event) {
    event.preventDefault();
    const programData = {
        program: {
            name: document.getElementById('programName').value,
            level: document.getElementById('programLevel').value,
            description: document.getElementById('programDescription').value,
            learningOutcomes: Array.from(document.getElementById('programLearningOutcomes').children)
                .map(child => child.querySelector('input').value)
                .filter(value => value.trim() !== '')
        }
    };
    saveCourse(programData);
    updateUI();
    document.getElementById('programInfoPopup').style.display = 'none';
}

function handleCourseFormSubmit(event) {
    event.preventDefault();
    const courseData = {
        course: {
            name: document.getElementById('courseName').value,
            code: document.getElementById('courseCode').value,
            creditHours: document.getElementById('creditHours').value,
            prerequisites: document.getElementById('coursePrerequisites').value,
            revision: document.getElementById('courseRevision').value,
            deliveryMode: document.getElementById('deliveryMode').value,
            goal: document.getElementById('courseGoal').value,
            description: document.getElementById('courseDescription').value,
            courseNotes: document.getElementById('courseNotes').value,
            productionNotes: document.getElementById('productionNotes').value,
            learningOutcomes: Array.from(document.getElementById('courseLearningOutcomes').children)
                .map(child => child.querySelector('textarea').value)
                .filter(value => value.trim() !== '')
        },
        program: {
            name: document.getElementById('programName').value,
            level: document.getElementById('programLevel').value,
            learningOutcomes: Array.from(document.getElementById('programLearningOutcomes').children)
                .map(child => child.querySelector('input').value)
                .filter(value => value.trim() !== '')
        }
     };
    collectCLOPLOMappings();
    saveCourse(courseData);
    updateUI();
    document.getElementById('courseInfoPopup').style.display = 'none';
}

function handleUnitFormSubmit(event) {
    event.preventDefault();
    const unitData = {
        title: document.getElementById('unitTitle').value,
        description: document.getElementById('unitDescription').value
    };
    const unitId = event.target.dataset.unitId;
    if (unitId) {
        editUnit(unitId, unitData);
    } else {
        createUnit(unitData);
    }
    updateUI();
    document.getElementById('unitPopup').style.display = 'none';
}

let isSubmitting = false;

function handleActivityFormSubmit(event) {
    event.preventDefault();

    if (isSubmitting) {
        return;
    }

    isSubmitting = true;
    const form = event.target;
    const activityData = {
        type: document.getElementById('activityType').value,
        specificActivity: document.getElementById('otherActivity').value 
                ? document.getElementById('otherActivity').value 
                : document.getElementById('specificActivity').value,
        title: document.getElementById('activityTitle').value,
        description: tinymce.get('activityDescription').getContent(),
        studyHours: document.getElementById('studyHours').value,
         unitId: document.getElementById('unitSelect').value,
        isAssessed: document.getElementById('isAssessed').checked,
        otherActivity: document.getElementById('otherActivity').value,
        learningOutcomes: Array.from(document.querySelectorAll('#activityLearningOutcomes input:checked'))
            .map(input => parseInt(input.value))
    };

    if (activityData.isAssessed) {
        activityData.passMark = document.getElementById('passMark').value;
        activityData.weighting = document.getElementById('weighting').value;
        activityData.markingHours = document.getElementById('markingHours').value
    }

    const activityId = form.dataset.activityId;
    if (activityId) {
        editActivity(activityId, activityData);
    } else {
        createActivity(activityData);
    }

    updateUI();
    document.getElementById('activityPopup').style.display = 'none';
    isSubmitting = false;
}

function setTitle(){
    const courseData = getCourseData();
    if (courseData.course.code){
        document.getElementById('courseHeading').innerHTML = "Courseomatic Storyboard Editor: "+courseData.course.code;
        console.log ("Courseomatic Storyboard Editor: "+courseData.course.name);
    }
}

function populateProgramForm() {
    const courseData = getCourseData();
    document.getElementById('programName').value = courseData.program.name || '';
    document.getElementById('programLevel').value = courseData.program.level || '';
     // Handle TinyMCE editor for program description
     if (tinymce.get('programDescription')) {
        tinymce.get('programDescription').setContent(courseData.program.description || '');
    } else {
        console.error('TinyMCE editor for programDescription not found');
    }
     
    const ploContainer = document.getElementById('programLearningOutcomes');
    ploContainer.innerHTML = courseData.program.learningOutcomes.map((plo, index) => `
        <div>
            <input type="text" id="plo${index}" name="plo${index}" value="${plo}" required>
            <button type="button" class="removePLO">Remove</button>
        </div>
    `).join('');
}


function populateCourseForm() {
    const courseData = getCourseData();

    document.getElementById('courseName').value = courseData.course.name || '';
    document.getElementById('courseCode').value = courseData.course.code || '';
    document.getElementById('creditHours').value = courseData.course.creditHours || '';
   document.getElementById('coursePrerequisites').value = courseData.course.prerequisites || ''; 
    document.getElementById('courseRevision').value = courseData.course.revision || '';
    document.getElementById('deliveryMode').value = courseData.course.deliveryMode || '';

    // Handle TinyMCE editor for course goal
    if (tinymce.get('courseGoal')) {
        tinymce.get('courseGoal').setContent(courseData.course.goal || '');
    } else {
        console.error('TinyMCE editor for courseGoal not found');
    }

    // Handle TinyMCE editor for course description
    if (tinymce.get('courseDescription')) {
        tinymce.get('courseDescription').setContent(courseData.course.description || '');
    } else {
        console.error('TinyMCE editor for courseDescription not found');
    }

    // Handle TinyMCE editor for course Notes
    if (tinymce.get('courseNotes')) {
        tinymce.get('courseNotes').setContent(courseData.course.courseNotes || '');
    } else {
        console.error('TinyMCE editor for courseNotes not found');
    }

    // Handle TinyMCE editor for production Notes
    if (tinymce.get('productionNotes')) {
        tinymce.get('productionNotes').setContent(courseData.course.productionNotes || '');
    } else {
        console.error('TinyMCE editor for productionNotes not found');
    }

    // Populate program information
    document.getElementById('programName').value = courseData.program.name || '';
    document.getElementById('programLevel').value = courseData.program.level || '';

    const ploContainer = document.getElementById('programLearningOutcomes');
    ploContainer.innerHTML = courseData.program.learningOutcomes.map((plo, index) => `
        <div class="plo-item" data-plo-index="${index}">
            ${index+1}. <input type="text" id="plo${index}" name="plo${index}" value="${plo}" required>
            <button type="button" class="removePLO">Remove</button>
        </div>
    `).join('');

    // Add event listeners for removing PLOs and updating PLO values
    document.querySelectorAll('.removePLO').forEach(button => {
        button.addEventListener('click', function () {
            const ploItem = button.closest('.plo-item');
            ploItem.remove();
            updatePLOInCLOMappings();
        });
    });

    document.querySelectorAll('.plo-item input').forEach(input => {
        input.addEventListener('input', updatePLOInCLOMappings); // Update CLO mappings when PLO content changes
    });

    // Ensure that mappedPLOs is an array before proceeding
    if (!Array.isArray(courseData.mappedPLOs)) {
        courseData.mappedPLOs = [];
    }
    const cloPLOMappings = courseData.mappedPLOs;

    // Populate the CLO container with inputs for CLOs and checkboxes for PLO mapping
    const cloContainer = document.getElementById('courseLearningOutcomes');
    cloContainer.innerHTML = courseData.course.learningOutcomes.map((clo, cloIndex) => {
        const mappedPLOs = Array.isArray(cloPLOMappings[cloIndex]) ? cloPLOMappings[cloIndex] : [];

        return `
        <div class="clo-item" data-clo-index="${cloIndex}">
           <span class="clo-handle" style="cursor: move; margin-right: 10px;">⬍</span>
           <label for="clo${cloIndex}">CLO ${cloIndex + 1}:</label>
           <textarea id="clo${cloIndex}" name="clo${cloIndex}" rows="3" style="width: 100%;" required>${clo}</textarea>
           
           <label>Map to PLO(s):</label>
           <div class="plo-checkboxes" style="display: flex; flex-wrap: wrap;">
               ${courseData.program.learningOutcomes.map((_, ploIndex) => `
                   <label style="margin-right: 10px;">
                       <input type="checkbox" name="ploMapping${cloIndex}" value="${ploIndex}" ${mappedPLOs.includes(ploIndex) ? 'checked' : ''}>
                       ${ploIndex + 1}
                   </label>
               `).join('')}
           </div>
           <button type="button" class="removeCLO" style="margin-top: 10px;">Remove</button>
           <hr>
       </div>
       `;
   }).join('');

    // Add event listeners to the remove buttons for CLOs
    document.querySelectorAll('.removeCLO').forEach(button => {
        button.addEventListener('click', function(event) {
            removeCLO(event);
        });
    });

    // Remove previous "Add PLO" event listener, if any, and attach a new one
    const addPLOButton = document.getElementById('addPLO');
    addPLOButton.removeEventListener('click', addNewPLO); // Remove any previous listener
    addPLOButton.addEventListener('click', addNewPLO); // Add the correct listener
    initializeCLOReordering();
}

// Function to add a new PLO
function addNewPLO() {
    const ploContainer = document.getElementById('programLearningOutcomes');
    const newIndex = ploContainer.children.length;

    // Create a new PLO input element
    const newPLOInput = document.createElement('div');
    newPLOInput.className = 'plo-item';
    newPLOInput.dataset.ploIndex = newIndex;
    newPLOInput.innerHTML = `
        <input type="text" id="plo${newIndex}" name="plo${newIndex}" required>
        <button type="button" class="removePLO">Remove</button>
    `;
    ploContainer.appendChild(newPLOInput);

    // Add event listener to remove button for the new PLO
    newPLOInput.querySelector('.removePLO').addEventListener('click', function () {
        newPLOInput.remove();
        updatePLOInCLOMappings();
    });

    // Add event listener to update CLO mappings when new PLO content changes
    newPLOInput.querySelector('input').addEventListener('input', updatePLOInCLOMappings);

    // Add the new PLO to each CLO mapping checkboxes
    updatePLOInCLOMappings();
}

// Function to update CLO mappings when a PLO is removed or its content changes
function updatePLOInCLOMappings() {
    const courseData = getCourseData();
    const currentPLOs = Array.from(document.querySelectorAll('.plo-item input')).map(input => input.value);

    // Update program learning outcomes in the course data
    courseData.program.learningOutcomes = currentPLOs;
    saveCourse(courseData);

    // Update each CLO mapping checkboxes to reflect the current PLOs
    document.querySelectorAll('.clo-item').forEach(cloItem => {
        const cloIndex = cloItem.dataset.cloIndex;
        const mappedPLOs = Array.from(cloItem.querySelectorAll('input[name^="ploMapping"]:checked')).map(input => parseInt(input.value));

        const ploCheckboxesContainer = cloItem.querySelector('.plo-checkboxes');
        ploCheckboxesContainer.innerHTML = '';

        currentPLOs.forEach((_, ploIndex) => {
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.name = `ploMapping${cloIndex}`;
            checkbox.value = ploIndex;
            checkbox.checked = mappedPLOs.includes(ploIndex);

            const label = document.createElement('label');
            label.style.marginRight = '10px';
            label.style.display = 'inline-block';
            label.appendChild(checkbox);
            label.appendChild(document.createTextNode(` ${ploIndex + 1}`));

            ploCheckboxesContainer.appendChild(label);
        });
    });
}

function removeCLO(event) {
    const cloItem = event.target.closest('.clo-item');
    cloItem.remove();
}





function getCLOPLOMappings() {
    const courseData = getCourseData();
    return courseData.course.learningOutcomes.map((clo, index) => {
        return courseData.mappedPLOs && courseData.mappedPLOs[index] ? courseData.mappedPLOs[index] : 'none';
    });
}

function collectCLOPLOMappings() {
    const courseData = getCourseData();

    // Collect mappings for each CLO item
    courseData.mappedPLOs = Array.from(document.querySelectorAll('.clo-item')).map(cloItem => {
        const cloIndex = cloItem.dataset.cloIndex;
        const checkedOptions = Array.from(document.querySelectorAll(`input[name="ploMapping${cloIndex}"]:checked`));
        return checkedOptions.map(option => parseInt(option.value));
    });

    saveCourse(courseData); // Save the updated course data
}



function populateActivityForm(activity = null) {
    const form = document.getElementById('activityForm');
    form.reset();
    
    // Populate activity types
    const activityType = document.getElementById('activityType');
    activityType.innerHTML = getActivityTypes().map(type => 
        `<option value="${type}">${capitalizeFirstLetter(type)}</option>`
    ).join('');

    // Populate units dropdown
    const unitSelect = document.getElementById('unitSelect');
    const courseData = getCourseData();
    unitSelect.innerHTML = courseData.units.map(unit => 
        `<option value="${unit.id}">${unit.title}</option>`
    ).join('');

    // Populate CLOs
    const learningOutcomesContainer = document.getElementById('activityLearningOutcomes');
    learningOutcomesContainer.innerHTML = courseData.course.learningOutcomes.map((clo, index) => `
        <div>
            <input type="checkbox" id="clo${index}" name="clo${index}" value="${index}">
            <label for="clo${index}">${clo}</label>
        </div>
    `).join('');

    // handled specific activity dropdown
    updateSpecificActivityDropdown(activity);
   

    if (activity) {
        // Populate form with existing activity data
        document.getElementById('activityTitle').value = activity.title || '';
          // Handle TinyMCE editor for description
        if (tinymce.get('activityDescription')) {
            tinymce.get('activityDescription').setContent(activity.description || '');
        } else {
            console.error('TinyMCE editor for activityDescription not found');
        }
        document.getElementById('activityType').value = activity.type || '';
        updateSpecificActivityDropdown(activity);
        document.getElementById('specificActivity').value = activity.specificActivity || '';
        document.getElementById('studyHours').value = activity.studyHours || '';
        document.getElementById('isAssessed').checked = activity.isAssessed || false;
        document.getElementById('unitSelect').value = activity.unitId || '';

        // Check the corresponding CLOs
        if (activity.learningOutcomes.length > 0){
            activity.learningOutcomes.forEach(cloIndex => {
                const checkbox = document.getElementById(`clo${cloIndex}`);
                if (checkbox) checkbox.checked = true;
            });
        }

        if (activity.isAssessed) {
            document.getElementById('passMark').value = activity.passMark;
            document.getElementById('weighting').value = activity.weighting;
            document.getElementById('markingHours').value = activity.markingHours;
        }

        form.dataset.activityId = activity.id;
    } else {
        if (tinymce.get('activityDescription')) {
            tinymce.get('activityDescription').setContent('');
        }
        delete form.dataset.activityId;
    }

    toggleAssessmentDetails();
   // updateSpecificActivityDropdown();
}

function updateSpecificActivityDropdown(activity = null) {
    const activityType = document.getElementById('activityType').value;
    const specificActivitySelect = document.getElementById('specificActivity');
    const specificActivities = getSpecificActivities(activityType);
    const currentSpecificActivity = activity?.specificActivity; 

    // Check if the current specificActivity exists in the preset list
    let isCustomActivity = !specificActivities.includes(currentSpecificActivity);

    // Populate the dropdown with preset specific activities
    specificActivitySelect.innerHTML = specificActivities.map(activity => 
        `<option value="${activity}" ${activity === currentSpecificActivity ? 'selected' : ''}>
            ${capitalizeFirstLetter(activity)}
        </option>`
    ).join('');

    // If the current specific activity is not in the preset list, add it as a custom option
    if (isCustomActivity && currentSpecificActivity) {
        specificActivitySelect.innerHTML += `
            <option value="${currentSpecificActivity}" selected>
                ${capitalizeFirstLetter(currentSpecificActivity)} (Custom)
            </option>`;
    }
    const otherContainer = document.getElementById('otherActivityContainer');
    otherContainer.style.display = specificActivitySelect.value === 'other' ? 'block' : 'none';
}

function toggleAssessmentDetails() {
    const isAssessed = document.getElementById('isAssessed').checked;
    document.getElementById('assessmentDetails').style.display = isAssessed ? 'block' : 'none';
}



// Initialize drag-and-drop functionality for CLOs
function initializeCLOReordering() {
    const cloContainer = document.getElementById('courseLearningOutcomes');
    Sortable.create(cloContainer, {
        animation: 150,
        handle: '.clo-handle', // Add a handle if needed for better UX
        onEnd: function () {
            collectCLOPLOMappings(); // Re-collect CLO-PLO mappings after reordering
        }
    });
}


// Function to add a new CLO with drag handle
function addNewCLO() {
    const cloContainer = document.getElementById('courseLearningOutcomes');
    const newIndex = cloContainer.children.length;

    // Create a new CLO input element with PLO mapping checkboxes and a drag handle
    const newCLOInput = document.createElement('div');
    newCLOInput.className = 'clo-item';
    newCLOInput.dataset.cloIndex = newIndex;
    newCLOInput.innerHTML = `
        <span class="clo-handle" style="cursor: move; margin-right: 10px;">⬍</span>
        <label for="clo${newIndex}">CLO ${newIndex + 1}:</label>
        <textarea id="clo${newIndex}" name="clo${newIndex}" rows="3" style="width: 100%;" required></textarea>
        
        <label>Map to PLO(s):</label>
        <div class="plo-checkboxes" style="display: flex; flex-wrap: wrap;">
            ${Array.from(document.querySelectorAll('.plo-item input')).map((_, ploIndex) => `
                <label style="margin-right: 10px;">
                    <input type="checkbox" name="ploMapping${newIndex}" value="${ploIndex}">
                    ${ploIndex + 1}
                </label>
            `).join('')}
        </div>
        <button type="button" class="removeCLO" style="margin-top: 10px;">Remove</button>
    `;
    cloContainer.appendChild(newCLOInput);

    // Add event listener to remove button for the new CLO
    newCLOInput.querySelector('.removeCLO').addEventListener('click', function() {
        cloContainer.removeChild(newCLOInput);
    });
}

// uiModule.js - Part 4: Main UI Updates and Utility Functions

function updateCourseInfo() {
    const courseData = getCourseData();
    const courseInfoContent = document.querySelector('.course-info-content');
    const totalStudyHours = getTotalStudyHours();
    const totalMarkingHours = getTotalMarkingHours();
    const assessedActivities = courseData.activities.filter(activity => activity.isAssessed);    
    const { html: assessedActivitiesHTML, totalWeighting } = generateAssessedActivitiesHTML(assessedActivities);

    if (!Array.isArray(courseData.mappedPLOs)) {
        courseData.mappedPLOs = [];
    }

    // Create unit number hyperlinks
    const unitLinks = courseData.units.map((unit, index) => 
        `<a href="#unit-${unit.id}" class="unit-link">${index + 1} ${unit.title}</a>`
    ).join(' | ');

    courseInfoContent.innerHTML = `
        <span id="closeCourseInfoModal" class="close-button">&times;</span>
        <h3>${courseData.course.name} (${courseData.course.code})</h3>
        <p><strong>Revision:</strong> ${courseData.course.revision}</p>
        <p><strong>Delivery Mode:</strong> ${courseData.course.deliveryMode}</p>
        <p><strong>Prerequisites:</strong> ${courseData.course.prerequisites}</p>
        <p><strong>Credit Hours:</strong> ${courseData.course.creditHours}</p>
        <p><strong>Course Goal:</strong> ${courseData.course.goal}</p>
        <p><strong>Course Description:</strong> ${courseData.course.description}</p>
        <p><strong>Course Notes:</strong> ${courseData.course.courseNotes}</p>
        <p><strong>Production Notes:</strong> ${courseData.course.productionNotes}</p>

        <h4>Learning Outcomes:</h4>
        <ol>
        ${Array.isArray(courseData.course.learningOutcomes) && courseData.course.learningOutcomes.length > 0 
            ? courseData.course.learningOutcomes.map(outcome => `<li>${outcome}</li>`).join('') 
            : ''
        }
        </ol>
        <p><strong>Total Study Hours:</strong> ${formatTimeForDisplay(totalStudyHours)}</p>
        <p><strong>Total Marking Hours:</strong> ${formatTimeForDisplay(totalMarkingHours)}</p>
        <p><strong>Sum of weightings for assessments:</strong> ${totalWeighting}%</p>
        <div id="unassessedOutcomes"></div>
        <div id="activityTypePieChart"></div>
        <p><strong>Program:</strong> ${courseData.program.name}</p>
        <h4>Program Learning Outcomes mapped to Course Learning Outcomes:</h4>
        <ol>
            ${courseData.program.learningOutcomes.map((outcome, ploIndex) => {
                const mappedCLOs = courseData.mappedPLOs
                    .map((cloMappings, cloIndex) => cloMappings.includes(ploIndex) ? cloIndex + 1 : null)
                    .filter(clo => clo !== null);
                const mappingText = mappedCLOs.length > 0 ? `(maps to CLO: ${mappedCLOs.join(', ')})` : '(no CLOs mapped)';
                return `<li>${outcome} ${mappingText}</li>`;
            }).join('')} 
        </ol>

        <div class="unit-navigation">
            Units: ${unitLinks}
        </div>

    `;
    
    updateActivityTypePieChart();
    updateUnassessedLearningOutcomes();

}

function unHideCourseInfo(){
    document.getElementById('courseInfo').style.display = 'block';
}


document.getElementById('courseInfo').addEventListener('click', function(event) {
    if (event.target.id === 'closeCourseInfoModal') {
        closeModal();
    }
});

// Function to hide the modal
function closeModal() {
    document.getElementById('courseInfo').style.display = 'none';
    console.log("Setting display of courseinfo to none");
}

// Event listeners to open and close the modal
document.getElementById('showCourseInfoButton').addEventListener('click', unHideCourseInfo);

// Close the modal if the user clicks outside of it
window.addEventListener('click', function(event) {
    const modal = document.getElementById('courseInfo');
    if (event.target == modal) {
        closeModal();
    }
});


function setupCourseInfoToggle() {
    const courseInfoHeader = document.getElementById('courseInfoHeader');
    courseInfoHeader.addEventListener('click', toggleCourseInfoAccordion);
}

function toggleCourseInfoAccordion() {
    const courseInfoContent = document.getElementById('courseInfoContent');
    const toggleIcon = document.getElementById('courseInfoToggleIcon');

    courseInfoContent.classList.toggle('show');
    const isVisible = courseInfoContent.classList.contains('show');
    
    courseInfoContent.style.display = isVisible ? 'block' : 'none';
    toggleIcon.textContent = isVisible ? '▲' : '▼';
}

function updateUnits() {
    const courseData = getCourseData();
    const unitsContainer = document.getElementById('units');

    if (!courseData.units || courseData.units.length === 0) {
        unitsContainer.innerHTML = '<p>No units found. Add a unit to get started.</p>';
        return;
    }

    // Add navigation to the main menu
    const unitLinks = courseData.units.map((unit, index) =>
        `<a href="#unit-${unit.id}" class="unit-link">${index + 1} ${unit.title}</a>`
    );
    document.getElementById('unit-nav').innerHTML = unitLinks.join(' | ');

    unitsContainer.innerHTML = courseData.units.map((unit, index) => {
        const studyHours = getUnitStudyHours(unit.id);
        const markingHours = getUnitMarkingHours(unit.id);
        return `
        <div id="unit-${unit.id}" class="unit-panel" data-unit-id="${unit.id}">
            <div class="unit-header">
                <h3 class="unit-title">${index + 1}: ${unit.title} (study hours: ${studyHours})<span class="toggle-icon">▼</span></h3>
                <div class="unit-buttons">
                    ${index > 0 ? '<button class="move-unit-up" title="Move unit up">↑</button>' : ''}
                    ${index < courseData.units.length - 1 ? '<button class="move-unit-down" title="Move unit down">↓</button>' : ''}
                    <button class="edit-unit" title="Edit unit">✎</button>
                    <button class="clone-unit" title="Clone unit">⎘</button>
                    <button class="delete-unit" title="Delete unit">✖</button>
                </div>
            </div>
            <div class="unit-collapsible" style="display: none;">
                <p>${unit.description || 'No description available'}</p>
                <p><strong>Total Study Hours:</strong> ${studyHours}</p>
                <p><strong>Total Marking Hours:</strong> ${markingHours}</p>
                <h4>Learning Outcomes Covered:</h4>
                <ul>
                    ${getUnitLearningOutcomes(unit.id).map(outcome => `<li>${outcome}</li>`).join('')}
                </ul>
            </div>
            <div class="activities-section">
                <h4>Activities:</h4>
                <div class="activities-container" data-unit-id="${unit.id}">
                    ${courseData.activities
                        .filter(activity => activity.unitId === unit.id)
                        .map(activity => createActivityCard(activity))
                        .join('')}
                    <div class="add-activity-button" data-unit-id="${unit.id}" title="Add a new activity to this unit">    
                        <p class="plus-icon">+ </p><p class="button">Add activity</p>
                    </div>
                </div>
            </div>
        </div>
        `;
    }).join('');

    // Initialize sortable for units using Sortable.js
    Sortable.create(unitsContainer, {
        animation: 150,
        handle: '.unit-header', // Allow dragging by grabbing the unit header
        onEnd: function () {
            // Update unit order after drag-and-drop
            const updatedUnits = Array.from(unitsContainer.children).map(unitElement => {
                const unitId = unitElement.dataset.unitId;
                return courseData.units.find(unit => unit.id === unitId);
            });
            courseData.units = updatedUnits;
            saveCourse(courseData);
            updateUnits(); // Re-render the units to reflect the new order
        }
    });

    // Re-initialize sortable for activities
    $('.activities-container').sortable({
        connectWith: '.activities-container',
        update: function(event, ui) {
            const activityId = ui.item.data('activity-id');
            const newUnitId = ui.item.closest('.unit-panel').data('unit-id');
            const newIndex = ui.item.index();
            handleActivityReorder(activityId, newUnitId, newIndex);
        }
    });
}



function displayUnitHours() {
    const courseData = getCourseData();
    courseData.units.forEach(unit => {
        const unitElement = document.querySelector(`[data-unit-id="${unit.id}"]`);
        if (unitElement) {
            unitElement.querySelector('.unit-study-hours').textContent = `Total Study Hours: ${unit.totalStudyHours}`;
            unitElement.querySelector('.unit-marking-hours').textContent = `Total Marking Hours: ${unit.totalMarkingHours}`;
        }
    });
}


function createActivityCard(activity) {
    const truncatedDescription = truncateText(activity.description, 10);
    const truncatedTitle = truncateText(activity.title,5);
    return `
        <div class="activity-card activity-type-${activity.type}" data-activity-id="${activity.id}">
            <div class="activity-card-clickable">
                <div class="activity-card-content">
                    <h5 class="activity-title">${truncatedTitle}</h5>
                    <p class="activity-description">${truncatedDescription}</p>
                    ${activity.isAssessed ? '<span class="assessed-icon" title="Assessed">★</span>' : ''}
                </div>
            </div>
            <div class="activity-buttons">
                <button class="edit-activity" title="Edit activity">✎</button>
                <button class="clone-activity" title="Clone activity">⎘</button>
                <button class="delete-activity" title="Delete activity">✖</button>
                <button class="move-activity-up" title="Move activity left">←</button>
                <button class="move-activity-down" title="Move activity right">→</button>
            </div>
        </div>
    `;
}


function expandActivityCard(activityId) {
    const activity = getCourseData().activities.find(a => a.id === activityId);
    if (!activity) return;

    const expandedContent = `
        <h5 class="activity-title">${activity.title}</h5>
        <p><strong>Type:</strong> ${capitalizeFirstLetter(activity.type)} (${activity.specificActivity})</p>
        <p><strong>Description:</strong> ${activity.description}</p>
        <p><strong>Study Hours:</strong> ${formatTimeForDisplay(activity.studyHours)}</p>
        <p><strong>Learning Outcomes:</strong>
        ${activity.learningOutcomes && activity.learningOutcomes.length > 0 ? `
            ${getActivityLearningOutcomesText(activity.id).join(', ')} </p>
         ` : '<p>No outcomes defined for this activity</p>'}          
         ${activity.isAssessed ? `
            <p><strong>Assessed:</strong> Yes</p>
            <p><strong>Pass Mark:</strong> ${activity.passMark}%</p>
            <p><strong>Weighting:</strong> ${activity.weighting}%</p>
            <p><strong>Marking Hours:</strong> ${formatTimeForDisplay(activity.markingHours)}</p>
             ` : ''}
    `;

    const activityCard = document.querySelector(`.activity-card[data-activity-id="${activityId}"]`);
    const contentDiv = activityCard.querySelector('.activity-card-content');
    contentDiv.innerHTML = expandedContent;
    activityCard.classList.add('expanded');
}

function collapseActivityCard(activityId) {
    const activity = getCourseData().activities.find(a => a.id === activityId);
    if (!activity) return;

    const truncatedTitle = truncateText(activity.title, 5);
    ////("title", truncatedTitle);
    const truncatedDescription = truncateText(activity.description, 10);
    const collapsedContent = `
        <h5 class="activity-title">${truncatedTitle}</h5>
        <p class="activity-description">${truncatedDescription}</p>
        ${activity.isAssessed ? '<span class="assessed-icon" title="Assessed">★</span>' : ''}
    `;

    const activityCard = document.querySelector(`.activity-card[data-activity-id="${activityId}"]`);
    const contentDiv = activityCard.querySelector('.activity-card-content');
    contentDiv.innerHTML = collapsedContent;
    activityCard.classList.remove('expanded');
}

function updateActivityTypePieChart() {
    const chartContainer = document.getElementById('activityTypePieChart');
    const proportions = getActivityTypeProportions();
    let propHtml = '';
   // Clear any existing chart
    chartContainer.innerHTML = '';

    chartContainer.innerHTML += `
    <div id="activity-proportions">
    <h4>Proportions of study hours per activity type</h4>
        `;
    
    createPieChart(chartContainer, proportions);

    proportions.forEach(type =>{
            propHtml += `
            <p> ${type.type}: ${parseInt(type.totalHours*100)}% </p>
            `;
     });

     chartContainer.innerHTML += `
    
        <div id ="prop-list">
            ${propHtml}
        </div>
    `;    

  
}

function updateUnassessedLearningOutcomes() {
    const unassessedOutcomes = getUnassessedLearningOutcomes();
    const container = document.getElementById('unassessedOutcomes');
    if (unassessedOutcomes.length > 0) {
        container.innerHTML = `
          <h4>Course Learning Outcomes Not Yet Assessed:</h4>
            <ul>
                ${unassessedOutcomes.map(outcome => `<li>${outcome}</li>`).join('')}
            </ul>   
        `;
    } else {
        container.innerHTML = '<p>All learning outcomes are assessed.</p>';
    }
}

function handleExportJson() {
    const courseData = getCourseData();
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(courseData, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", courseData.course.code+"_course_data.json");
    document.body.appendChild(downloadAnchorNode); // required for firefox
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
}

function handleImportJson() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (event) => {
        const file = event.target.files[0];
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const importedData = JSON.parse(e.target.result);
                saveCourse(importedData);
                updateUI();
                alert('Course data imported successfully!');
            } catch (error) {
                console.error('Error importing JSON:', error);
                alert('Error importing course data. Please check the file and try again.');
            }
        };
        reader.readAsText(file);
    };
    input.click();
}

//report functions

function saveHtmlReport() {
    const courseData = getCourseData();
    const htmlReport = generateHTMLReport(); // Generate the report content

    // Attempt to open a new window
    let reportWindow = window.open('', '_blank');

    // Check if the window opened successfully
    if (reportWindow && typeof reportWindow === 'object') {
        // Prevent the report window from reloading or duplicating content
        reportWindow.document.open();
        reportWindow.document.write(htmlReport);
        reportWindow.document.close();
        reportWindow.focus();
    } else {
        // If the window failed to open, create a downloadable HTML file instead
        console.warn('Popup blocked or window could not be opened. Offering a downloadable file instead.');

        // Create a downloadable HTML file
        const blob = new Blob([htmlReport], { type: 'text/html' });
        const downloadUrl = URL.createObjectURL(blob);

        const downloadLink = document.createElement('a');
        downloadLink.href = downloadUrl;
        downloadLink.download = courseData.course.code+'course_report.html';
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
    }
}

function saveSyllabus() {
    const courseData = getCourseData();
    const syllabus = generateSyllabus(); // Generate the report content

    // Attempt to open a new window
    let reportWindow = window.open('', '_blank');

    // Check if the window opened successfully
    if (reportWindow && typeof reportWindow === 'object') {
        // Prevent the report window from reloading or duplicating content
        reportWindow.document.open();
        reportWindow.document.write(syllabus);
        reportWindow.document.close();
        reportWindow.focus();
    } else {
        // If the window failed to open, create a downloadable HTML file instead
        console.warn('Popup blocked or window could not be opened. Offering a downloadable file instead.');

        // Create a downloadable HTML file
        const blob = new Blob([syllabus], { type: 'text/html' });
        const downloadUrl = URL.createObjectURL(blob);

        const downloadLink = document.createElement('a');
        downloadLink.href = downloadUrl;
        downloadLink.download = courseData.course.code+'syllabus.html';
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
    }
}






function generateHTMLReport() {
    const reportData = generateCourseReport();
    const courseData = getCourseData();
    if (!Array.isArray(reportData.mappedPLOs)) {
        reportData.mappedPLOs = [];
    }

    const chartDiv =document.createElement('div');
    createPieChart(chartDiv,reportData.activityTypeProportions);
    const assessedActivities = courseData.activities.filter(activity => activity.isAssessed);
      
    const { html: assessedActivitiesHTML, totalWeighting } = generateAssessedActivitiesHTML(assessedActivities);

    let html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${reportData.course.name} - Course Report</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 1200px; margin: 0 auto; padding: 20px; }
            h1, h2, h3 { color: #2c3e50; }
            .unit { background-color: #f4f4f4; padding: 15px; margin-bottom: 20px; border-radius: 5px; }
            .activity { padding: 10px; margin-bottom: 10px; border-radius: 5px; font-size:1em; }
            ${generateActivityStyles()}
            .pie-chart { width: 300px; height: 300px; }
            p {font-size: 1em;}
        </style>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/Chart.js/3.7.0/chart.min.js"></script>
    </head>
    <body>
        <h1>${reportData.course.name} (${reportData.course.code})</h1>  
         <p><strong>Revision:</strong> ${reportData.course.revision}</p>
         <p><strong>Delivery Mode:</strong> ${reportData.course.deliveryMode}</p>
         <p><strong>Credit Hours:</strong> ${reportData.course.creditHours}</p>
        <p><strong>Prerequisites:</strong> ${reportData.course.prerequisites}</p>
        <h2>Course Goal</h2>
        <div>${reportData.course.goal}</div>
        <h2>Course Description</h2>
        <div>${reportData.course.description}</div>
         <h2>Course  Notes</h2>
        <div>${reportData.course.courseNotes}
        <h2>Course Production Notes</h2>
        <div>${reportData.course.productionNotes}
        <h2>Course Learning Outcomes</h2>
         ${reportData.course.learningOutcomes && reportData.course.learningOutcomes.length > 0 ? `
            <ul>
                ${reportData.course.learningOutcomes.map((outcome, index) => `
                    <li>${index + 1}. ${outcome}
                    </li>
                `).join('')}
            </ul>
         ` : '<p>No outcomes defined for this course</p>'}   
        <h2>Program Information</h2>
        <p><strong>Program Name:</strong> ${reportData.program.name}</p>
        <p><strong>Program Level:</strong> ${reportData.program.level}</p>
        <h3>Program Learning Outcomes</h3>
              <h5>Program Learning Outcomes:</h5>
            <ol>
                 ${reportData.program.learningOutcomes.map((outcome, ploIndex) => {
                // Find CLOs that map to the current PLO
                const mappedCLOs = reportData.mappedPLOs
                    .map((cloMappings, cloIndex) => cloMappings.includes(ploIndex) ? cloIndex + 1 : null)
                    .filter(clo => clo !== null); // Filter out unmapped CLOs

                // If mappedCLOs is not empty, create the "maps to CLO" text
                const mappingText = mappedCLOs.length > 0 ? `(maps to CLO: ${mappedCLOs.join(', ')})` : '(no CLOs mapped)';

                // Return the list item with outcome and the mapping text if applicable
                return `<li>${outcome} ${mappingText}</li>`;
                }).join('')} 
          </ol>    
        <h3>Assessed activities:</h3>
         <p><strong>Total Marking Hours:</strong> ${formatTimeForDisplay(reportData.totalMarkingHours)} </p>
         <p><strong>Sum of weightings for assessments:</strong> ${totalWeighting}%</p> 
        ${reportData.unassessedLearningOutcomes.length > 0 ? `
            <h4>Unassessed Learning Outcomes</h4>
            <ul>
                ${reportData.unassessedLearningOutcomes.map(outcome => `
                    <li>${outcome}</li>
                `).join('')}
            </ul>
        ` : ''}
         ${assessedActivitiesHTML}
          <h2>Summary Statistics</h2>
        <p><strong>Total Study Hours:</strong> ${formatTimeForDisplay(reportData.totalStudyHours)} </p>
               <h3>Activity Type Distribution</h3>
        ${chartDiv.innerHTML} 
 
       <h2>Units</h2>
        ${generateUnitsHTML(reportData.units)}

    </body>
    </html>
    `;
    return html;
}

function generateSyllabus() {
    const reportData = generateCourseReport();
    const courseData = getCourseData();
    if (!Array.isArray(reportData.mappedPLOs)) {
        reportData.mappedPLOs = [];
    }

    const assessedActivities = courseData.activities.filter(activity => activity.isAssessed);
    const { html: assessedActivitiesHTML, totalWeighting } = generateAssessedActivitiesHTML(assessedActivities);
    const units = reportData.units.map(unit => `
        <div class="unit">
            <h3>${unit.title}</h3>
            <p>${unit.description}</p>
            <p><strong>Total Study Hours:</strong> ${formatTimeForDisplay(unit.totalStudyHours)} </p>
        </div>
    `).join('');

    let html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${reportData.course.name} - Course Syllabus</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 1200px; margin: 0 auto; padding: 20px; }
            h1, h2, h3 { color: #2c3e50; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            table, th, td { border: 1px solid #333; }
            th, td { padding: 10px; text-align: left; }
            th { background-color: #f4f4f4; }
            .unit { background-color: #f4f4f4; padding: 15px; margin-bottom: 20px; border-radius: 5px; }
            ${generateActivityStyles()}
        </style>
    </head>
    <body>
        <h1>${reportData.course.name} (${reportData.course.code})</h1>  
        <p><strong>Delivery Mode:</strong> ${reportData.course.deliveryMode}</p>
        <p><strong>Credit Hours:</strong> ${reportData.course.creditHours}</p>
        <p><strong>Prerequisites:</strong> ${reportData.course.prerequisites}</p>
        <h2>Course Notes</h2>
        <div>${reportData.course.courseNotes || 'No course notes available.'}</div>
        <h2>Overview</h2>
        <div>${reportData.course.description || 'No description available.'}</div>
        <h2>Outline</h2>
        ${units}
        <h2>Learning Outcomes</h2>
        ${reportData.course.learningOutcomes && reportData.course.learningOutcomes.length > 0 ? `
            <ul>
                ${reportData.course.learningOutcomes.map((outcome, index) => `
                    <li>${index + 1}. ${outcome}</li>
                `).join('')}
            </ul>
         ` : '<p>No learning outcomes defined for this course.</p>'}
        <h2>Evaluation</h2>
        <table>
            <thead>
                <tr>
                    <th>Activity</th>
                    <th>Description</th>
                    <th>Weighting (%)</th>
                    </tr>
            </thead>
            <tbody>
                ${assessedActivities.map(activity => `
                    <tr>
                        <td>${activity.title}</td>
                        <td>${activity.description}</td>
                        <td>${activity.weighting || '0'}</td>                        
                    </tr>
                `).join('')}
                <tr>
                    <td colspan="2"><strong>Total Weighting</strong></td>
                    <td><strong>${totalWeighting}%</strong></td>
                </tr>
            </tbody>
        </table>
    </body>
    </html>
    `;
    return html;
}

function generateUnitsHTML(units) {    
    return units.map(unit => `
        <div class="unit">
            <h3>${unit.title}</h3>
            <p>${unit.description}</p>
            <p><strong>Total Study Hours:</strong> ${formatTimeForDisplay(unit.totalStudyHours)} </p>
            <p><strong>Total Marking Hours:</strong> ${formatTimeForDisplay(unit.totalMarkingHours)} </p>
            <p><strong>Learning Outcomes Covered:</strong> ${getUnitLearningOutcomes(unit.id).join(', ')}</p>
            <h4>Activities</h4>
            ${generateActivitiesHTML(unit.activities)}
        </div>
    `).join('');

}

function generateActivitiesHTML(activities) {
    return activities.map(activity => `
        <div class="activity activity-${activity.type.toLowerCase()}">
            <h4>${activity.title} (${activity.type})</h4>
            <p><strong>Subtype:</strong> ${getActivityType(activity.id,activities).specificActivity}
            <p><strong>Description: </strong>${activity.description}</p>
            <p><strong>Study Hours:</strong> ${formatTimeForDisplay(activity.studyHours)}</p>
            <p><strong>Learning Outcomes:</strong>
            ${activity.learningOutcomes && activity.learningOutcomes.length > 0 ? `
                   ${getActivityLearningOutcomesText(activity.id).join(' ; ')} </p>
         ` : '<p>No outcomes defined for this activity</p>'}   
            ${activity.isAssessed ? `
                <p><strong>Assessment:</strong> Required: ${activity.isRequired ? 'Yes' : 'No'}, 
                   Pass Mark: ${activity.passMark}%, Weighting: ${activity.weighting}%, 
                   Marking Hours: ${formatTimeForDisplay(activity.markingHours)}</p>
            ` : ''}
        </div>
    `).join('');
}

function generateAssessedActivitiesHTML(activities) {
    const courseData = getCourseData();

    const assessedActivitiesHTML = activities.map(activity => {
        // Find the unit that matches the unitId of the activity
        const unit = courseData.units.find(unit => unit.id === activity.unitId);
        const unitTitle = unit ? unit.title : 'Unknown Unit'; // Fallback if the unit is not found

        return `
            <div class="activity activity-${activity.type.toLowerCase()}">
                <h5>Assessed Activity: ${activity.title} (${activity.type}). 
                <strong>Unit:</strong> ${unitTitle}</h5> 
                <div>
                    ${activity.isAssessed ? `
                            <strong>Required:</strong> ${activity.isRequired ? 'Yes' : 'No'}, 
                            <br><strong>Pass Mark:</strong> ${activity.passMark}%, 
                            <br><strong>Weighting:</strong> ${activity.weighting}%, 
                            <br><strong>Marking Hours:</strong> ${formatTimeForDisplay(activity.markingHours)}
                    ` : ''}
                </div>
            </div>
        `;
    }).join('');

    // Calculate the total weighting of all assessed activities
    const totalWeighting = activities.reduce((total, activity) => {
        return total + (parseInt(activity.weighting) || 0); // Default to 0 if weighting is undefined
    }, 0);

    return {
        html: assessedActivitiesHTML,
        totalWeighting: totalWeighting
    };
}

function calculateStudyTime(activity, wordCount) {
    switch (activity) {
        case 'reading_main':
            return wordCount / 300;
        case 'reading_understand':
            return wordCount / 130;
        case 'reading_analyze':
            return wordCount / 70;
        case 'formative_writing':
            return wordCount * 1.2;
        case 'reflection':
            return wordCount * 0.2;
        case 'essay':
            return wordCount * 0.023 * 60;
        default:
            return 0;
    }
}

// Utility functions

export function generateActivityStyles() {
    const activityColours = getActivityTypesAndColours();
    return activityColours.map(activity => 
        `.activity-${activity.type} { background-color: ${activity.color}; }`
    ).join('\n');
}

function validateTimeInput(input) {
    const value = input.value.trim();
    if (/^\d+$/.test(value)) {
        // It's a number (minutes)
        return true;
    } else if (/^\d{1,2}:\d{2}$/.test(value)) {
        // It's in HH:MM format
        const [hours, minutes] = value.split(':').map(Number);
        return minutes < 60;
    }
    return false;
}

function setupFormValidation() {
    const timeInputs = document.querySelectorAll('input[type="text"][name$="Hours"]');
    timeInputs.forEach(input => {
        input.addEventListener('input', function() {
            if (validateTimeInput(this)) {
                this.setCustomValidity('');
            } else {
                this.setCustomValidity('Please enter time in minutes or HH:MM format');
            }
        });
    });
}

function truncateText(text, wordCount) {
    const words = text.split(/\s+/);
    if (words.length > wordCount) {
        return words.slice(0, wordCount).join(' ') + '...';
    }
    return text;
}

function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

function parseHours(timeString) {
    const [hours, minutes] = timeString.split(':').map(Number);
    return hours + minutes / 60;
}

function formatHours(hours) {
    const wholeHours = Math.floor(hours);
    const minutes = Math.round((hours - wholeHours) * 60);
    return `${wholeHours}h ${minutes}m`;
}

function getUnitLearningOutcomes(unitId) {
    const courseData = getCourseData();
    const unitActivities = courseData.activities.filter(activity => activity.unitId === unitId);
    const outcomeIndices = new Set(unitActivities.flatMap(activity => activity.learningOutcomes));
    return Array.from(outcomeIndices).map(index => courseData.course.learningOutcomes[index]);
}

function getActivityType(activityId, activities) {
    // Find the activity with the matching id
    const activity = activities.find(a => a.id === activityId);

    // Check if activity exists and return the type and specificActivity, or return null if not found
    if (activity) {
        return {
            type: activity.type,
            specificActivity: activity.specificActivity
        };
    } else {
        return null; // Return null if the activity with the given ID is not found
    }
}

function getActivityLearningOutcomesText(activityId) {
    const courseData = getCourseData();

    // Find the activity with the given ID
    const activity = courseData.activities.find(a => a.id === activityId);

    if (!activity) {
        return []; // Return an empty array if the activity is not found
    }

    // Map the numeric learning outcome indices to the corresponding text
    return activity.learningOutcomes.map(index => courseData.course.learningOutcomes[index]);
}



function handleActivityReorder(activityId, newUnitId, newIndex) {
    
    const courseData = getCourseData();
    const activityIndex = courseData.activities.findIndex(a => a.id === activityId);
    
    if (activityIndex !== -1) {
        const activity = courseData.activities[activityIndex];

        // Remove the activity from its current position
        courseData.activities.splice(activityIndex, 1);
        
        // Get the activities for the target unit (newUnitId)
        const unitActivities = courseData.activities.filter(a => a.unitId === newUnitId);
        
        // Ensure the newIndex is valid within the unit's boundaries
        const clampedNewIndex = Math.min(Math.max(0, newIndex), unitActivities.length);
        
        // Determine the global insertion index based on the clamped position in the unit
        let targetIndex;

        if (unitActivities.length === 0) {
            // If no activities in the new unit, insert at the first position
            targetIndex = courseData.activities.findIndex(a => a.unitId === newUnitId) + clampedNewIndex;
        } else {
            // Find the global index where this activity will go
            const firstInUnitIndex = courseData.activities.findIndex(a => a.unitId === newUnitId);
            targetIndex = firstInUnitIndex + clampedNewIndex;
        }

        // If inserting at the start of the unit (empty or not), append it at the end of the activities array
        if (targetIndex === -1 || targetIndex >= courseData.activities.length) {
            targetIndex = courseData.activities.length;
        }

        // Insert the activity at the determined global index with the new unitId
        courseData.activities.splice(targetIndex, 0, { ...activity, unitId: newUnitId });

        saveCourse(courseData);
        updateUI();
    }
}

// Export necessary functions
export {
    //initializeUI,
    //updateUI,
    setupEventListeners,
    populateActivityForm,
    handleActivityFormSubmit
};