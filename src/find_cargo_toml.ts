import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { getFilePath } from './editor';
import { log } from './logger';

function findCargoToml(): string | null {
    let filePath = getFilePath();
    
    let currentDir = fs.lstatSync(filePath).isDirectory() ? filePath : path.dirname(filePath);
    const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || process.cwd();
    
    let cargoTomlPath = path.join(currentDir, 'Cargo.toml');
    
    while (!fs.existsSync(cargoTomlPath)) {
        if (currentDir === workspaceRoot || currentDir === process.cwd()) {
            return null;
        }
        currentDir = path.dirname(currentDir);
        cargoTomlPath = path.join(currentDir, 'Cargo.toml');
    }
    return cargoTomlPath;
}

export { findCargoToml };