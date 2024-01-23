import { parse, JsonMap } from '@iarna/toml';
import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';
import { getPackage } from './get_package';
import { findCargoToml } from './find_cargo_toml';
import CargoToml from './cargo_toml_type';

async function getBin(filePath: string): Promise<string | null> {
   
    if (filePath.endsWith('main.rs')) {
        console.log('get_bin - main.rs is always a binary');
        return getPackage(filePath);
    }

    const normalizedFilePath = path.resolve(filePath);
    console.log(`get_bin - Normalized file path: ${normalizedFilePath}`);

    let currentDir = path.dirname(normalizedFilePath);

    console.log(`get_bin - Current directory: ${currentDir}`);

    if (path.basename(currentDir) === 'bin') {
        console.log('get_bin - file is in bin directory , defaulting to file name as bin name');
        return path.basename(filePath, '.rs');
    }

    let cargoTomlPath = findCargoToml(filePath);

    if (!cargoTomlPath) {
        console.log('get_bin - Cargo.toml not found in the workspace root');
        return null;
    }

    console.log(`Reading Cargo.toml from: ${cargoTomlPath}`);

    const cargoTomlContent = fs.readFileSync(cargoTomlPath, 'utf-8');
    const cargo = parse(cargoTomlContent) as CargoToml;

    if (cargo.bin !== undefined && cargo.bin.length > 0) {
        for (const entry of cargo.bin) {
            const entryPath = path.resolve(entry.path);
            let entryDir = path.dirname(entryPath);

            console.log(`get_bin - Checking if ${filePath} includes ${entryDir}`);

            if (normalizedFilePath.includes(entryDir)) {
                console.log(`get_bin - Found matching bin entry: ${entry.name}`);
                return  entry.name;
            }
        }
    } 
    // we should check the crateType before using binName
    // if our crateType is lib then we dont need to use this package name as bin Name
    return cargo.package?.name || null;
}

export { getBin, CargoToml };
