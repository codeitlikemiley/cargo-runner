import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

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

export { findCargoToml };