import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';
import { findCargoToml } from './find_cargo_toml';

interface Module {
    name: string;
    path: string;
    fullPath: string;
}

function getModules(filePath: string, insideModTest: boolean): string[] | undefined {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        vscode.window.showErrorMessage('No active editor found.');
        return [];
    }
    let cargoTomlPath = findCargoToml(editor.document.uri.fsPath) ?? editor.document.uri.fsPath;

    const rootDir = path.dirname(cargoTomlPath);

    // Check if the file is in the examples directory , we short circuit the process
    if (filePath.includes(path.join(rootDir, 'examples'))) {
        return insideModTest ? ["tests"] : [];
    }
    const srcDir = path.join(rootDir, 'src');
    const moduleFiles = ['lib.rs', 'main.rs'];
    let rootModuleFile: string | undefined;

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

export default getModules;