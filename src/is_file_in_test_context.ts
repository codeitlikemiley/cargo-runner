import * as vscode from 'vscode';

function isFileInTestContext(): boolean {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        return false;
    }

    const document = editor.document;
    const cursorLine = editor.selection.active.line;

    // Check if the file contains any of the test indicators
    const fileText = document.getText();
    if (!fileText.includes("#[cfg(test)]") && !fileText.includes("#[test]") && !fileText.includes("#[tokio::test]") && !fileText.match(/fn test_/)) {
        return false;
    }

    // Check if we are inside the context of the `fn test_*()` function or `#[cfg(test)] mod tests {}` block
    for (let i = 0; i <= cursorLine; i++) {
        const lineText = document.lineAt(i).text;
        if (lineText.includes("#[cfg(test)]") || lineText.includes("#[test]") || lineText.includes("#[tokio::test]") || lineText.match(/fn test_/)) {
            if (i === cursorLine) {
                return true;
            }
            let openBraces = 0;
            for (let j = i + 1; j <= cursorLine; j++) {
                const lineText = document.lineAt(j).text;
                openBraces += (lineText.match(/{/g) || []).length;
                openBraces -= (lineText.match(/}/g) || []).length;
                if (openBraces === 0 && j < cursorLine) {
                    break;
                }
                if (j === cursorLine && openBraces >= 0) {
                    return true;
                }
            }
        }
    }

    return false;
}

export { isFileInTestContext };