import * as vscode from 'vscode';
import getRelevantSymbol from './get_relevant_symbol';
import getCodelenses from './get_codelens';
import codelensExec from './codelens_exec';
import { CodelensNotFound, handleUnexpectedError, NoActiveEditor, NoRelevantSymbol, RunnerNotFound, SymbolNotFound } from './errors';
import { log } from './logger';

export const cargoRunner = vscode.commands.registerCommand('cargo.runner', async () => {
    try {
        const relevantSymbol = await getRelevantSymbol();
        const codelens = await getCodelenses(relevantSymbol);
        await codelensExec(codelens);
    } catch (error: unknown) {
        switch ((error as { name: string }).name) {
            case NoActiveEditor.name:
                log(NoActiveEditor.name, 'debug');
                break;
            case SymbolNotFound.name:
                log(SymbolNotFound.name, 'debug');
                break;
            case NoRelevantSymbol.name:
                log(NoRelevantSymbol.name, 'debug');
                break;
            case CodelensNotFound.name:
                log(CodelensNotFound.name, 'debug');
                break;
            case RunnerNotFound.name:
                log(RunnerNotFound.name, 'debug');
                break;
            default:
                handleUnexpectedError(error);
        }
    }
});