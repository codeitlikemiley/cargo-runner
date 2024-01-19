import { parse, JsonMap } from '@iarna/toml';
import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';
import { getPackage } from './get_package';

interface CargoToml {
    bin?: Array<{
        name: string;
        path: string;
    }>;
}

async function getBin(filePath: string): Promise<string | null> {

    const fileContent = fs.readFileSync(filePath, 'utf-8');
    // file might be a binary if it has a main function
    const mainFunctionRegex = /async\s+fn\s+main\s*\(\s*\)|fn\s+main\s*\(\s*\)/;
    if (!mainFunctionRegex.test(fileContent)) {
        console.log('No valid main function found in the file');
        return null;
    }
    // The main.rs file is always a binary
    if (filePath.endsWith('main.rs')) {
        return getPackage(filePath);
    }

    // Resolve the full path of the file
    const normalizedFilePath = path.resolve(filePath);
    console.log(`Normalized file path: ${normalizedFilePath}`);

    let currentDir = path.dirname(normalizedFilePath);

    // If the file is in the bin directory, use the file name as the bin name
    if (path.basename(currentDir) === 'bin') {
        return path.basename(filePath, '.rs');
    }

    const workspaceRoot = vscode.workspace.rootPath || process.cwd();

    // If Our Special Case like main.rs and bin folder is not the case then we need to find the bin name from Cargo.toml
    // Find Cargo.toml by navigating up the directory tree

    let cargoTomlPath = path.join(currentDir, 'Cargo.toml');

    while (!fs.existsSync(cargoTomlPath)) {
        if (currentDir === workspaceRoot) {
            // Reached the workspace root and Cargo.toml is not found
            console.log('Cargo.toml not found in the workspace root');
            return null;
        }

        // Navigate up
        currentDir = path.dirname(currentDir);
        cargoTomlPath = path.join(currentDir, 'Cargo.toml');
    }

    // At this point, cargoTomlPath is the path to the found Cargo.toml file
    // Read and parse Cargo.toml
    console.log(`Reading Cargo.toml from: ${cargoTomlPath}`);
    const cargoTomlContent = fs.readFileSync(cargoTomlPath, 'utf-8');
    const parsedToml: CargoToml = parse(cargoTomlContent) as JsonMap;

    if (!parsedToml.bin) {
        console.log('No bin section found in Cargo.toml');
        return null;
    }

    // Loop through each bin entry
    for (const bin of parsedToml.bin) {
        const binFilePath = path.resolve(currentDir, bin.path);
        console.log(`Checking bin path: ${binFilePath}`);

        if (binFilePath === normalizedFilePath) {
            console.log(`Matching binary found: ${bin.name}`);
            return bin.name;
        }
    }

    console.log('No matching bin entry found');
    return null;
}

export { getBin };
