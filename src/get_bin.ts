import { parse } from '@iarna/toml';
import * as fs from 'fs';
import * as path from 'path';
import { getPackage } from './get_package';
import * as vscode from 'vscode';

async function getBin(filePath: string): Promise<string | null> {
    // If the file is main.rs, use your getPackage function
    if (filePath.endsWith('main.rs')) {
        return getPackage(filePath);
    }

    // Check if the file contains a main function
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    if (!fileContent.includes('fn main()')) {
        return null;
    }

    // Find Cargo.toml
    let currentDir = path.dirname(filePath);
    const workspaceRoot = vscode.workspace.rootPath; // Get the workspace root path
    
    // special case when our file is in the bin directory
    if (path.basename(currentDir) === 'bin') {
        return path.basename(filePath, '.rs');
    }


    while (!fs.existsSync(path.join(currentDir, 'Cargo.toml'))) {
        if (currentDir === workspaceRoot) {
            return null; // Reached the workspace root
        }
        currentDir = path.dirname(currentDir);
    }

    // Parse Cargo.toml
    const cargoTomlPath = path.join(currentDir, 'Cargo.toml');
    const cargoTomlContent = fs.readFileSync(cargoTomlPath, 'utf-8');
    const parsedToml = parse(cargoTomlContent) as { bin: { path: string, name: string }[] };

    // Look for the matching [[bin]] entry
    if (Array.isArray(parsedToml.bin)) {
        for (const bin of parsedToml.bin) {
            const binFilePath = path.join(currentDir, bin.path);
            if (binFilePath === filePath) {
                return bin.name;
            }
        }
    }

    return null;
}

export { getBin };