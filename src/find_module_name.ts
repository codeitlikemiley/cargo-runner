import path from 'path';
import * as vscode from 'vscode';

function findModuleName(filePath: string, insideModTest: boolean): string | undefined {
    const editor = vscode.window.activeTextEditor;

    if (!editor) {
        vscode.window.showErrorMessage('No active editor found.');
        return undefined;
    }

    let modulePath = filePath.replace(new RegExp(`^.*\/(?:src|examples|bin)\/`), '')
        .replace(/\//g, ' ')
        .trim()
        .replace(/\s+/g, '::')
        .replace('.rs', '');

    modulePath = modulePath.replace(/::mod$/, '');

    // Get the parent directory of the file
    const parentDir = path.basename(path.dirname(filePath));

    // Check if the parent directory is 'bin'
    if (parentDir === 'bin') {
        modulePath = '';
    } 

    // if we are on lib.rs or main.rs we need to remove the module path
    if (modulePath === 'lib' || modulePath === 'main') {
        modulePath = '';
    }

    // Ensure modulePath does not start with '::'
    modulePath = modulePath.replace(/^::/, '');

    // Construct moduleName, append 'tests' without leading '::' if insideModTest is true
    // if we are inside examples we need to return the module name
    let moduleName = '';
    if (filePath.includes('examples')) {
        return insideModTest ? 'tests' : moduleName;
    }
    moduleName = insideModTest ? (modulePath ? `${modulePath}::tests` : "tests") : modulePath;
    console.log(`----- Module Name: ${moduleName}`);

    return moduleName;
}


export default findModuleName;