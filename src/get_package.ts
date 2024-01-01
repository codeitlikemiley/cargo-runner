import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

async function getPackage(filePath: string): Promise<string | null> {
    let currentPath = filePath;
    
    while (currentPath !== vscode.workspace.rootPath) {
        const cargoTomlPath = path.join(currentPath, 'Cargo.toml');
        if (fs.existsSync(cargoTomlPath)) {
            const cargoTomlContent = fs.readFileSync(cargoTomlPath, 'utf8');
            const match = cargoTomlContent.match(/^\[package\][\s\S]*?^name\s*=\s*"([^"]+)"/m);
            if (match) {
                return match[1];
            }
            break;
        }

        currentPath = path.dirname(currentPath);
    }
    
    return null;
}
export { getPackage };