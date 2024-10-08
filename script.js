/*
// Courseomatic
// Author: Jon Dron, with help from various AIs
// email: courseomatic@jondron.org 
// Date: 8 October 2024
// Licence: GPL3
// Version: 0.4.2
*/

(function () {
    'use strict';

    // ==============================
    // SECTION 1: DATA STRUCTURES AND INITIALIZATION
    // ==============================

    let courseData = {
        program: {
            name: '',
            level: '',
            description: '',
            learningOutcomes: [] // Array of PLOs
        },
        course: {
            name: '',
            code: '',
            creditHours: 0,
            prerequisites: '',
            revision: '',
            deliveryMode: '',
            goal: '',
            description: '',
            courseNotes: '',
            courseDevelopmentNotes: '',
            learningOutcomes: [] // Array of CLOs
        },
        mappedPLOs: [], // Array where each index represents the mapping of a CLO to a PLO (or none)
        units: [],
        activities: []
    };

    const activityTypes = {
        acquisition: ["reading", "watching video", "listening to audio", "attending lecture", "other"],
        practice: ["exercises", "tests & quizzes", "exam", "drills", "games", "simulations & role plays",
                     "workshop", "design", "prototyping", "other"],
        investigation: ["research project", "web search", "fieldwork", "case study", 
                    "problem-based learning", "inquiry-based learning", "data analysis", "experiment", "lab","other"],
        reflection: ["journaling", "discussion", "outcome mapping", "portfolio", "exit takeaway", 
                    "reflective essay", "feedback", "survey", "exam","other"],
        production: ["writing","podcast", "demo", "presentation", "interactive media","design", "diagram","drawing",
                     "experiment", "coding", "configuration", "prototyping", "model design",
                    "concept map", "portfolio", "project", "exam","other"],
        discussion: ["discussion", "debate", "think-pair-share", "socratic seminar", "tutorial","peer feedback", "commentary", "other"],
        cooperation: ["social bookmarking", "tagging", "commenting", "rating", "blog", "wiki", "scheduling", "image sharing", "FAQ contribution", "document sharing", "other"],
        collaboration: ["group project", "study group", "workshop", "discussion", "conference", "wiki", "peer review", "brainstorming", "role playing","seminar", "other"]
    };

    const LOCAL_STORAGE_KEY = 'courseStoryboardData';

    // ==============================
    // SECTION 2: CORE FUNCTIONS
    // ==============================

    function initializeCourse() {
        courseData = {
            program: {
                name: '',
                level: '',
                description: '',
                learningOutcomes: [] 
            },
            course: {
                name: '',
                code: '',
                creditHours: 0,
                prerequisites: '',
                revision: '',
                deliveryMode: '',
                goal: '',
                description: '',
                courseNotes: '',
                courseDevelopmentNotes: '',
                learningOutcomes: [] 
            },
            mappedPLOs: [], 
            units: [],
            activities: []
        };
    }
    function getCourseData() {
        return courseData;
    }
    function saveCourse(data) {
        if (data.program) {
            courseData.program = { ...courseData.program, ...data.program };
        }
        if (data.course) {
            courseData.course = { ...courseData.course, ...data.course };
        }
        if (data.units) {
            courseData.units = data.units;
        }
        if (data.activities) {
            courseData.activities = data.activities;
        }
        if (data.mappedPLOs) {
            courseData.mappedPLOs = data.mappedPLOs;
        }
        localStorage.setItem('courseData', JSON.stringify(courseData));
    }
    function loadSavedCourse() {
        const savedData = localStorage.getItem('courseData');
        if (savedData) {
            try {
                const parsedData = JSON.parse(savedData);
                courseData = {
                    program: parsedData.program || {},
                    course: parsedData.course || {},
                    units: parsedData.units || [],
                    activities: parsedData.activities || [],
                    mappedPLOs: parsedData.mappedPLOs || []
                };
                return courseData;
            } catch (error) {
                console.error('Error parsing saved course data:', error);
                initializeEmptyCourse();
            }
        } else {

            initializeEmptyCourse();           
        }
    }
    function clearCourse() {
        initializeCourse();
    }

    // ==============================
    // SECTION 3: ANALYSIS FUNCTIONS
    // ==============================

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

    function getActivityTypeProportions() {
        if (courseData.activities.length === 0) {
            return [];
        }

        const typeHoursMap = {};

        // Step 1: Calculate total study hours for each activity type, treating null as 0
        courseData.activities.forEach(activity => {
            const hours = timeToMinutes(activity.studyHours) ?? 0;  // Handle null as 0
            if (typeHoursMap[activity.type]) {
                typeHoursMap[activity.type] += hours;
            } else {
                typeHoursMap[activity.type] = hours;
            }
        });

        // Step 2: Convert the map into an array of { type, totalHours } objects
        const result = Object.keys(typeHoursMap).map(type => {
            return {
                type: type,
                totalHours: typeHoursMap[type]/timeToMinutes(getTotalStudyHours())
            };
        });

        return result;
    }
    
    function getUnassessedLearningOutcomes() {
        const assessedOutcomes = new Set(
            courseData.activities
                .filter(activity => activity.isAssessed)
                .flatMap(activity => activity.learningOutcomes)
        );

        return courseData.course.learningOutcomes.filter((_, index) => !assessedOutcomes.has(index));
    }
    function generateCourseReport() {
        return {
            course: { ...courseData.course },
            program: { ...courseData.program },
            units: courseData.units.map(unit => ({
                ...unit,
                activities: courseData.activities.filter(activity => activity.unitId === unit.id),
                totalStudyHours: courseData.activities
                    .filter(activity => activity.unitId === unit.id)
                    .reduce((total, activity) => total + parseFloat(activity.studyHours), 0),
                totalMarkingHours: courseData.activities
                    .filter(activity => activity.unitId === unit.id && activity.isAssessed)
                    .reduce((total, activity) => total + parseFloat(activity.markingHours || 0), 0),
                learningOutcomes: [...new Set(courseData.activities
                    .filter(activity => activity.unitId === unit.id)
                    .flatMap(activity => activity.learningOutcomes))] // CLOs
            })),
            totalStudyHours: getTotalStudyHours(),
            totalMarkingHours: getTotalMarkingHours(),
            activityTypeProportions: getActivityTypeProportions(),
            unassessedLearningOutcomes: getUnassessedLearningOutcomes(),
            mappedPLOs: courseData.mappedPLOs
        };
    }
    function getTotalStudyHours() {
        const totalMinutes = courseData.activities.reduce((total, activity) => {
            // //('Activity study hours:', activity.studyHours);
            return addTimes(total, activity.studyHours);
        }, 0);
        return formatTimeForDisplay(totalMinutes);
    }
    function getTotalMarkingHours() {
        const totalMinutes = courseData.activities
            .filter(activity => activity.isAssessed)
            .reduce((total, activity) => {
            //    //('Activity marking hours:', activity.markingHours);
                return addTimes(total, activity.markingHours || 0);
            }, 0);
        return formatTimeForDisplay(totalMinutes);
    }
    function getUnitStudyHours(unitId) {
        const totalMinutes = courseData.activities
            .filter(activity => activity.unitId === unitId)
            .reduce((total, activity) => {
           //     //('Unit activity study hours:', activity.studyHours);
                return addTimes(total, activity.studyHours);
            }, 0);
        return formatTimeForDisplay(totalMinutes);
    }
    function getUnitMarkingHours(unitId) {
        const totalMinutes = courseData.activities
            .filter(activity => activity.unitId === unitId && activity.isAssessed)
            .reduce((total, activity) => {
             //   //('Unit activity marking hours:', activity.markingHours);
                return addTimes(total, activity.markingHours || 0);
            }, 0);
        return formatTimeForDisplay(totalMinutes);
    }

    // ==============================
    // SECTION 4: UNIT MANAGEMENT
    // ==============================

    function addUnit(unitData) {
        const newUnit = {
            id: generateUniqueId$2(),
            title: unitData.title,
            description: unitData.description,
            learningOutcomes: [],
            order: courseData.units.length
        };
        courseData.units.push(newUnit);
        saveCourse(courseData);
    //    //('Updated units:', courseData.units);
        return newUnit;
    }
    function createUnit(unitData) {
        if (!unitData || !unitData.title) {
            console.error('Attempted to create unit with invalid data:', unitData);
            return null;
        }
        return addUnit(unitData);
    }
    function editUnit(unitId, updatedData) {
        const courseData = getCourseData();
        const unitIndex = courseData.units.findIndex(unit => unit.id === unitId);
        if (unitIndex !== -1) {
            courseData.units[unitIndex] = {
                ...courseData.units[unitIndex],
                ...updatedData
            };
            saveCourse(courseData);
             return courseData.units[unitIndex];
        } else {
            console.error('Unit not found:', unitId);
            return null;
        }
        
    }
    function deleteUnit(unitId) {
        const courseData = getCourseData();
        const unitIndex = courseData.units.findIndex(unit => unit.id === unitId);
        if (unitIndex !== -1) {
            // Remove the unit
            courseData.units.splice(unitIndex, 1);
            
            // Remove all activities associated with this unit
            courseData.activities = courseData.activities.filter(activity => activity.unitId !== unitId);
            
            // Update the order of remaining units
            courseData.units.forEach((unit, index) => {
                unit.order = index;
            });
            
            return true;
        }
        return false;
    }
    function cloneUnit(unitId) {
        const courseData = getCourseData();
        const unit = courseData.units.find(unit => unit.id === unitId);
        if (unit) {
            const clonedUnit = {
                ...unit,
                id: generateUniqueId(),
                title: `${unit.title} (Clone)`,
                order: courseData.units.length
            };
            courseData.units.push(clonedUnit);

            // Clone activities associated with this unit
            const activities = getActivitiesByUnit(unitId);
            activities.forEach(activity => {
                const clonedActivity = {
                    ...activity,
                    id: generateUniqueId(),
                    unitId: clonedUnit.id,
                    title: `${activity.title} (Clone)`
                };
                courseData.activities.push(clonedActivity);
            });

            return clonedUnit;
        }
        return null;
    }
    function generateUniqueId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
    }

    // ==============================
    // SECTION 5: ACTIVITY MANAGEMENT
    // ==============================

    function getActivityTypes() {
        return Object.keys(activityTypes);
    }
    function getSpecificActivities(type) {
        return activityTypes[type] || [];
    }
    function createActivity(activityData) {
        const courseData = getCourseData();
        if (activityData.otherActivity){
            addCustomActivityType(activityData.type,activityData.otherActivity);
        }

        const newActivity = {
            id: generateUniqueId(),
            ...activityData,
            studyHours: timeToMinutes(activityData.studyHours),
            markingHours: activityData.isAssessed ? timeToMinutes(activityData.markingHours) : 0
         };
        courseData.activities.push(newActivity);
        saveCourse(courseData);
        return newActivity;
    }
    function editActivity(activityId, updatedData) {
        if ('otherActivity' in updatedData){
            addCustomActivityType(updatedData.type,updatedData.otherActivity);
        }
        const courseData = getCourseData();
        const activityIndex = courseData.activities.findIndex(a => a.id === activityId);
        if (activityIndex !== -1) {
            courseData.activities[activityIndex] = {
                ...courseData.activities[activityIndex],
                ...updatedData,
            studyHours: timeToMinutes(updatedData.studyHours),
            markingHours: updatedData.isAssessed ? timeToMinutes(updatedData.markingHours) : 0
                  };
            saveCourse(courseData);
            return courseData.activities[activityIndex];
        }
        console.error('Activity not found:', activityId);
        return null;
    }
    function deleteActivity(activityId) {
        const courseData = getCourseData();
        const activityIndex = courseData.activities.findIndex(activity => activity.id === activityId);
        if (activityIndex !== -1) {
            courseData.activities.splice(activityIndex, 1);
            return true;
        }
        return false;
    }
    function cloneActivity(activityId) {
        const courseData = getCourseData();
        const activity = courseData.activities.find(activity => activity.id === activityId);
        if (activity) {
            const clonedActivity = {
                ...activity,
                id: generateUniqueId$1(),
                title: `${activity.title}`
            };
            courseData.activities.push(clonedActivity);
            return clonedActivity;
        }
        return null;
    }
    function getActivitiesByUnit(unitId) {
        const courseData = getCourseData();
        return courseData.activities.filter(activity => activity.unitId === unitId);
    }
    function generateUniqueId() {}
    function addCustomActivityType(type, specificActivity) {
        if (!activityTypes[type]) {
            console.warn(`Activity type "${type}" not found. Adding it as a new type.`);
            activityTypes[type] = [];
        }
        if (!activityTypes[type].includes(specificActivity)) {
            activityTypes[type].push(specificActivity);
        }
    }

    // ==============================
    // SECTION 6: UTILITY FUNCTIONS
    // ==============================

    function saveToLocalStorage() {
        const courseData = getCourseData();
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(courseData));
    }
    function loadFromLocalStorage() {
        const savedData = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (savedData) {
            const parsedData = JSON.parse(savedData);
            loadSavedCourse();
            return parsedData;
        }
        return null;
    }
    function timeToMinutes(timeInput) {}
    function minutesToTime(minutes) {
        if (typeof minutes === 'string') {
            if (minutes.includes(':')) {
                return minutes; // Already in HH:MM format
            }
            minutes = parseInt(minutes, 10) || 0;
        }
        minutes = Math.max(0, minutes || 0);
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
    }
    function formatTimeForDisplay(time) {
        const minutes = timeToMinutes(time);
        return minutesToTime(minutes);
    }
    function addTimes(time1, time2) {
        const minutes1 = timeToMinutes(time1);
        const minutes2 = timeToMinutes(time2);
        return minutes1 + minutes2;
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
    function getCallerFunctionName() {
        // Create an error object and get the stack trace
        const error = new Error();
        const stack = error.stack.split("\n");

        // The caller function is typically on the third line of the stack trace
        // Format of stack: stack[0] -> "Error", stack[1] -> current function, stack[2] -> caller function
        if (stack.length > 2) {
            return stack[2].trim();
        } else {
            return "Caller not found";
        }
    }

    // ==============================
    // SECTION 7: UI FUNCTIONS
    // ==============================

    function initializeUI() {
        const appContent = document.getElementById('main');
        if (appContent) {
            main.style.display = 'block'; 
        }

        setupEventListeners();
        setupFormValidation();
        setTitle();
        updateUI();
    }
    function updateUI() {
        initializeTinyMCE();    
        updateCourseInfo();
        updateUnits();
        updateActivityTypePieChart();
        updateUnassessedLearningOutcomes();
        setTitle();
    }
    function initializeTinyMCE() {
        try {
            tinymce.init({
                selector: '#programDescription, #courseGoal, #courseDescription, #productionNotes, '+
                    '#unitDescription, #activityDescription, #activityDevNotes, #courseNotes, #courseDevelopmentNotes',
                height: 300,
                menubar: false,
                plugins: [
                    'advlist autolink lists link image charmap print preview anchor',
                    'searchreplace visualblocks code fullscreen',
                    'insertdatetime media table paste code help wordcount',
                    'table',
                    'code',
                ],
                toolbar: 
                'undo redo | cut copy paste | bold italic underline strikethrough | backcolor forecolor | formatselect | ' +
                'alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | table | code \n' + 
                
                'searchreplace | visualblocks | removeformat | insertdatetime | anchor | link image | pastetext | preview | fullscreen | help',  
                toolbar_mode: 'wrap',        
                paste_as_text: true,
                images_upload_handler: function (blobInfo, success, failure) {
                    var reader = new FileReader();
                    reader.onload = function() {
                        success(reader.result);
                    };
                    reader.onerror = function() {
                        failure('Image upload failed');
                    };
                    reader.readAsDataURL(blobInfo.blob());
                },
                content_style: 'body { font-family:Helvetica,Arial,sans-serif; font-size:14px }'
            });
        } catch (error){
            console.warn('Error initializing tinyMCE:', error);
        }
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
                    //initializeTinyMCE();    
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
                        if(document.getElementById('unit-nav')){
                            document.getElementById('unit-nav').innerHTML = '';
                        } else {
                            console.warning("Not found:", document.getElementById('unit-nav'));
                        };
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
            document.addEventListener('keydown', function(event) {
                if (event.key === 'Escape') {  // Check if the 'Escape' key was pressed
                    cancelButtons.forEach(button => button.click()); // Simulate a click on each cancel button
                    closeModal(); //close the course info popup if it is open
                    //close any expanded activity cards
                    document.querySelectorAll('div.expanded[data-activity-id]').forEach(div => {
                        const activityId = div.getAttribute('data-activity-id');
                        collapseActivityCard(activityId);
                    });
                }
        });

        // make adding an activity accessible
        document.addEventListener('keydown', function(event) {
            if (event.target.classList.contains('add-activity-button') && event.code === 'Space') {
                event.preventDefault(); // Prevent default action of space key
                event.target.click(); // Trigger click event
            }
        });
        
        


        //study hour calculator 
         // Main form elements
         document.getElementById('activityForm');
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
    function handleActivityReorder(activityId, newUnitId, newIndex) {}
    function handleAddActivity(unitId) {
        const form = document.getElementById('activityForm');
        form.reset();
        populateActivityForm();
        //initializeTinyMCE();    
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
            //initializeTinyMCE();    
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
                courseDevelopmentNotes: document.getElementById('courseDevelopmentNotes').value,
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
            devNotes: tinymce.get('activityDevNotes').getContent(),
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
            activityData.markingHours = document.getElementById('markingHours').value;
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
        }
    }




    function populateCourseForm() {
        const courseData = getCourseData();
      //  initializeTinyMCE();    

        document.getElementById('courseName').value = courseData.course.name || '';
        document.getElementById('courseCode').value = courseData.course.code || '';
        document.getElementById('creditHours').value = courseData.course.creditHours || '';
       document.getElementById('coursePrerequisites').value = courseData.course.prerequisites || ''; 
        document.getElementById('courseRevision').value = courseData.course.revision || '';
        document.getElementById('deliveryMode').value = courseData.course.deliveryMode || '';


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
        if (tinymce.get('courseDevelopmentNotes')) {
            tinymce.get('courseDevelopmentNotes').setContent(courseData.course.courseDevelopmentNotes || '');
        } else {
            console.error('TinyMCE editor for courseDevelopmentNotes not found');
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
    
           <div class="map-plo-container" style="display: flex; align-items: center; margin-top: 10px;">
               <label style="margin-right: 10px;">Map to PLO(s):</label>
               <div class="plo-checkboxes" style="display: flex; flex-wrap: wrap; gap: 10px; flex: 1;">
                   ${courseData.program.learningOutcomes.map((_, ploIndex) => `
                       <label>
                           <input type="checkbox" name="ploMapping${cloIndex}" value="${ploIndex}" ${mappedPLOs.includes(ploIndex) ? 'checked' : ''}>
                           ${ploIndex + 1}
                       </label>
                   `).join('')}
               </div>
               <button type="button" class="removeCLO" style="margin-left: 10px;">Remove CLO</button>
           </div>
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
            if (tinymce.get('activityDevNotes')) {
                tinymce.get('activityDevNotes').setContent(activity.devNotes || '');
            } else {
                console.error('TinyMCE editor for activityDevNotes not found');
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
        <p><strong>Production Notes:</strong> ${courseData.course.courseDevelopmentNotes}</p>

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
                    <div class="add-activity-button" data-unit-id="${unit.id}" 
                        title="Add a new activity to this unit" tabIndex="0">    
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
        <p><strong>Development notes:</strong> ${activity.devNotes?activity.devNotes:''}</p>
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



    // reports


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
        <div>${reportData.course.courseDevelopmentNotes}
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
             <p><strong>Development Notes: </strong>${activity.devNotes}</p>
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

    function generateActivityStyles() {
        const activityColours = getActivityTypesAndColours();
        return activityColours.map(activity => 
            `.activity-${activity.type} { background-color: ${activity.color}; }`
        ).join('\n');
    }
   // timeUtils.js

    // Convert any time input to minutes
    function timeToMinutes(timeInput) {
        if (timeInput === null || timeInput === undefined) {
            console.warn('Received null or undefined time input');
            timeInput = 0;
        }
        if (typeof timeInput === 'number') {
            return Math.max(0, timeInput); // Ensure non-negative
        }
        if (typeof timeInput === 'string') {
            if (timeInput.includes(':')) {
                // HH:MM format
                const [hours, minutes] = timeInput.split(':').map(Number);
                return Math.max(0, hours * 60 + minutes);
            } else {
                // Assume it's a string representation of minutes
                return Math.max(0, parseInt(timeInput, 10) || 0);
            }
        }
        console.warn('Invalid time input:', timeInput);
        return 0; // Return 0 for invalid inputs
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
            //initializeTinyMCE();    
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
                courseDevelopmentNotes: document.getElementById('courseDevelopmentNotes').value,
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
            devNotes: tinymce.get('activityDevNotes').getContent(),
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
            activityData.markingHours = document.getElementById('markingHours').value;
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
        }
    }
    function populateCourseForm() {
        const courseData = getCourseData();
      //  initializeTinyMCE();    

        document.getElementById('courseName').value = courseData.course.name || '';
        document.getElementById('courseCode').value = courseData.course.code || '';
        document.getElementById('creditHours').value = courseData.course.creditHours || '';
       document.getElementById('coursePrerequisites').value = courseData.course.prerequisites || ''; 
        document.getElementById('courseRevision').value = courseData.course.revision || '';
        document.getElementById('deliveryMode').value = courseData.course.deliveryMode || '';


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
        if (tinymce.get('courseDevelopmentNotes')) {
            tinymce.get('courseDevelopmentNotes').setContent(courseData.course.courseDevelopmentNotes || '');
        } else {
            console.error('TinyMCE editor for courseDevelopmentNotes not found');
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
    
           <div class="map-plo-container" style="display: flex; align-items: center; margin-top: 10px;">
               <label style="margin-right: 10px;">Map to PLO(s):</label>
               <div class="plo-checkboxes" style="display: flex; flex-wrap: wrap; gap: 10px; flex: 1;">
                   ${courseData.program.learningOutcomes.map((_, ploIndex) => `
                       <label>
                           <input type="checkbox" name="ploMapping${cloIndex}" value="${ploIndex}" ${mappedPLOs.includes(ploIndex) ? 'checked' : ''}>
                           ${ploIndex + 1}
                       </label>
                   `).join('')}
               </div>
               <button type="button" class="removeCLO" style="margin-left: 10px;">Remove CLO</button>
           </div>
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
            if (tinymce.get('activityDevNotes')) {
                tinymce.get('activityDevNotes').setContent(activity.devNotes || '');
            } else {
                console.error('TinyMCE editor for activityDevNotes not found');
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
        <p><strong>Production Notes:</strong> ${courseData.course.courseDevelopmentNotes}</p>

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
    function closeModal() {
        document.getElementById('courseInfo').style.display = 'none';
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
                    <div class="add-activity-button" data-unit-id="${unit.id}" 
                        title="Add a new activity to this unit" tabIndex="0">    
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
        <p><strong>Development notes:</strong> ${activity.devNotes?activity.devNotes:''}</p>
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

    // ==============================
    // SECTION 8: REPORT GENERATION
    // ==============================

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
        <div>${reportData.course.courseDevelopmentNotes}
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
        //console.log("activities:",activities);
        return activities.map(activity => `
        <div class="activity activity-${activity.type.toLowerCase()}">
            <h4>${activity.title} (${activity.type})</h4>
            <p><strong>Subtype:</strong> ${getActivityType(activity.id,activities).specificActivity}
            <p><strong>Description: </strong>${activity.description}</p>
             <p><strong>Development Notes: </strong>${activity.devNotes}</p>
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

    // ==============================
    // SECTION 9: CHART GENERATION
    // ==============================

    function getActivityTypesAndColours() {
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
    function createPieChart(container, data) {
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

        const width = 500; 
        const height = 500; 
        const radius = Math.min(width, height) / 2 - 120; 

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

    // ==============================
    // SECTION 10: INITIALIZATION
    // ==============================

    function initGettingStarted(){

        const courseData = {
            "program": {
              "name": "none",
              "level": "none",
              "description": "",
              "learningOutcomes": []
            },
            "course": {
              "name": "Getting started",
              "code": "Getting Started",
              "creditHours": "0",
              "prerequisites": "none",
              "revision": "0.1",
              "deliveryMode": "online",
              "goal": "",
              "description": "",
              "courseNotes": "",
              "courseDevelopmentNotes": "",
              "learningOutcomes": [
                "to make use of all the tools and features of Courseomatic",
                "to design a course using Courseomatic",
                "to use Courseomatic's reporting features effectively"
              ]
            },
            "units": [
              {
                "id": "m1zel0wf2drmh",
                "title": "Getting started",
                "description": "",
                "learningOutcomes": [],
                "order": 0
              },
              {
                "id": "m1zemv151uigs",
                "title": "Course design with Courseomatic",
                "description": "",
                "learningOutcomes": [],
                "order": 1
              }
            ],
            "activities": [
              {
                "id": "m1znlc2bqm8t3",
                "type": "acquisition",
                "specificActivity": "reading",
                "title": "Start here",
                "description": "<p>Click the activity cards to see the contents</p>",
                "devNotes": "",
                "studyHours": 1,
                "unitId": "m1zel0wf2drmh",
                "isAssessed": false,
                "otherActivity": "",
                "learningOutcomes": [
                  0
                ],
                "markingHours": 0
              },
              {
                "id": "m1zergfm5wdwx",
                "type": "acquisition",
                "specificActivity": "reading",
                "title": "Courseomatic overview",
                "description": "<p dir=\"auto\">Courseomatic is a javascript app to develop course storyboards. Using a drag and drop interface (with buttons as fallback) you can create:</p>\n<ul dir=\"auto\">\n<li>courses, with learning outcomes that are mappable to program learning outcomes</li>\n<li>units - weeks, or themes, or whatever</li>\n<li>activities - these are the main elements of the system, represented as cards that can be dragged within and between units.</li>\n<li>assessments - these are just activities that have been marked as assessments, with special fields for marking hours, pass marks, percentage of total marks</li>\n</ul>\n<p dir=\"auto\">The app provides various forms of assistance with the mechanics of writing a course: it automatically calculates total study hours and total marking hours, shows proportions of time spent on different learning activity types, identifies outcomes that have not yet been assessed, it can help calculate estimated study hours (for writing and reading) and it can generate a syllabus and a full course report that can be used to develop the course itself.</p>\n<p dir=\"auto\">It is intended to scaffold the course design process in a way that focuses on what learners will do and how they will learn, rather than what we intend to teach. What we intend to teach is specified in the learning outcomes and in the units (which have titles and descriptions but that are largely specified in terms of learning activities). Assessments are simply another activity type, with fields for weighting, pass mark, optionality, and projected marking time.</p>\n<p dir=\"auto\">The learning activity types are based on ABC Learning Design activity types, with the addition of reflection and cooperation to better support self-paced study (you don't have to use those if you don't like them).</p>\n<div class=\"markdown-heading\" dir=\"auto\">\n<h2 class=\"heading-element\" dir=\"auto\" tabindex=\"-1\">Limitations</h2>\n<a id=\"user-content-limitations\" class=\"anchor\" href=\"https://github.com/jondron/Courseomatic-TNG#limitations\" aria-label=\"Permalink: Limitations\"></a></div>\n<p dir=\"auto\">Courseomatic is a single-user app that, on the bright side, needs no backend application server to run. This is by design: it means it can be deployed on (say) an LMS like Brightspace and needs no special privileges to do so, meaning anyone with editing rights can add it to their course. Changes are saved locally (on the user's machine, by their browser) every 30 seconds, and can be exported and imported via JSoN files should they wish to share it or to work in a different browser or on a different machine, but only one person can work on a given course design at a time.</p>\n<p dir=\"auto\">A multi-user version (or rather, one with the option to be set as multi-user) may be developed later but, for now, the assumption is that it will be used by a single course designer, ideally in collaboration with a team, but there is one and only one master copy that can be shared but that cannot be edited by multiple users simultaneously.</p>\n<div class=\"markdown-heading\" dir=\"auto\">\n<h2 class=\"heading-element\" dir=\"auto\" tabindex=\"-1\">To do:</h2>\n</div>\n<ul dir=\"auto\">\n<li>to make it possible to attach files in a portable way without relying on URLs</li>\n<li>allow different activity models, e.g. R2D2, Lewin, pure ABC, etc</li>\n<li>make multiple select possible to edit multiple activities at once (tricky interface)</li>\n<li>make multi-user</li>\n</ul>\n<div class=\"markdown-heading\" dir=\"auto\">\n<h1 class=\"heading-element\" dir=\"auto\" tabindex=\"-1\">licence: GPL3</h1>\n</div>",
                "devNotes": "",
                "studyHours": 2,
                "unitId": "m1zel0wf2drmh",
                "isAssessed": false,
                "otherActivity": "",
                "learningOutcomes": [
                  0
                ],
                "markingHours": 0
              },
              {
                "id": "m1zfnwvwcsqkv",
                "type": "acquisition",
                "specificActivity": "reading",
                "title": "Using the interface",
                "description": "<p>Everything in Courseomatic relies upon there being a course, so the starting point when faced with a blank course is to click the Edit Course Info button. This presents you with a form. You must fill in fields for the course name, course code, credit hours, and perhaps a couple more. The rest are optional: you can continue to edit it as the course design progresses - nothing is fixed in stone. Note that there are development notes that you can use for anything you need to remember or pass on to other developers, such as needs for copyright clearance, textbooks, web services, and so on. It is also not a bad place to consider things like schedules. You can enter program learning outcomes (by clicking the Add PLO button) and the primary program for which the course is intended. When you add course learning outcomes, you can map them to the PLOs. This is useful information for the design of programs.</p>\n<p>When you have saved it or at any time you can click \"Show Summary Info\" to display what you have entered here, as well as other information about the course that will be populated as you start to design it. It's a really useful button that you might find yourself using quite a lot.</p>\n<p>The next significant piece of Courseomatic is the unit - this may equate to weeks, or modules, or chunks of the course. You can create as many as you like by clicking the New Unit button. This brings up a form with fields for a title and description. Save it, and a new unit panel will appear at the end of the list of units. Clicking the&nbsp;<span class=\"toggle-icon\">▼ or text of the unit panel title will reveal the description and, as you start to add activities, other useful information about the unit. The other buttons include up/down arrows to change the unit order, an edit button, a clone button that duplicates the unit and a delete button that deletes it.<br /></span></p>\n<p><span class=\"toggle-icon\">The main point of the system and the thing for which everything else provides a frame, is the learning activity. Learning activities are represented as cards in unit panels, of different colours depending on the kind of activity. Learning activities may also be assessments, in which case a small red star will appear on the activity card.</span></p>\n<p><span class=\"toggle-icon\">Activities are what students have to do. All have a type (based on an augmented version of the ABC Learning Design activity types) which determines the colour of the card and describes the kind of activity in broad terms as one of acquisition, practice, investigation, reflection, production,&nbsp; &nbsp; discussion, cooperation, or collaboration. For any activity type you can select from a prepopulated list of common activities (reading, writing, lab, etc) or add your own. Activities can be marked as assessed, in which case you gain some fields to describe the assessment marking, estimated marking time, and so on. You are required to enter an estimated study time for the activity. You can identify the course learning outcomes it addresses, and provide information for development such as resources needed, or project management information.</span></p>\n<p><span class=\"toggle-icon\">You can expand each activity box by clicking on it. It should shrink to its usual size when you click on it again, or press the Esc key. Sometimes it doesn't do so right away - that's a bug! I sometimes find it easier to simply click the edit button and read it from there. You can cancel the form by using the cancel button or pressing the Esc key.</span></p>\n<p><span class=\"toggle-icon\">The Reports button offers choices of a full report (all the information you have entered, as well as calculated statistics such as total study hours, unit study hours, relative hours spent doing different kinds of activity, unassessed learning outcomes, and so on) or a syllabus (summary information not including activities or statistics). Note that, for each of these, it both saves a self-contained HTML file to wherever your browser saves its files, and opens a new window or tab with the content displayed. You need to click on the original window or tab, or close the new one, to return to working on the course.<br /></span></p>\n<p><span class=\"toggle-icon\">The save/load button offers choices of exporting to or importing from a JSoN file. Use this to save and load courses. You can share the files with others so that they can edit them, too, but beware that there is no option yet to merge changes so only do this if you are not planning to work on it, at least until they send it back. It is also handy for moving to a different machine or using a different browser on the same machine.</span></p>\n<p><span class=\"toggle-icon\">The Clear button removes all the data and lets you start a fresh course. Note that the system saves a copy as you go every 30 seconds and will automatically reload the previous course you were working on when you refresh the page, until you actually edit the course info, after which the old one will be overwritten. This gives you the potential to undo mistaken clearing of a course: just reload the page straight away if that happens. </span></p>\n<p>When you are ready to play, move on to the next activity</p>",
                "devNotes": "",
                "studyHours": 2,
                "unitId": "m1zel0wf2drmh",
                "isAssessed": false,
                "otherActivity": "",
                "learningOutcomes": [],
                "markingHours": 0
              },
              {
                "id": "m1zjzbzgkia9c",
                "type": "practice",
                "specificActivity": "exercises",
                "title": "Edit the course info",
                "description": "<p>Click Edit Course Info to bring up the course editing form. Make any changes you wish.</p>\n<p>These are the fields:</p>\n<p>Course name (required): the name</p>\n<p>Course code (required): an abbreviation, typically something like COMP650 or BIOL12345, but you can and should provide any short name you like. Do keep it short or it will uglify the main toolbar!</p>\n<p>Course revision: anything you like, typically a number or rev1 or something along those lines.</p>\n<p>Delivery mode: anything you like, typically blended, online, in-person, paced, grouped study, self-paced, or whatever is used in your organization</p>\n<p>Course prerequisites: anything you like. Feel free to use to add precluded courses (type \"Precluded\" if you do that to make it clear what you mean)</p>\n<p>Credit hours (required): whatever you like. \"None\" or 0 is fine.</p>\n<p>Course goal: a short phrase describing the main intent of the course.</p>\n<p>Course Description: typically longer, describing whatever you want to describe about the course. This would typically be the sort of thing that would appear in a syllabus or prospectus, but don't worry about things like course outlines, learning outcomes, or details of assessments (unless you want to, in which case go ahead): such things will be automatically generated by Courseomatic.</p>\n<p>Course Notes: anything you want. Often used to describe special features of the course or unusual resource requirements.</p>\n<p>Development notes: any information needed to support the design, development, and production of the course such as resource needs, timelines, constraints, copyright clearance needs, textbooks, and so on.</p>\n<p>Program name: the name of the program the course is associated with</p>\n<p>Program level: the program's level (eg. graduate, intermediate, undergraduate, introductory)</p>\n<p>Program learning outcomes (PLOs): click the Add Program Learning Outcome button to add one. Add as many as needed. Click the Remove button next to each field to remove it.</p>\n<p>Course learning outcomes (CLOs): click the Add Course Learning outcome to add an outcome. Checkboxes for any PLOs will be shown underneath. Click to select any to which a CLO maps. Click the Remove CLO button associated with a CLO to remove it.</p>\n<p>You can drag CLOs to reorder them using the <span class=\"clo-handle\" style=\"cursor: move; margin-right: 10px;\">⬍ icon.</span></p>",
                "devNotes": "",
                "studyHours": 5,
                "unitId": "m1zel0wf2drmh",
                "isAssessed": false,
                "otherActivity": "",
                "learningOutcomes": [
                  0
                ],
                "markingHours": 0
              },
              {
                "id": "m1zfof4owrq1f",
                "type": "practice",
                "specificActivity": "exercises",
                "title": "Create a new unit",
                "description": "<p>Create a new unit by clicking the New Unit button and entering a title and description.</p>\n<p>When you click Save it, the unit panel should appear at the end of the page. Notice that a link to it appears in the top menu bar: you can click that to go directly to the unit, or simply scroll down to it.</p>\n<p>From there you can drag it further up the list: try it, by dragging its title bar to wherever you want it to be (the top is a good place). You can use the arrow keys towards the far right of the unit panel's title bar instead, if you prefer.</p>\n<p>Click the pen button on the title bar to make changes to the description or title. Try it.</p>\n<p>Click the clone button to make a copy of the unit. It should appear at the end. Use the link in the top menu bar to go there.</p>\n<p>Click the x button to delete your cloned unit. Note that, if it contained any activity cards, these would be deleted too.</p>",
                "devNotes": "",
                "studyHours": 5,
                "unitId": "m1zel0wf2drmh",
                "isAssessed": false,
                "otherActivity": "",
                "learningOutcomes": [
                  0
                ],
                "markingHours": 0
              },
              {
                "id": "m1zk2vwtjftnw",
                "type": "practice",
                "specificActivity": "exercises",
                "title": "Create a couple of activities",
                "description": "<p>In your new unit, click the \"add activity\" button (big + symbol on a green card-sized button) to create an activity card.</p>\n<p>These are the fields:</p>\n<p>Activity type: one of <span class=\"toggle-icon\">acquisition, practice,&nbsp; investigation, reflection, production,&nbsp; &nbsp; discussion, cooperation, or collaboration</span></p>\n<p><span class=\"toggle-icon\">Title: a brief description of the activity</span></p>\n<p><span class=\"toggle-icon\">Description: a description of the activity. You can always go back to edit this (and anything else about the activity) later if you want</span></p>\n<p><span class=\"toggle-icon\">Development notes: anything you like, relating to design, development, and production processes and resourcing.<br /></span></p>\n<p><span class=\"toggle-icon\">Specific activity: a list that changes depending on the activity type selected. Clicking \"other\" will bring up a field to enter your own.</span></p>\n<p><span class=\"toggle-icon\">Estimated study time (required): enter either a number of minutes or hours and minutes in HH:MM format (e.g. 12:00, 1:00). Clicking the help button next to the field brings up a convenient calculator that works out study times for different kinds and quantities of reading or writing, and provides some heuristics to help work out study hours for other common activities. If you use the calculator, when you close the form then the number it has calculated appears in the estimated study time field. You can edit that if you don't think it is accurate.</span></p>\n<p><span class=\"toggle-icon\">Learning outcomes: select any course learning outcomes that this activity addresses</span></p>\n<p><span class=\"toggle-icon\">Assessed: checking this box brings up a checkbox for whether it is a required or optional assessment, the assessment weighting, the pass mark, and estimated marking time. </span></p>",
                "devNotes": "",
                "studyHours": 5,
                "unitId": "m1zel0wf2drmh",
                "isAssessed": false,
                "otherActivity": "",
                "learningOutcomes": [
                  0
                ],
                "markingHours": 0
              },
              {
                "id": "m1zjcki458zqm",
                "type": "practice",
                "specificActivity": "exercises",
                "title": "Reporting",
                "description": "<p>There are two kinds of report that can be generated by Courseomatic, both of which can be accessed from the Reports button:</p>\n<ol>\n<li>a full report</li>\n<li>a syllabus</li>\n</ol>\n<p>The full report collects and displays all of the information gathered by or calculated by Courseomatic. The syllabus only shows course information and unit information, organized roughly as a traditional syllabus might be organized.</p>\n<p>Try it now. Read through the generated reports, noting the kind of information they provide.</p>",
                "devNotes": "",
                "studyHours": 4,
                "unitId": "m1zel0wf2drmh",
                "isAssessed": false,
                "otherActivity": "",
                "learningOutcomes": [
                  0,
                  2
                ],
                "markingHours": 0
              },
              {
                "id": "m1zyfaua14dy9",
                "type": "practice",
                "specificActivity": "exercises",
                "title": "Import/export a course",
                "description": "<p>The save/load button gives choices of exporting to or importing from a JSoN file. Use this to save and load courses. You can share the files with others so that they can edit them, too, but beware that there is no option yet to merge changes so only do this if you are not planning to work on it, at least until they send it back. It is also handy for moving to a different machine or using a different browser on the same machine.</p>\n<p>Click Save/Load then Export to JSoN File. This will be saved wherever your browser saves files.</p>\n<p>Delete one of the units by clicking its X button on its title bar.</p>\n<p>Click Save/Load then Import from JSoN File. Select your previously saved course file. You should see the unit return.</p>",
                "devNotes": "<p>Something in this appears to be messing up placement of the button bar</p>",
                "studyHours": 3,
                "unitId": "m1zel0wf2drmh",
                "isAssessed": true,
                "otherActivity": "",
                "learningOutcomes": [
                  0
                ],
                "markingHours": 1,
                "passMark": "50",
                "weighting": "1"
              },
              {
                "id": "m1zfpfqp032ib",
                "type": "reflection",
                "specificActivity": "journaling",
                "title": "How can you use this?",
                "description": "<p>Edit this activity description (click the little pen icon on the activity card) to describe how you might use this to design a course.</p>\n<p>Save your changes.</p>\n<p>This is a self-assessed activity - I have made it assessed so that you can see how the assessment features work</p>",
                "devNotes": "",
                "studyHours": 5,
                "unitId": "m1zel0wf2drmh",
                "isAssessed": true,
                "otherActivity": "",
                "learningOutcomes": [
                  0,
                  1
                ],
                "markingHours": 5,
                "passMark": "50",
                "weighting": "100"
              },
              {
                "id": "m1zm6reh5hgrj",
                "type": "acquisition",
                "specificActivity": "reading",
                "title": "General approaches to course design",
                "description": "<p>This is a standalone tool that only needs a browser to run, which limits how it can be used collaboratively. My assumption is that it will either be used on a shared computer or, more commonly, the course designer will use it to develop a storyboard alone, then share it with a team, or with the team during a workshop or design session, entering changes as the team decides.</p>\n<p>How you use it is largely up to you. When brainstorming it provides a quick interface for rapidly developing an outline of a course, allowing details to be filled in later. It can alternatively be used methodically, filling in details as you go, or anything in between. Everything is editable - no edits are set in stone.</p>\n<p>The level of detail is up to you, but I recommend avoiding adding a great deal of information or detailed content into these fields. This is not a whole course development tool - it is only meant to generate the <em>design</em> for later implementation in a learning management system or classroom - so it does not provide a good set of tools for what I am doing now, which is actually running a kind of a course in the system itself. I have found it to be handy for collecting notes and pasting in existing content where applicable, but large amounts of content soon become very unwieldy and difficult to read, as well as slowing down the system considerably and making it harder to share or read exported files.</p>\n<p>Useful tips:</p>\n<p>I use the Show Summary Info button a lot. I especially like the breakdown of relative proportions of study time spent on different types of activity, and the total study hours calculation. It's nice to see how the effects of recent changes alter the shape of the course itself.</p>\n<p>The study hours are shown on each unit's title bar because it is really helpful to know how long each unit will take to accomplish. Studies show that it is a good idea to keep the time for each unit consistent each week, when a course follows a weekly schedule. Even for a self-paced course, it is very useful to students to have some estimate of the approximate workload though, obviously, estimated study hours may differ wildly from actual study hours, and are very dependent on the student, their availability, their distractions, their existing capabilities, and so on.</p>\n<p>It can sometimes be difficult to allocate a given activity to one activity type. It's OK if, say, a reading activity also includes the occasional practice exercise but, if a secondary activity type takes up a lot of time then it probably means you should separate it out into a different activity. It's up to you, though: use it in the way that suits your way of working and your approach to design. Courseomatic is very flexible.</p>",
                "devNotes": "",
                "studyHours": 3,
                "unitId": "m1zemv151uigs",
                "isAssessed": false,
                "otherActivity": "",
                "learningOutcomes": [
                  1
                ],
                "markingHours": 0
              },
              {
                "id": "m1ziqjyckvgc1",
                "type": "production",
                "specificActivity": "writing",
                "title": "Clear this course and start your own",
                "description": "<p>If you have followed the rest of this course then you should have a backup of this one which you can always reload using Save/Load button then \"Import from JSoN\".</p>\n<p>If you have added anything you want to keep, it would be a good idea to make another backup now, by clicking the Save/Load button and selecting \"Export to JSoN\"</p>\n<p>When you are ready, click the clear button and start building.</p>\n<p>Good luck, and good designing!</p>\n<p>Jon</p>\n<p>Any questions, suggestions, bug reports, features requests, etc: courseomatic@jondron.org</p>",
                "devNotes": "",
                "studyHours": 1,
                "unitId": "m1zemv151uigs",
                "isAssessed": false,
                "otherActivity": "",
                "learningOutcomes": [
                  0,
                  1
                ],
                "markingHours": 0
              }
            ],
            "mappedPLOs": [
              [],
              [],
              []
            ]
          }
          

        try {
            // Use the embedded data directly
            saveCourse(courseData);
            updateUI();
            alert('Getting Started course opened successfully!');
        } catch (error) {
            console.error('Error importing JSON:', error);
            alert('Error importing the Getting Started course. Sorry - you are on your own!');
        }
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

    // Initialize the application
    document.addEventListener('DOMContentLoaded', () => {
        initializeUI();
        setupEventListeners();
        const savedData = loadFromLocalStorage();
        if (savedData) {
            loadSavedCourse();
            updateUI();
        } else {
            initGettingStarted();
        }
    });

    // Autosave functionality
    setInterval(() => {
        saveToLocalStorage();
    }, 30000); // Autosave every 30 seconds

})();
