import { parse, JsonMap } from '@iarna/toml';
import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';
import { getPackage } from './get_package';
import { findCargoToml } from './find_cargo_toml';

interface CargoToml {
    bin?: Array<{
        name: string;
        path: string;
    }>;
}

async function getBin(filePath: string): Promise<string | null> {
    console.log('get_bin - Preparing to get bin name');

    // The main.rs file is always a binary
    if (filePath.endsWith('main.rs')) {
        console.log('get_bin - main.rs is always a binary');
        if (await hasMainFunction(filePath)) {
            return getPackage(filePath);
        }
    }

    // Resolve the full path of the file
    const normalizedFilePath = path.resolve(filePath);
    console.log(`get_bin - Normalized file path: ${normalizedFilePath}`);

    let currentDir = path.dirname(normalizedFilePath);

    console.log(`get_bin - Current directory: ${currentDir}`);

    // If the file is in the bin directory, use the file name as the bin name
    if (path.basename(currentDir) === 'bin') {
        console.log('get_bin - file is in bin directory , defaulting to file name as bin name');
        return path.basename(filePath, '.rs');
    }

    const workspaceRoot = vscode.workspace.rootPath || process.cwd();

    // If Our Special Case like main.rs and bin folder is not the case then we need to find the bin name from Cargo.toml
    // Find Cargo.toml by navigating up the directory tree

    let cargoTomlPath = findCargoToml(filePath);

    if (!cargoTomlPath) {
        console.log('get_bin - Cargo.toml not found in the workspace root');
        return null;
    }

    console.log(`Reading Cargo.toml from: ${cargoTomlPath}`);
    // At this point, cargoTomlPath is the path to the found Cargo.toml file
    // Read and parse Cargo.toml
    const cargoTomlContent = fs.readFileSync(cargoTomlPath, 'utf-8');
    const cargoTomlData = parse(cargoTomlContent) as CargoToml;

    if (!cargoTomlData || !cargoTomlData.bin) {
        console.log('get_bin - No valid bin entry found in Cargo.toml');
        return null;
    }

    if (cargoTomlData.bin !== undefined && cargoTomlData.bin.length > 0) {
        for (const entry of cargoTomlData.bin) {
            const entryPath = path.resolve(entry.path);
            let entryDir = path.dirname(entryPath);

            console.log(`get_bin - Checking if ${filePath} includes ${entryDir}`);

            if (normalizedFilePath.includes(entryDir)) {
                console.log(`get_bin - Found matching bin entry: ${entry.name}`);
                return entry.name;
            }
        }
    }

    console.log('get_bin - No matching bin entry found');
    return null;
}

async function hasMainFunction(filePath: string): Promise<boolean> {
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    // console.log(`get_bin - File content: ${fileContent}`);
    // file might be a binary if it has a main function
    const mainFunctionRegex = /async\s+fn\s+main\s*\(\s*\)|fn\s+main\s*\(\s*\)/;
    if (!mainFunctionRegex.test(fileContent)) {
        console.log('get_bin - No valid main function found in the file');
        return true;
    }
    return false;
}

export { getBin };
