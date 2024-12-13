import * as vscode from 'vscode';
import { CodelensNotFound, handleUnexpectedError, NoActiveEditor, NoRelevantSymbol, RunnerNotFound, SymbolNotFound } from './errors';
import { log } from './logger';
import {  run } from './codelens';

export const cargoRunner = vscode.commands.registerCommand('cargo.runner', async () => {
    try {
        await run();
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