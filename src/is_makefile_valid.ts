import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

function isMakefileValid(makefilePath: string): boolean {
    try {
        const makefileContent = fs.readFileSync(makefilePath, 'utf8');
        return /(^|\n)run:/.test(makefileContent) || /(^|\n)build:/.test(makefileContent);
    } catch (err) {
        return false;
    }
}

export { isMakefileValid };
