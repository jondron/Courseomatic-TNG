// courseModule.js
import { addTimes, formatTimeForDisplay, timeToMinutes, minutesToTime } from './timeUtils.js';

// Define the initial state of the course data
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
        goal: '',
        description: '',
        productionNotes: '',
        learningOutcomes: [] // Array of CLOs
    },
    mappedOutcomes: [], // Array where each index represents the mapping of a CLO to a PLO (or none)
    units: [],
    activities: []
};

// Course Data Management Functions
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
            goal: '',
            description: '',
            productionNotes: '',
            learningOutcomes: [] 
        },
        mappedOutcomes: [], 
        units: [],
        activities: []
    };
}

function getCourseData() {
    return courseData;
}

function setCourseData(newData) {
    courseData = newData;
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
                mappedPLOs: parsedData.mappedPLOs || [],
                mappedOutcomes: parsedData.mappedOutcomes || []
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

// Program Learning Outcomes Functions
function addProgramLearningOutcome(outcome) {
    courseData.program.learningOutcomes.push(outcome);
}

function updateProgramLearningOutcome(index, outcome) {
    courseData.program.learningOutcomes[index] = outcome;
}

function deleteProgramLearningOutcome(index) {
    courseData.program.learningOutcomes.splice(index, 1);
}

// Course Learning Outcomes Functions
function addCourseLearningOutcome(outcome) {
    courseData.course.learningOutcomes.push(outcome);
}

function updateCourseLearningOutcome(index, outcome) {
    courseData.course.learningOutcomes[index] = outcome;
}

function deleteCourseLearningOutcome(index) {
    courseData.course.learningOutcomes.splice(index, 1);
}

function mapCLOtoPLO(cloIndex, ploIndices) {
    if (!courseData.course.learningOutcomes[cloIndex].mappedPLOs) {
        courseData.course.learningOutcomes[cloIndex].mappedPLOs = [];
    }
    courseData.course.learningOutcomes[cloIndex].mappedPLOs = ploIndices;
}

// Analysis Functions


function getActivityTypeProportions() {
    if (courseData.activities.length === 0) {
        return [];
    }

    let totalHours = 0;

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

// Validation Function
function validateCourseData() {
    const errors = [];

    if (!courseData.course.name) errors.push("Course name is required");
    if (!courseData.course.code) errors.push("Course code is required");
    if (!courseData.course.creditHours) errors.push("Credit hours are required");
    if (courseData.course.learningOutcomes.length === 0) errors.push("At least one course learning outcome is required");
    if (courseData.units.length === 0) errors.push("At least one unit is required");
    if (courseData.activities.length === 0) errors.push("At least one activity is required");

    return errors;
}

// Report Generation Function
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
        mappedOutcomes: courseData.mappedOutcomes
    };
}



//handle marking and study hours
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

function updateUnitHours() {
    courseData.units.forEach(unit => {
        const unitActivities = courseData.activities.filter(activity => activity.unitId === unit.id);
        let totalStudyMinutes = 0;
        let totalMarkingMinutes = 0;

        unitActivities.forEach(activity => {
            totalStudyMinutes += timeToMinutes(activity.studyHours);
            if (activity.isAssessed) {
                totalMarkingMinutes += timeToMinutes(activity.markingHours);
            }
        });

        unit.totalStudyHours = formatTimeForDisplay(totalStudyMinutes);
        unit.totalMarkingHours = formatTimeForDisplay(totalMarkingMinutes);

      //  //(`Unit ${unit.id} hours updated: Study ${unit.totalStudyHours}, Marking ${unit.totalMarkingHours}`);
    });
}

// Call this function whenever activities are added, edited, or removed
function recalculateHours() {
    updateUnitHours();
}

// add unit
function addUnit(unitData) {
    const newUnit = {
        id: generateUniqueId(),
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

function generateUniqueId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

// Export all functions
export {
    initializeCourse,
    getCourseData,
    setCourseData,
    saveCourse,
    loadSavedCourse,
    clearCourse,
    addProgramLearningOutcome,
    updateProgramLearningOutcome,
    deleteProgramLearningOutcome,
    addCourseLearningOutcome,
    updateCourseLearningOutcome,
    deleteCourseLearningOutcome,
    mapCLOtoPLO,
    getTotalStudyHours,
    getTotalMarkingHours,
    getActivityTypeProportions,
    getUnassessedLearningOutcomes,
    validateCourseData,
    generateCourseReport,
    getUnitMarkingHours,
    getUnitStudyHours,
    updateUnitHours,
    recalculateHours,
    addUnit
};