// unitModule.js

import { getCourseData, saveCourse } from './courseModule.js';
import { getActivitiesByUnit } from './activityModule.js';
import { addUnit } from './courseModule.js';

export function createUnit(unitData) {
    if (!unitData || !unitData.title) {
        console.error('Attempted to create unit with invalid data:', unitData);
        return null;
    }
    return addUnit(unitData);
}


function handleNewUnitClick(event) {
    event.preventDefault(); // Prevent any default button behavior
    const unitForm = document.getElementById('unitForm');
    unitForm.reset();
    delete unitForm.dataset.unitId;
    document.getElementById('unitPopup').style.display = 'block';
}

export function editUnit(unitId, updatedData) {
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

export function deleteUnit(unitId) {
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

export function cloneUnit(unitId) {
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

export function reorderUnit(unitId, newOrder) {
    const courseData = getCourseData();
    const unitIndex = courseData.units.findIndex(unit => unit.id === unitId);
    if (unitIndex !== -1 && newOrder >= 0 && newOrder < courseData.units.length) {
        const [movedUnit] = courseData.units.splice(unitIndex, 1);
        courseData.units.splice(newOrder, 0, movedUnit);
        
        // Update the order of all units
        courseData.units.forEach((unit, index) => {
            unit.order = index;
        });
        
        return true;
    }
    return false;
}

export function getUnitById(unitId) {
    const courseData = getCourseData();
    return courseData.units.find(unit => unit.id === unitId);
}

export function getAllUnits() {
    const courseData = getCourseData();
    return courseData.units;
}

export function getUnitSummary(unitId) {
    const unit = getUnitById(unitId);
    if (!unit) return null;

    const activities = getActivitiesByUnit(unitId);
    const totalStudyHours = activities.reduce((sum, activity) => sum + parseFloat(activity.studyHours), 0);
    const totalMarkingHours = activities
        .filter(activity => activity.isAssessed)
        .reduce((sum, activity) => sum + parseFloat(activity.markingHours || 0), 0);

    const learningOutcomes = [...new Set(activities.flatMap(activity => activity.learningOutcomes))];

    return {
        ...unit,
        totalStudyHours,
        totalMarkingHours,
        activityCount: activities.length,
        learningOutcomes
    };
}

function generateUniqueId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

export function validateUnit(unitData) {
    const errors = [];

    if (!unitData.title) errors.push("Unit title is required");
    if (!unitData.description) errors.push("Unit description is required");

    return errors;
}

export function getNextUnitOrder() {
    const courseData = getCourseData();
    return courseData.units.length;
}