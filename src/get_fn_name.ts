import * as vscode from 'vscode';

function getTestFunctionName(document: vscode.TextDocument, position: vscode.Position): string | null {
    let lineNum = position.line;
    let lineText = document.lineAt(lineNum).text;

    // Case 1: On a test macro line
    if (/#\[(test|tokio::test)\]/.test(lineText)) {
        return getFunctionNameBelow(document, lineNum);
    }

    // Case 2: On a test function declaration line
    let fnMatch = lineText.match(/(async\s+)?fn\s+test_[\w]+/);
    if (fnMatch && fnMatch[0]) {
        return extractFunctionName(fnMatch[0]);
    }

    // Case 3: Inside or at the closing brace of a function block
    if (lineText.includes('{') || lineText.includes('}') || insideFunctionBlock(document, lineNum)) {
        return searchFunctionNameAbove(document, lineNum);
    }

    return null; // Outside of test function scope
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
        let lineText = document.lineAt(i).text;
        let match = lineText.match(/(async\s+)?fn\s+test_[\w]+/);
        if (match && match[0]) {
            return extractFunctionName(match[0]);
        }
    }
    return null;
}

function searchFunctionNameAbove(document: vscode.TextDocument, lineNum: number): string | null {
    for (let i = lineNum; i >= 0; i--) {
        let lineText = document.lineAt(i).text;
        let match = lineText.match(/(async\s+)?fn\s+test_[\w]+/);
        if (match && match[0]) {
            return extractFunctionName(match[0]);
        }
    }
    return null;
}

function insideFunctionBlock(document: vscode.TextDocument, lineNum: number): boolean {
    let braceCount = 0;
    for (let i = lineNum; i >= 0; i--) {
        let lineText = document.lineAt(i).text;
        braceCount += (lineText.match(/{/g) || []).length;
        braceCount -= (lineText.match(/}/g) || []).length;

        if (braceCount > 0) {
            return true; // Inside a function block
        }
    }
    return false;
}

export { getTestFunctionName };
