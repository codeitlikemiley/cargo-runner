import * as vscode from 'vscode';

async function handleDocTest(document: vscode.TextDocument, position: vscode.Position): Promise<{ isValid: boolean, fnName: string | null }> {
    let foundDocTest = false;
    let hasCodeBlock = false;
    let functionName: string | null = null;

    // Scan for `///` comment blocks and check for code blocks
    for (let i = position.line; i >= 0; i--) {
        const line = document.lineAt(i).text.trim();

        if (line.startsWith('///')) {
            foundDocTest = true;
            if (line.includes('```')) {
                hasCodeBlock = !hasCodeBlock;  // Toggle the presence of a code block
            }
        } else if (foundDocTest) {
            break; // Exit loop once we're past the comment block
        }
    }

    // If a valid doc-test is found, find the nearest function
    if (foundDocTest && hasCodeBlock) {
        for (let i = position.line + 1; i < document.lineCount; i++) {
            const line = document.lineAt(i).text.trim();
            const fnMatch = line.match(/^(pub\s+)?(async\s+)?fn\s+(\w+)/);

            if (fnMatch && !fnMatch[3].startsWith('test_')) {
                functionName = fnMatch[3];
                break;
            }
        }
    }

    const isValid = foundDocTest && hasCodeBlock && functionName !== null;

    return { isValid, fnName: functionName };
}

export default handleDocTest;
