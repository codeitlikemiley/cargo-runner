// Import the fs and child_process modules
import fs from 'fs';

// Define a function that takes a file path as an argument and returns a boolean
function isRustScript(filePath: string): boolean {
    // Create a regex pattern that matches the hashbang
    let pattern = /^#!\s*\/usr\/bin\/env\s+-S\s+cargo\s+\+nightly\s+-Zscript\s*$/;
    // Open the file and read the first line
    let file = fs.readFileSync(filePath, 'utf8');
    let firstLine = file.split('\n')[0];
    // Check if the first line matches the pattern
    return pattern.test(firstLine);
}

// Define a function that takes a file path as an argument and runs it as a rust script
function runRustScript(filePath: string): string | null{
    // Check if the file is a rust script
    if (isRustScript(filePath)) {
        // Check if the file is executable
        let mode = fs.statSync(filePath).mode;
        let isExecutable = (mode & 0o100) !== 0o0; // Fix: Convert mode to number and check for equality with 0o0
        // If not, change the permission to executable
        if (!isExecutable) {
            fs.chmodSync(filePath, mode | 0o100);
        }
        // Return the command to run the file
        return filePath;
    } else {
        // If not, print an error message
        console.log('The file is not a rust script.');
        // Return null or undefined
        return null;
    }
}
export { isRustScript, runRustScript };