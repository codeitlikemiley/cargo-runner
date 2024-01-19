import * as vscode from 'vscode';

function getTestFunctionName(document: vscode.TextDocument, position: vscode.Position): string | null {
    let lineNum = position.line;

    // Search upwards for the nearest test macro or function declaration
    while (lineNum >= 0) {
        const lineText = document.lineAt(lineNum).text;

        // Check for test macro and get function name below it
        if (/#\[(test|tokio::test)\]/.test(lineText)) {
            return getFunctionNameBelow(document, lineNum);
        }

        // Check for function declaration with test macro above
        const fnMatch = lineText.match(/(async\s+)?fn\s+[\w]+/);
        if (fnMatch && fnMatch[0] && hasTestMacroAbove(document, lineNum)) {
            return extractFunctionName(fnMatch[0]);
        }

        lineNum--;
    }

    return null; // No test function found or not in test context
}

function extractFunctionName(fnDeclaration: string): string | null {
    let parts = fnDeclaration.split(' ');
    if (parts.length > 1) {
        let namePart = parts.pop();
        if (namePart) {
            return namePart.split('(')[0];
        }
    }
    return null;
}

function getFunctionNameBelow(document: vscode.TextDocument, lineNum: number): string | null {
    for (let i = lineNum + 1; i < document.lineCount; i++) {
        const lineText = document.lineAt(i).text;
        const match = lineText.match(/(async\s+)?fn\s+[\w]+/);
        if (match && match[0]) {
            return extractFunctionName(match[0]);
        }
    }
    return null;
}

function hasTestMacroAbove(document: vscode.TextDocument, lineNum: number): boolean {
    for (let i = lineNum - 1; i >= 0; i--) {
        const lineText = document.lineAt(i).text;
        if (/#\[(test|tokio::test)\]/.test(lineText)) {
            return true;
        }
        // Stop at the previous function declaration
        if (/(async\s+)?fn\s+[\w]+/.test(lineText)) {
            break;
        }
    }
    return false;
}

export { getTestFunctionName };
