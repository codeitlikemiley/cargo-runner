import * as vscode from 'vscode';

function parseMultiBlocksComment(document: vscode.TextDocument, line: number): { start: number, end: number } | null {
    let start = line;
    let end = line;
    let foundStart = false;

    // Scan upwards for the start of the block comment
    for (let i = line; i >= 0; i--) {
        if (document.lineAt(i).text.trim().startsWith('/**')) {
            start = i;
            foundStart = true;
            break;
        }
    }

    // If start is found, scan downwards for the end of the block comment
    if (foundStart) {
        for (let i = line; i < document.lineCount; i++) {
            if (document.lineAt(i).text.trim().endsWith('*/')) {
                end = i;
                return { start, end };
            }
        }
    }

    return null;
}

export default parseMultiBlocksComment;