import * as vscode from 'vscode';

function getTestName(): string | null {
    const editor = vscode.window.activeTextEditor;
    if (!editor) { return null; }

    const document = editor.document;
    const cursorPosition = editor.selection.active.line;

    for (let i = cursorPosition; i >= 0; i--) {
        const lineText = document.lineAt(i).text;

        // Check for test annotations
        if (lineText.includes("#[test]") || lineText.includes("#[tokio::test]")) {
            // The function declaration is expected to be one of the next few lines
            for (let j = i + 1; j < document.lineCount && j <= i + 5; j++) {
                const fnLineText = document.lineAt(j).text;
                if (fnLineText.includes("fn ")) {
                    const fnIndex = fnLineText.indexOf("fn ");
                    const functionStart = fnIndex + 3;
                    const functionEnd = fnLineText.indexOf("(", functionStart);
                    if (functionEnd !== -1) {
                        return fnLineText.slice(functionStart, functionEnd).trim().split(/\s+/)[0];
                    }
                }
            }
            break; // Stop the search after inspecting possible function declaration lines
        }
    }
    return null;
}

export { getTestName };
