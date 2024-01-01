import * as vscode from 'vscode';

function isFileInTestContext(): boolean {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        return false;
    }

    const document = editor.document;
    const cursorLine = editor.selection.active.line;
    let openBraces = 0;

    for (let i = 0; i <= cursorLine; i++) {
        const lineText = document.lineAt(i).text;
        if (lineText.includes("#[tokio::test]") || lineText.includes("#[test]")) {
            if (i === cursorLine || (i + 1 === cursorLine && /\basync? fn test_/.test(document.lineAt(i + 1).text))) {
                return true;
            }
        }
        openBraces += (lineText.match(/{/g) || []).length;
        openBraces -= (lineText.match(/}/g) || []).length;
    }

    return openBraces > 0;
}

export { isFileInTestContext };