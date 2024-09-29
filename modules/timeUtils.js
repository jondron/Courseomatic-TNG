// timeUtils.js

// Convert any time input to minutes
export function timeToMinutes(timeInput) {
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

// Convert minutes to HH:MM
export function minutesToTime(minutes) {
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

// Format time for display (always in HH:MM)
export function formatTimeForDisplay(time) {
    const minutes = timeToMinutes(time);
    return minutesToTime(minutes);
}

// Add two times (in either format)
export function addTimes(time1, time2) {
    const minutes1 = timeToMinutes(time1);
    const minutes2 = timeToMinutes(time2);
    return minutes1 + minutes2;
}

// Subtract two times (in either format)
export function subtractTimes(time1, time2) {
    const minutes1 = timeToMinutes(time1);
    const minutes2 = timeToMinutes(time2);
    return Math.max(0, minutes1 - minutes2); // Ensure non-negative result
}