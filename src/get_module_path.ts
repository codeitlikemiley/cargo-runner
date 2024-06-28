import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';
import isInsideModTests from './is_inside_mod_test';

interface Module {
    name: string;
    path: string;
    fullPath: string;
}

function getProjectModules(filePath: string): string[] {
    // Get the workspace root directory
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders) {
        throw new Error('No workspace folders found.');
    }

    const rootDir = workspaceFolders[0].uri.fsPath;
    const srcDir = path.join(rootDir, 'src');
    const moduleFiles = ['lib.rs', 'main.rs'];
    let rootModuleFile: string | undefined;

    console.log(`Root Directory: ${rootDir}`);
    console.log(`Source Directory: ${srcDir}`);

    // Check if lib.rs or main.rs exists
    for (const file of moduleFiles) {
        const moduleFilePath = path.join(srcDir, file);
        console.log(`Checking for: ${moduleFilePath}`);
        if (fs.existsSync(moduleFilePath)) {
            rootModuleFile = moduleFilePath;
            break;
        }
    }

    if (!rootModuleFile) {
        throw new Error('Neither lib.rs nor main.rs found in src directory.');
    }

    console.log(`Root Module File: ${rootModuleFile}`);

    const moduleQueue: Module[] = [];
    const modulePaths: string[] = [];

    // Function to parse a Rust file for modules
    const parseFileForModules = (filePath: string, currentPath: string) => {
        const fileContent = fs.readFileSync(filePath, 'utf-8');
        const modulePattern = /pub\s+mod\s+(\w+);|mod\s+(\w+);/g;
        let match;
        while ((match = modulePattern.exec(fileContent)) !== null) {
            const moduleName = match[1] || match[2];
            const fullPath = currentPath ? `${currentPath}::${moduleName}` : moduleName;
            moduleQueue.push({ name: moduleName, path: path.join(path.dirname(filePath), moduleName), fullPath });
        }

        // Handle nested modules within the same file
        const nestedModulePattern = /mod\s+(\w+)\s*{([^}]*)}/g;
        while ((match = nestedModulePattern.exec(fileContent)) !== null) {
            const moduleName = match[1];
            const nestedContent = match[2];
            const nestedFullPath = currentPath ? `${currentPath}::${moduleName}` : moduleName;
            modulePaths.push(nestedFullPath);
            parseNestedModules(nestedContent, nestedFullPath);
        }
    };

    // Function to parse nested modules within a string content
    const parseNestedModules = (content: string, currentPath: string) => {
        const nestedModulePattern = /mod\s+(\w+)\s*{([^}]*)}/g;
        let match;
        while ((match = nestedModulePattern.exec(content)) !== null) {
            const moduleName = match[1];
            const nestedContent = match[2];
            const nestedFullPath = `${currentPath}::${moduleName}`;
            modulePaths.push(nestedFullPath);
            parseNestedModules(nestedContent, nestedFullPath);
        }
    };

    // Start with the root module file
    parseFileForModules(rootModuleFile, '');

    // Process modules iteratively
    while (moduleQueue.length > 0) {
        const currentModule = moduleQueue.shift();
        if (currentModule) {
            const moduleFilePath = path.join(currentModule.path, 'mod.rs');
            console.log(`Checking for module file: ${moduleFilePath}`);
            if (fs.existsSync(moduleFilePath)) {
                parseFileForModules(moduleFilePath, currentModule.fullPath);
            } else {
                const moduleRsFilePath = `${currentModule.path}.rs`;
                console.log(`Checking for module file: ${moduleRsFilePath}`);
                if (fs.existsSync(moduleRsFilePath)) {
                    parseFileForModules(moduleRsFilePath, currentModule.fullPath);
                }
            }
            // Add full module path
            modulePaths.push(currentModule.fullPath);
        }
    }
    console.log(`Module Paths: ${modulePaths}`);

    return modulePaths;
}

// Function to match the file path with the module paths
function findModuleName(filePath: string, modules: string[], insideModTest: boolean): string | undefined {
    const rootDir = vscode.workspace.workspaceFolders![0].uri.fsPath + '/src';
    console.log(`Root Directory: ${rootDir}`);
    // Replace '/' with '::', remove '.rs' extension, and handle 'mod.rs' files
    let modulePath = filePath.replace(rootDir, '').replace(/^\//, '').replace(/\//g, '::').replace('.rs', '');
    // If the path ends with '::mod', remove this part to correctly identify the module
    modulePath = modulePath.replace(/::mod$/, '');
    console.log(`Module Path: ${modulePath}`);
    // Remove leading '::' if present, then append '::tests' if insideModTest is true
    const moduleName = insideModTest ? `${modulePath.replace(/^::/, '')}::tests` : modulePath.replace(/^::/, '');
    console.log(`Module Name: ${moduleName}`);
    const matchedModule = modules.find((module) => module === moduleName);

    return matchedModule;
}

export {
    getProjectModules,
    findModuleName,
};