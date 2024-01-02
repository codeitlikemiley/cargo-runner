import * as vscode from 'vscode';

async function handleDocAttribute(document: vscode.TextDocument, position: vscode.Position): Promise<{ isValid: boolean, fnName: string | null } | null> {
    let foundDocComment = false;
    let docCommentStart: number | null = null;
    let functionStart: number | null = null;
    let functionEnd: number | null = null;
    let functionName: string | null = null;
    let inMultiLineDocComment = false;

    // Scan upwards from the position to find a doc comment or function start
    for (let i = position.line; i >= 0; i--) {
        const line = document.lineAt(i).text.trim();

        // Handle multiline doc comments
        if ((line.startsWith('#[doc = r#"') || line.startsWith('#[doc = "')) && !foundDocComment) {
            foundDocComment = true;
            docCommentStart = i;
            inMultiLineDocComment = true;
        }

        if (inMultiLineDocComment && line.endsWith('"#]')) {
            inMultiLineDocComment = false;
        }

        // Handle function start
        if (!foundDocComment && !inMultiLineDocComment) {
            const match = line.match(/(async\s+)?fn\s+(\w+)\s*\(/);
            if (match) {
                functionName = match[2];
                functionStart = i;
                break;
            }
        }
    }

    // If a doc comment was found, scan downwards to find the associated function
    if (foundDocComment && docCommentStart !== null) {
        for (let i = docCommentStart + 1; i < document.lineCount; i++) {
            const line = document.lineAt(i).text.trim();

            const match = line.match(/(async\s+)?fn\s+(\w+)\s*\(/);
            if (match) {
                functionName = match[2];
                functionStart = i;
                break;
            }
        }
    }

    // Determine the end of the function
    let braceCount = 0;
    if (functionStart !== null) {
        for (let i = functionStart; i < document.lineCount; i++) {
            const line = document.lineAt(i).text;

            if (line.includes('{')) {
                braceCount++;
            }
            if (line.includes('}')) {
                braceCount--;
                if (braceCount === 0) {
                    functionEnd = i;
                    break;
                }
            }
        }
    }

    const inDocComment = foundDocComment && docCommentStart !== null && position.line >= docCommentStart && (!functionStart || position.line <= functionStart);
    const inFunctionBody = functionStart !== null && functionEnd !== null && position.line >= functionStart && position.line <= functionEnd;
    const isValid = inDocComment && !inFunctionBody;

    return isValid ? { isValid, fnName: functionName } : null;
}

export default handleDocAttribute;
