import * as vscode from 'vscode';

function isFileInTestContext(): boolean {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        console.log("No active editor found.");
        return false;
    }

    const document = editor.document;
    const cursorLine = editor.selection.active.line;

    const pattern = /#\[(cfg\(test\)|(\w+::)?test|\w+_test)\]/;
    const functionPattern = /^\s*fn\s+test_/;

    // Check if the file contains any of the test indicators
    const fileText = document.getText();
    if (!pattern.test(fileText)) {
        console.log("No test indicator found in the file.");
        return false;
    }

    // Check if we are inside the context of the `fn test_*()` function or `#[cfg(test)] mod tests {}` block
    let openBraces = 0;
    for (let i = 0; i <= cursorLine; i++) {
        const lineText = document.lineAt(i).text;
        if (pattern.test(lineText) || functionPattern.test(lineText)) {
            if (i === cursorLine) {
                console.log(`Cursor is on a test indicator line: ${lineText}`);
                return true;
            }

            // Reset openBraces if a new context starts
            openBraces = 0;
            for (let j = i + 1; j <= cursorLine; j++) {
                const innerLineText = document.lineAt(j).text;
                openBraces += (innerLineText.match(/{/g) || []).length;
                openBraces -= (innerLineText.match(/}/g) || []).length;

                if (openBraces === 0 && j < cursorLine) {
                    break;
                }

                if (j === cursorLine && openBraces >= 0) {
                    console.log("Cursor is within test context.");
                    return true;
                }
            }
        }
    }

    console.log("Cursor is not within test context.");
    return false;
}

export { isFileInTestContext };
