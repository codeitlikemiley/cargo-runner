import * as vscode from 'vscode';

async function isDocTest(filePath: string, position: vscode.Position | undefined): Promise<boolean> {
    if (!position) {
        console.log("Position is undefined.");
        return false;
    }
    const document = await vscode.workspace.openTextDocument(filePath);

    let foundDocComment = false;
    let docCommentStart: number | null = null;
    let functionStart: number | null = null;
    let functionEnd: number | null = null;
    let braceCount = 0;
    let inFunction = false;

    // Scan upwards to find the start of the doc comment or function
    for (let i = position.line; i >= 0; i--) {
        const line = document.lineAt(i).text.trim();

        // Check for function start
        if (!inFunction) {
            const match = line.match(/(async\s+)?fn\s+(\w+)\s*\(/);
            if (match) {
                functionStart = i;
                inFunction = true;
            }
        }

        // Check for doc comment
        if (line.startsWith('///') && !foundDocComment) {
            foundDocComment = true;
            docCommentStart = i;
        }

        // Once a function or a doc comment is found, stop the upward scan
        if (foundDocComment || inFunction) {
            break;
        }
    }

    if (functionStart === null && !foundDocComment) {
        console.log("No function or doc comment found.");
        return false;
    }

    // If function start was found, scan downwards to find function end
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

    // Check if position is within the bounds of the function or doc comment
    const inDocComment = foundDocComment && docCommentStart !== null && position.line <= docCommentStart;
    const inFunctionBody = functionStart !== null && functionEnd !== null && position.line >= functionStart && position.line <= functionEnd;

    return inDocComment || inFunctionBody;
}

export default isDocTest;
