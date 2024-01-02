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

    console.log(`Starting scan from position: ${position.line}`);

    // Scan upwards to find the start of the doc comment
    for (let i = position.line; i >= 0; i--) {
        const line = document.lineAt(i).text.trim();
        console.log(`Checking line ${i}: ${line}`);

        // Check for doc comment (///)
        if (line.startsWith('///') && !foundDocComment) {
            foundDocComment = true;
            docCommentStart = i;
            console.log(`Doc comment found starting at line ${i}`);
        }

        // Once a doc comment is found, stop the upward scan
        if (foundDocComment) {
            console.log(`Stopping upward scan at line ${i}`);
            break;
        }
    }

    // If doc comment start was found, scan downwards to find the associated function
    if (foundDocComment && docCommentStart !== null) {
        console.log(`Scanning downwards from doc comment start at line ${docCommentStart}`);
        for (let i = docCommentStart + 1; i < document.lineCount; i++) {
            const line = document.lineAt(i).text.trim();
            console.log(`Checking line ${i}: ${line}`);

            // Check for function start
            const match = line.match(/(async\s+)?fn\s+(\w+)\s*\(/);
            if (match) {
                functionStart = i;
                functionName = match[2];
                inFunction = true;
                console.log(`Function '${functionName}' start found at line ${i}`);
                break;
            }
        }
    }

    // If function start was found, scan downwards to find function end
    if (functionStart !== null) {
        for (let i = functionStart; i < document.lineCount; i++) {
            const line = document.lineAt(i).text;
            console.log(`Checking line ${i}: ${line}`);

            if (line.includes('{')) {
                braceCount++;
            }
            if (line.includes('}')) {
                braceCount--;
                if (braceCount === 0) {
                    functionEnd = i;
                    console.log(`Function '${functionName}' end found at line ${i}`);
                    break;
                }
            }
        }
    }

    // Check if position is within the bounds of the function or doc comment
    const inDocComment = foundDocComment && docCommentStart !== null && position.line <= docCommentStart;
    const inFunctionBody = functionStart !== null && functionEnd !== null && position.line >= functionStart && position.line <= functionEnd;
    const isValid = inDocComment || inFunctionBody;

    // If the line is after the function's end or if functionEnd is null, it's not valid and not part of the function
    if (functionEnd !== null && position.line > functionEnd) {
        return { isValid: false, fnName: null };
    }

    console.log(`Position ${position.line} is in doc comment: ${inDocComment}, in function body: ${inFunctionBody}, isValid: ${isValid}, functionName: ${functionName}`);
    return { isValid, fnName: functionName };
}

export default isDocTest;
