import * as vscode from 'vscode';

export default function getTestFunctionName(document: vscode.TextDocument, position: vscode.Position): string | null {
    let currentLine = position.line;

    const log = (message: string) => console.log(`[getTestFunctionName]: ${message}`);

    function isInsideModTests(line: number): boolean {
        for (let i = line; i >= 0; i--) {
            const text = document.lineAt(i).text.trim();
            if (text.startsWith('mod tests {') || text.startsWith('mod tests')) {
                return true;
            }
            if (text.startsWith('mod ') && !text.startsWith('mod tests')) {
                break; // Found another module declaration
            }
        }
        return false;
    }

    function returnModuleNameOrNull(): string | null {
        return isInsideModTests(currentLine) ? "tests" : null;
    }

    function isClosingBrace(line: number): boolean {
        return document.lineAt(line).text.trim() === '}';
    }

    function isFunctionDeclaration(line: number): boolean {
        const text = document.lineAt(line).text.trim();
        return text.startsWith('fn ') || text.startsWith('async fn ');
    }

    function isTestMacro(line: number): boolean {
        const text = document.lineAt(line).text.trim();
        let pattern = /#\[(\w+::)?(test|bench)\]/g;
        return pattern.test(text);
    }


    function isInsideTestFunction(): string | null {
        let closingBraceLine = -1;

        // Find the nearest closing brace below
        for (let i = currentLine; i < document.lineCount; i++) {
            if (isTestMacro(i)) {
                // Found a test macro before a closing brace
                return returnModuleNameOrNull();
            }
            if (isClosingBrace(i)) {
                closingBraceLine = i;
                break;
            }
        }

        if (closingBraceLine !== -1) {
            // Find the corresponding opening brace and function declaration above
            for (let i = closingBraceLine; i >= 0; i--) {
                if (isFunctionDeclaration(i)) {
                    if (isTestMacro(i - 1)) {
                        // Found a test function
                        const match = document.lineAt(i).text.match(/(async\s+)?fn\s+(\w+)/);
                        return match ? match[2] : null;
                    }
                    break; // Stop if a function declaration is found without a test macro
                }
            }
        }

        return returnModuleNameOrNull();
    }




    log(`Starting at line: ${currentLine + 1}`);


    // Handle cursor on test macro or function declaration
    if (isTestMacro(currentLine) || isFunctionDeclaration(currentLine)) {
        let functionNameLine = currentLine;
        while (functionNameLine < document.lineCount && !isFunctionDeclaration(functionNameLine)) {
            functionNameLine++;
        }
        const match = document.lineAt(functionNameLine).text.match(/(async\s+)?fn\s+(\w+)/);
        if (match) {
            log(`Function name found on line: 85: ${match[2]}`);
            return match[2];
        }
    }

    // Handle cursor on a closing brace
    if (isClosingBrace(currentLine)) {
        let foundTestMacro = false;
        let testFunctionLine = -1;
    
        for (let i = currentLine; i >= 0; i--) {
            if (isTestMacro(i)) {
                foundTestMacro = true;
                // Continue to find the function declaration below the test macro
                for (let j = i + 1; j < document.lineCount; j++) {
                    if (isFunctionDeclaration(j)) {
                        testFunctionLine = j;
                        break;
                    }
                }
                break;
            } else if (isClosingBrace(i) && i !== currentLine) {
                // Found another closing brace before a test macro
                break;
            }
        }
    
        if (foundTestMacro && testFunctionLine !== -1) {
            const match = document.lineAt(testFunctionLine).text.match(/(async\s+)?fn\s+(\w+)/);
            if (match) {
                log(`Function name found: ${match[2]}`);
                return match[2];
            }
        } else {
            log('Cursor on closing brace, but not a test function, returning null');
            return returnModuleNameOrNull();
        }
    }

    // Handle cursor inside a function body
    const functionName = isInsideTestFunction();
    if (functionName) {
        return  functionName;
    }

    log("No test function found");
    return returnModuleNameOrNull();
}
