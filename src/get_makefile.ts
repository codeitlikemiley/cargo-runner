import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

async function getMakefile(filePath: string): Promise<string | null> {
    let currentPath = filePath;
    
    while (currentPath !== vscode.workspace.rootPath) {
        const makefilePath = path.join(currentPath, 'Makefile');
        if (fs.existsSync(makefilePath)) {
            return makefilePath;
        }
        currentPath = path.dirname(currentPath);
    }
    
    return null;
}
export { getMakefile };