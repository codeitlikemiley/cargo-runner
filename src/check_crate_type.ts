import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

async function checkCrateType(filePath: string): Promise<string | null> {
    const fileTypes = ['/main.rs', '/lib.rs', '/build.rs'];
    const crateTypes = ['bin', 'lib', 'build'];
    const parentDir = path.dirname(filePath);

    if (path.basename(parentDir) === 'bin') {
        return 'bin';
    }

    for (let i = 0; i < fileTypes.length; i++) {
        if (filePath.endsWith(fileTypes[i])) {
            return crateTypes[i];
        }
    }

    let currentPath = path.dirname(filePath);
    while (currentPath !== vscode.workspace.rootPath) {
        const cargoTomlPath = path.join(currentPath, 'Cargo.toml');
        if (fs.existsSync(cargoTomlPath)) {
            const cargoTomlContent = fs.readFileSync(cargoTomlPath, 'utf8');
            const crateType = getCrateTypeFromCargoToml(cargoTomlContent);
            if (crateType) {
                return crateType;
            }
            break;
        }
        currentPath = path.dirname(currentPath);
    }
    return null;
}

function getCrateTypeFromCargoToml(cargoTomlContent: string): string | null {
    const crateTypes = ['[[bin]]', '[[lib]]'];
    const correspondingCrateTypes = ['bin', 'lib'];

    for (let i = 0; i < crateTypes.length; i++) {
        if (cargoTomlContent.includes(crateTypes[i])) {
            return correspondingCrateTypes[i];
        }
    }
    return null;
}

export { checkCrateType };