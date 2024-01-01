import * as vscode from 'vscode';

async function getTestName(filePath: string): Promise<string | null> {
    const document = await vscode.workspace.openTextDocument(filePath);
    const position = vscode.window.activeTextEditor?.selection.active;

    if (!position) {
        return null;
    }

    let testName: string | null = null;
    let functionStart: number | null = null;
    let braceCount = 0;

    // Scan upwards for function start
    for (let i = position.line; i >= 0; i--) {
        const line = document.lineAt(i);
        const match = line.text.match(/fn (\w+)\(/);
        if (match) {
            testName = match[1];
            functionStart = i;
            break;
        }
    }

    // If we didn't find a function start, return null
    if (functionStart === null) {
        return null;
    }

    // Scan downwards for function end
    for (let i = functionStart; i < document.lineCount; i++) {
        const line = document.lineAt(i);
        if (line.text.includes('{')) {
            braceCount++;
        }
        if (line.text.includes('}')) {
            braceCount--;
        }
        if (braceCount === 0) {
            // If the current position is within the function bounds, return the function name
            if (position.line >= functionStart && position.line <= i) {
                return testName;
            }
            break;
        }
    }

    return null;
}

export { getTestName };