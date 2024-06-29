import * as vscode from 'vscode';

interface FoundType {
    name: string;
    type: 'struct' | 'enum' | 'impl_struct' | 'impl_enum';
    position: number;
}

async function findStructOrEnum(document: vscode.TextDocument, position: vscode.Position): Promise<FoundType | undefined> {
    const content = document.getText();
    const cursorOffset = document.offsetAt(position);

    // Regular expressions to match struct and enum declarations
    const structRegex = /\b(?:pub\s+)?(?:pub\s*\(\s*crate\s*\)\s+)?struct\s+(\w+)/g;
    const enumRegex = /\b(?:pub\s+)?(?:pub\s*\(\s*crate\s*\)\s+)?enum\s+(\w+)/g;
    const implRegex = /\bimpl\s+(\w+)/g;

    let closestMatch: FoundType | undefined;
    let closestDistance = Infinity;

    const findClosestMatch = (regex: RegExp, type: 'struct' | 'enum' | 'impl_struct' | 'impl_enum') => {
        let match;
        while ((match = regex.exec(content))) {
            const distance = Math.abs(match.index - cursorOffset);
            if (distance < closestDistance) {
                closestDistance = distance;
                closestMatch = { name: match[1], type, position: match.index };
            }
        }
    };

    // Match against struct and enum declarations
    findClosestMatch(structRegex, 'struct');
    findClosestMatch(enumRegex, 'enum');

    // Match against impl blocks
    let match;
    while ((match = implRegex.exec(content))) {
        const name = match[1];
        const isStruct = structRegex.test(content.slice(0, match.index));
        const isEnum = enumRegex.test(content.slice(0, match.index));
        const type = isStruct ? 'impl_struct' : isEnum ? 'impl_enum' : 'impl_struct'; // Default to impl_struct
        const distance = Math.abs(match.index - cursorOffset);
        if (distance < closestDistance) {
            closestDistance = distance;
            closestMatch = { name, type, position: match.index };
        }
    }

    // Log for debugging purposes
    console.log(`Closest match: ${JSON.stringify(closestMatch)}`);

    return closestMatch;
}

export default findStructOrEnum;
