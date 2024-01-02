import * as vscode from 'vscode';

async function isDocTest(filePath: string, position: vscode.Position | undefined): Promise<{ isValid: boolean, fnName: string | null }> {
    if (!position) {
        console.log("Position is undefined.");
        return { isValid: false, fnName: null };
    }
    const document = await vscode.workspace.openTextDocument(filePath);

    let foundDocComment = false;
    let docCommentStart: number | null = null;
    let functionStart: number | null = null;
    let functionEnd: number | null = null;
    let braceCount = 0;
    let inFunction = false;
    let functionName: string | null = null;
    let inMultiLineDocComment = false;

    console.log(`Starting scan from position: ${position.line}`);

    for (let i = position.line; i >= 0; i--) {
        const line = document.lineAt(i).text.trim();
        console.log(`Checking line ${i}: ${line}`);

        // Check for start of multiline doc comment
        if ((line.startsWith('#[doc = r#"') || line.startsWith('#[doc = "')) && !foundDocComment) {
            foundDocComment = true;
            docCommentStart = i;
            inMultiLineDocComment = true;
        }

        // Check for end of multiline doc comment
        if (inMultiLineDocComment && line.endsWith('"#]')) {
            inMultiLineDocComment = false;
        }

        // Check for single-line doc comment
        if (line.startsWith('#![doc(') && !foundDocComment) {
            foundDocComment = true;
            docCommentStart = i;
        }

        // Check for function start
        if (!inFunction && !inMultiLineDocComment) {
            const match = line.match(/(async\s+)?fn\s+(\w+)\s*\(/);
            if (match) {
                functionStart = i;
                functionName = match[2];
                inFunction = true;
            }
        }

        // Once a doc comment or a function is found, stop the upward scan
        if ((foundDocComment && !inMultiLineDocComment) || inFunction) {
            break;
        }
    }

    // If a doc comment was found, scan downwards to find the associated function
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

    return { isValid, fnName: isValid ? functionName : null };
}

export default isDocTest;
