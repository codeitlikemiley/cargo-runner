import * as vscode from 'vscode';

interface BracePositions {
    opening: vscode.Position | undefined;
    closing: vscode.Position | undefined;
}

function findModTestBraces(document: vscode.TextDocument): BracePositions {
    let openingBrace: vscode.Position | undefined;
    let closingBrace: vscode.Position | undefined;
    let depth = 0;

    for (let line = 0; line < document.lineCount; line++) {
        const lineText = document.lineAt(line).text;

        if (lineText.includes("mod test")) {
            openingBrace = new vscode.Position(line, 0);
            depth = 1;
            break;
        }
    }

    if (openingBrace !== undefined) {
        for (let line = openingBrace.line + 1; line < document.lineCount; line++) {
            const lineText = document.lineAt(line).text;

            for (let i = 0; i < lineText.length; i++) {
                if (lineText[i] === '{') {
                    depth++;
                } else if (lineText[i] === '}') {
                    depth--;

                    if (depth === 0) {
                        closingBrace = new vscode.Position(line, i);
                        break;
                    }
                }
            }

            if (closingBrace !== undefined) {
                break;
            }
        }
    }

    return { opening: openingBrace, closing: closingBrace };
}

export default function isInsideModTests(document: vscode.TextDocument, position: vscode.Position): boolean {
    const mod = findModTestBraces(document);
    console.log(`opening: ${mod.opening?.line}, closing: ${mod.closing?.line} , current line number on position ${position.line}`);

    return mod.opening !== undefined && mod.closing !== undefined &&
        position.isAfterOrEqual(mod.opening) && position.isBeforeOrEqual(mod.closing);
}
