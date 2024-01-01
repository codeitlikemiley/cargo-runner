import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { getPackage } from './get_package';

async function getBin(filePath: string): Promise<string | null> {
    if (filePath.endsWith('/main.rs')) {
        return getPackage(filePath);
    }

    let currentPath = path.dirname(filePath);
    while (currentPath !== vscode.workspace.rootPath) {
        const cargoTomlPath = path.join(currentPath, 'Cargo.toml');
        if (fs.existsSync(cargoTomlPath)) {
            const cargoTomlContent = fs.readFileSync(cargoTomlPath, 'utf8');
            const binRegex = /^\[\[bin\]\][\s\S]*?^name\s*=\s*"([^"]+)"\s*path\s*=\s*"([^"]+)"/gm;
            let match;
            while ((match = binRegex.exec(cargoTomlContent)) !== null) {
                if (filePath.endsWith(match[2])) {
                    return match[1];
                }
            }
            break;
        }
        currentPath = path.dirname(currentPath);
    }
    return null;
}
