// activityModule.js

import { getCourseData, saveCourse } from './courseModule.js';
import { timeToMinutes } from './timeUtils.js';

const activityTypes = {
    acquisition: ["reading", "watching video", "listening to audio", "attending lecture", "other"],
    practice: ["exercises", "tests & quizzes", "exam", "drills", "games", "simulations & role plays", "other"],
    investigation: ["research project", "web search", "fieldwork", "case study", 
                "problem-based learning", "inquiry-based learning", "data analysis", "experiment", "lab","other"],
    reflection: ["journaling", "discussion", "portfolio", "exit takeaway", "reflective essay", "feedback", "survey", "exam","other"],
    production: ["writing", "presentation", "drawing", "experiment", "coding", "configuration", "prototyping", "model design",
                "concept map", "portfolio", "project", "exam","other"],
    discussion: ["discussion", "debate", "think-pair-share", "socratic seminar", "peer feedback", "commentary", "other"],
    cooperation: ["social bookmarking", "blog", "wiki", "scheduling", "image sharing", "podcast", "demo", "document sharing", "other"],
    collaboration: ["group project", "study group", "discussion", "conference", "wiki", "peer review", "brainstorming", "role playing","seminar", "other"]
};

export function getActivityTypes() {
    return Object.keys(activityTypes);
}

export function getSpecificActivities(type) {
    return activityTypes[type] || [];
}


export function createActivity(activityData) {
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

export function editActivity(activityId, updatedData) {
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

export function deleteActivity(activityId) {
    const courseData = getCourseData();
    const activityIndex = courseData.activities.findIndex(activity => activity.id === activityId);
    if (activityIndex !== -1) {
        courseData.activities.splice(activityIndex, 1);
        return true;
    }
    return false;
}

export function cloneActivity(activityId) {
    const courseData = getCourseData();
    const activity = courseData.activities.find(activity => activity.id === activityId);
    if (activity) {
        const clonedActivity = {
            ...activity,
            id: generateUniqueId(),
            title: `${activity.title} (Clone)`
        };
        courseData.activities.push(clonedActivity);
        return clonedActivity;
    }
    return null;
}
/*
export function moveActivity(activityId, newUnitId) {
    const courseData = getCourseData();
    const activityIndex = courseData.activities.findIndex(activity => activity.id === activityId);
    if (activityIndex !== -1) {
        courseData.activities[activityIndex].unitId = newUnitId;
        return true;
    }
    return false;
}
*/
export function getActivitiesByUnit(unitId) {
    const courseData = getCourseData();
    return courseData.activities.filter(activity => activity.unitId === unitId);
}

export function getActivityById(activityId) {
    const courseData = getCourseData();
    return courseData.activities.find(activity => activity.id === activityId);
}

function generateUniqueId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

// function convertToHoursMinutes(timeString) {
//     if (!timeString) return '00:00';
    
//     if (timeString.includes(':')) {
//         return timeString; // Already in HH:MM format
//     }
    
//     const minutes = parseInt(timeString, 10);
//     if (isNaN(minutes)) return '00:00';
    
//     const hours = Math.floor(minutes / 60);
//     const remainingMinutes = minutes % 60;
//     return `${hours.toString().padStart(2, '0')}:${remainingMinutes.toString().padStart(2, '0')}`;
// }

export function validateActivity(activityData) {
    const errors = [];

    if (!activityData.type) errors.push("Activity type is required");
    if (!activityData.title) errors.push("Activity title is required");
    if (!activityData.specificActivity) errors.push("Specific activity is required");
    if (!activityData.studyHours) errors.push("Study hours are required");
    if (!activityData.unitId) errors.push("Unit assignment is required");

    if (activityData.isAssessed) {
        if (!activityData.passMark) errors.push("Pass mark is required for assessed activities");
        if (!activityData.weighting) errors.push("Weighting is required for assessed activities");
        if (!activityData.markingHours) errors.push("Marking hours are required for assessed activities");
    }

    return errors;
}

export function addCustomActivityType(type, specificActivity) {
    if (!activityTypes[type]) {
        console.warn(`Activity type "${type}" not found. Adding it as a new type.`);
        activityTypes[type] = [];
    }
    if (!activityTypes[type].includes(specificActivity)) {
        activityTypes[type].push(specificActivity);
    }
}