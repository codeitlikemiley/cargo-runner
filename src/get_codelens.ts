import * as vscode from 'vscode';
import { getDocument } from './editor';
import { log } from './logger';
import { CodelensNotFound } from './errors';

export default async function getCodelenses(
    symbol: vscode.DocumentSymbol
): Promise<vscode.CodeLens[]> {
    const codelenses = await vscode.commands.executeCommand<vscode.CodeLens[]>(
        'vscode.executeCodeLensProvider',
        getDocument().uri
    );

    const symbolRelatedCodeLenses = codelenses.filter((lens) => {
        const lensStart = lens.range.start.line;
        const symbolStart = symbol.range.start.line;
        const symbolEnd = symbol.range.end.line;

        return lensStart >= symbolStart - 2 && lensStart <= symbolEnd;
    });

    if (symbolRelatedCodeLenses.length === 0) {
        log('Trying to get the file-level CodeLenses', 'debug');
        throw new CodelensNotFound("No Code lenses actions available");
    }

    log(`Found codelenses for symbol: ${symbol.name} \n ${JSON.stringify(symbolRelatedCodeLenses)}\n\n \t END of codelenses`, 'debug');

    return symbolRelatedCodeLenses;
}


