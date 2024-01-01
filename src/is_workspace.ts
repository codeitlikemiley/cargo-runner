import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

async function isWorkspace(): Promise<boolean> {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders) {
        return false;
    }

    const workspaceRoot = workspaceFolders[0].uri.fsPath;
    const cargoTomlPath = path.join(workspaceRoot, 'Cargo.toml');

    try {
        const cargoTomlContent = fs.readFileSync(cargoTomlPath, 'utf8');
        return cargoTomlContent.includes('[workspace]');
    } catch (err) {
        return false;
    }
}

export { isWorkspace };