import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

async function checkCrateType(filePath: string): Promise<string | null> {
    if (filePath.endsWith('/main.rs')) {
        return 'bin';
    } else if (filePath.endsWith('/lib.rs')) {
        return 'lib';
    } else if (filePath.endsWith('/build.rs')) {
        return 'build';
    }

    let currentPath = path.dirname(filePath);
    while (currentPath !== vscode.workspace.rootPath) {
        const cargoTomlPath = path.join(currentPath, 'Cargo.toml');
        if (fs.existsSync(cargoTomlPath)) {
            const cargoTomlContent = fs.readFileSync(cargoTomlPath, 'utf8');
            const hasBin = cargoTomlContent.includes('[[bin]]');
            const hasLib = cargoTomlContent.includes('[[lib]]');
            if (hasBin) {
                return 'bin';
            } else if (hasLib) {
                return 'lib';
            }
            break;
        }
        currentPath = path.dirname(currentPath);
    }
    return null;
}
