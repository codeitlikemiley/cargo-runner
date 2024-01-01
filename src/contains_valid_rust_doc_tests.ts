import * as vscode from 'vscode';

function containsValidRustDocTests(document: vscode.TextDocument): boolean {
    const lines = document.getText().split(/\r?\n/);
    let inFunction = false;
    let inDocComment = false;
    let hasCodeBlock = false;

    for (let line of lines) {
        // Identify start and end of a function
        if (line.includes('fn ') && line.includes('{')) {
            inFunction = true;
        }
        if (inFunction && line.trim() === '}') {
            inFunction = false;
        }

        // Processing for outside of function bodies
        if (!inFunction) {
            // Identify start of a doc comment
            if (line.trim().startsWith('///') || line.trim().startsWith('/**')) {
                inDocComment = true;
                hasCodeBlock = false; // Reset for new doc comment
            }

            // Identify end of a doc comment
            if (inDocComment && (line.trim() === '*/' || !line.trim().startsWith('///'))) {
                inDocComment = false;
                if (hasCodeBlock) {
                    return true;
                }
            }

            // Check for code block within doc comment
            if (inDocComment && line.trim().startsWith('```')) {
                hasCodeBlock = true;
            }
        }
    }

    return false;
}

export default containsValidRustDocTests;