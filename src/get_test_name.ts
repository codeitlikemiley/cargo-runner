import * as vscode from 'vscode';

function getTestName(): string | null {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {return null;}

    const document = editor.document;
    const cursorPosition = editor.selection.active.line;
    const lineCount = document.lineCount;

    for (let i = 0; i < lineCount; i++) {
        const lineText = document.lineAt(i).text;
        if (lineText.includes("#[test]") || lineText.includes("#[tokio::test]")) {
            if (cursorPosition >= i) {
                const functionLine = document.lineAt(i + 1).text;
                const fnIndex = functionLine.indexOf("fn ");

                if (fnIndex !== -1) {
                    const functionStart = fnIndex + 3;
                    const functionEnd = functionLine.indexOf("(", functionStart);
                    if (functionEnd !== -1) {
                        const testName = functionLine.slice(functionStart, functionEnd).trim();
                        let braceCount = 0;

                        for (let j = i + 1; j < lineCount; j++) {
                            braceCount += (document.lineAt(j).text.match(/{/g) || []).length;
                            braceCount -= (document.lineAt(j).text.match(/}/g) || []).length;

                            if (braceCount === 0 && cursorPosition <= j) {
                                return testName.split(/\s+/)[0];
                            }
                        }
                    }
                }
            }
        }
    }
    return null;
}

export { getTestName };
