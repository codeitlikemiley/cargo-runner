import * as vscode from 'vscode';

async function handleOptimizedDocTest(document: vscode.TextDocument, position: vscode.Position): Promise<{ isValid: boolean, fnName: string | null }> {
    let currentLineText = document.lineAt(position.line).text.trim();

    // Immediate return cases
    if (currentLineText.startsWith('///') || currentLineText.startsWith('#[doc') || currentLineText.startsWith('#![doc')) {
        return { isValid: false, fnName: null };
    }

    // Check if current line is a function declaration
    let fnMatch = currentLineText.match(/^(pub\s+)?(async\s+)?fn\s+(\w+)/);
    if (fnMatch) {
        return scanUpwardsForDocStartAndBackticks(document, position);
    }

    // Scenarios based on doc comment start or end
    if (currentLineText.startsWith('/**')) {
        return scanDownwardsForBackticksAndFunction(document, position);
    }

    if (currentLineText.startsWith('*/')) {
        return scanForFunctionAndUpwardsForBackticks(document, position);
    }

    // Exhaustive search for other cases
    return exhaustiveSearchForDocTest(document, position);
}

function scanUpwardsForDocStartAndBackticks(document: vscode.TextDocument, position: vscode.Position): { isValid: boolean, fnName: string | null } {
    let inDocCommentBlock = false;
    let inCodeBlock = false;
    console.log("debugger start")

    console.log(document.lineAt(position.line).text)

    console.log("debugger end")
    let functionName = document.lineAt(position.line).text.trim().match(/^(pub\s+)?(async\s+)?fn\s+(\w+)/)?.[3] || null;

    for (let i = position.line; i >= 0; i--) {
        const line = document.lineAt(i).text.trim();

        if (line.startsWith('/**')) {
            inDocCommentBlock = true;
            break;
        }

        if (line.includes('```')) {
            inCodeBlock = true;
        }
    }

    return { isValid: inDocCommentBlock && inCodeBlock, fnName: functionName };
}


function scanDownwardsForBackticksAndFunction(document: vscode.TextDocument, position: vscode.Position): { isValid: boolean, fnName: string | null } {
    let inCodeBlock = false;
    let functionName: string | null = null;

    for (let i = position.line; i < document.lineCount; i++) {
        const line = document.lineAt(i).text.trim();

        if (line.includes('```')) {
            inCodeBlock = true;
        }

        if (line.includes('*/')) {
            // Extract function name after the doc comment block ends
            functionName = document.lineAt(i + 1).text.trim().match(/^(pub\s+)?(async\s+)?fn\s+(\w+)/)?.[3] || null;
            break;
        }
    }

    return { isValid: inCodeBlock, fnName: functionName };
}


function scanForFunctionAndUpwardsForBackticks(document: vscode.TextDocument, position: vscode.Position): { isValid: boolean, fnName: string | null } {
    let inCodeBlock = false;
    let functionName: string | null = null;

    // Scanning downwards for the function
    for (let i = position.line; i < document.lineCount; i++) {
        const line = document.lineAt(i).text.trim();
        const fnMatch = line.match(/^(pub\s+)?(async\s+)?fn\s+(\w+)/);

        if (fnMatch) {
            functionName = fnMatch[3];
            break;
        }

    }

    // Scanning upwards for backticks
    for (let i = position.line; i >= 0 && functionName; i--) {
        const line = document.lineAt(i).text.trim();
        if (line.includes('```')) {
            inCodeBlock = true;
            break;
        }
    }

    return { isValid: inCodeBlock && functionName !== null, fnName: functionName };
}


function exhaustiveSearchForDocTest(document: vscode.TextDocument, position: vscode.Position): { isValid: boolean, fnName: string | null } {
    let inDocCommentBlock = false;
    let inCodeBlock = false;
    let functionName: string | null = null;
    let codeBlockCount = 0;

    // Scan upwards for the start of the doc comment and a code block
    for (let i = position.line; i >= 0; i--) {
        const line = document.lineAt(i).text.trim();

        // If end of a different doc comment or another doc comment start found
        if (line.includes('*/') || line.startsWith('///')) {
            break;
        }

        // Check for start of doc comment or code block
        if (line.startsWith('/**')) {
            inDocCommentBlock = true;
            break;
        }
        if (line.includes('```')) {
            codeBlockCount++;
        }

    }

    // Proceed only if both doc comment and code block are found
    if (inDocCommentBlock) {
        // Scan downwards for the function name
        for (let i = position.line; i < document.lineCount; i++) {
            const line = document.lineAt(i).text.trim();

            // Check for function declaration
            const fnMatch = line.match(/^(pub\s+)?(async\s+)?fn\s+(\w+)/);
            if (fnMatch) {
                functionName = fnMatch[3];
                break;
            }
        }
    }

    return { isValid: inDocCommentBlock && codeBlockCount > 0 && functionName !== null, fnName: functionName };
}



export default handleOptimizedDocTest;
