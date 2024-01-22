import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { parse } from '@iarna/toml';

interface CargoToml {
    bin?: Array<{
        name: string;
        path: string;
    }>;
    lib?: {
        name?: string;
        path?: string;
    };
}

async function checkCrateType(filePath: string): Promise<string | null> {
    const parentDir = path.dirname(filePath);
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const mainFunctionRegex = /async\s+fn\s+main\s*\(\s*\)|fn\s+main\s*\(\s*\)/;
    // if the file is in bin directory and has main function or the file is main.rs and has main function then it is a binary
    if ((path.basename(parentDir) === 'bin' && mainFunctionRegex.test(fileContent)) || (path.basename(filePath) === 'main.rs' && mainFunctionRegex.test(fileContent))) {
        return 'bin';
    }

    // Check if the file is a lib.rs file
    if (path.basename(filePath) === 'lib.rs') {
        return 'lib';
    }
    // if we cannot quicly determine the crate type then we need to find it from Cargo.toml

    const cargoTomlPath = findCargoToml(filePath);

    if (!cargoTomlPath) {
        console.log('Cargo.toml not found in the workspace root');
        return null;
    }

    // At this point, cargoTomlPath is the path to the found Cargo.toml file
    // Read and parse Cargo.toml
    console.log(`Reading Cargo.toml from: ${cargoTomlPath}`);
    const cargoTomlContent = fs.readFileSync(cargoTomlPath, 'utf-8');
    const cargoTomlData = parse(cargoTomlContent) as CargoToml;
    
    if (!cargoTomlData) {
        return null;
    }

    // Check if we have [[bin]] in Cargo.toml
    if (cargoTomlData.bin) {
        const directBinMatch = cargoTomlData.bin.find(bin => bin.path && filePath.endsWith(bin.path));
        if (directBinMatch) {
            return 'bin';
        }

        // Check if part of any binary crate
        for (const bin of cargoTomlData.bin) {
            if (bin.path && isFilePartOfBinaryCrate(filePath, parentDir, bin)) {
                return 'bin';
            }
        }
    }
    // check if we have [[lib]] in Cargo.toml
    if (cargoTomlData.lib) {
        return 'lib';
    }

    // if we cannot find both [[bin]] and [[lib]], find main.rs or lib.rs in the parent directory
    return findMainOrLib(parentDir);
}

function isFilePartOfBinaryCrate(filePath: string, parentDir: string, bin: { name: string; path: string; }) {
    const binPath = path.join(parentDir, bin.path);
    const binDir = path.dirname(binPath);
    return filePath.startsWith(binDir);
}

function findCargoToml(filePath: string) {
    let currentDir = path.dirname(filePath);
    const workspaceRoot = vscode.workspace.rootPath || process.cwd();
    let cargoTomlPath = path.join(currentDir, 'Cargo.toml');
    while (!fs.existsSync(cargoTomlPath)) {
        if (currentDir === workspaceRoot) {
            return null;
        }
        currentDir = path.dirname(currentDir);
        cargoTomlPath = path.join(currentDir, 'Cargo.toml');
    }
    return cargoTomlPath;
}

function findMainOrLib(parentDir: string): string | null {
    // Find main.rs or lib.rs in the parent directory or its subdirectories
    const mainFile = findFileInHierarchy(parentDir, 'main.rs');
    const libFile = findFileInHierarchy(parentDir, 'lib.rs');

    if (mainFile) {
        return 'bin';
    } else if (libFile) {
        return 'lib';
    } else {
        return null;
    }
}

function findFileInHierarchy(directory: string, fileName: string): string | null {
    const filePath = path.join(directory, fileName);
    if (fs.existsSync(filePath)) {
        return filePath;
    }

    // Recursively check parent directories
    const parentDir = path.dirname(directory);
    if (parentDir !== directory) {
        return findFileInHierarchy(parentDir, fileName);
    }

    return null;
}

export { checkCrateType };