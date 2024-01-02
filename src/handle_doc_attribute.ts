import * as vscode from 'vscode';

async function handleDocAttribute(document: vscode.TextDocument, position: vscode.Position): Promise<{ isValid: boolean, fnName: string | null } | null> {
    let foundDocComment = false;
    let docCommentStart: number | null = null;
    let functionStart: number | null = null;
    let functionEnd: number | null = null;
    let braceCount = 0;
    let inFunction = false;
    let functionName: string | null = null;
    let inMultiLineDocComment = false;

    for (let i = position.line; i >= 0; i--) {
        const line = document.lineAt(i).text.trim();

        // Handling for multiline doc comments
        if ((line.startsWith('#[doc = r#"') || line.startsWith('#[doc = "')) && !foundDocComment) {
            foundDocComment = true;
            docCommentStart = i;
            inMultiLineDocComment = true;
        }

        if (inMultiLineDocComment && line.endsWith('"#]')) {
            inMultiLineDocComment = false;
        }

        // Handling for single-line doc comments
        if (line.startsWith('#![doc(') && !foundDocComment) {
            foundDocComment = true;
            docCommentStart = i;
        }

        if (!inFunction && !inMultiLineDocComment) {
            const match = line.match(/(async\s+)?fn\s+(\w+)\s*\(/);
            if (match) {
                functionStart = i;
                functionName = match[2];
                inFunction = true;
            }
        }

        if ((foundDocComment && !inMultiLineDocComment) || inFunction) {
            break;
        }
    }

    if (foundDocComment && docCommentStart !== null && !functionName) {
        for (let i = docCommentStart + 1; i < document.lineCount; i++) {
            const line = document.lineAt(i).text.trim();

            const match = line.match(/(async\s+)?fn\s+(\w+)\s*\(/);
            if (match) {
                functionStart = i;
                functionName = match[2];
                break;
            }
        }
    }

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

    const inDocComment = foundDocComment && docCommentStart !== null && position.line >= docCommentStart;
    const inFunctionBody = functionStart !== null && functionEnd !== null && position.line >= functionStart && position.line <= functionEnd;
    const isValid = inDocComment || inFunctionBody;

    return isValid ? { isValid, fnName: functionName } : null;
}

export default handleDocAttribute;