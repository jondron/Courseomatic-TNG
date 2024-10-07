import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';

export default {
    input: 'script.js', // Entry point of your application
    output: {
        file: 'bundle.js', // Output bundled file
        format: 'iife', // Immediately Invoked Function Expression (suitable for browsers)
        name: 'CourseomaticApp' // Global variable name for your application
    },
    plugins: [
        resolve(), // Resolves node modules
        commonjs(), // Converts CommonJS modules to ES6
    ]
};
