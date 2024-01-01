import * as vscode from 'vscode';

function isOnDocTestContext(): boolean {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        return false;
    }

    const docBlockRegex = /\/\*\*[\s\S]*?\*\/|\/\/\/[\s\S]*?(?=\n\s*\/\/\/|\n\s*\*\/|$)/g;
    const cursorPosition = editor.selection.active;
    const textBeforeCursor = editor.document.getText(new vscode.Range(new vscode.Position(0, 0), cursorPosition));

    let match;
    while ((match = docBlockRegex.exec(textBeforeCursor)) !== null) {
        if (docBlockRegex.lastIndex >= textBeforeCursor.length) {
            return true;
        }
    }

    return false;
}

export default isOnDocTestContext;