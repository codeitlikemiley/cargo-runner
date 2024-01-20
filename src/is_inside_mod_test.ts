import * as vscode from 'vscode';

export default function isInsideModTests(document: vscode.TextDocument, line: number): boolean {
    for (let i = line; i >= 0; i--) {
        const text = document.lineAt(i).text.trim();
        if (text.startsWith('mod tests {') || text.startsWith('mod tests')) {
            return true;
        }
        if (text.startsWith('mod ') && !text.startsWith('mod tests')) {
            break; // Found another module declaration
        }
    }
    return false;
}