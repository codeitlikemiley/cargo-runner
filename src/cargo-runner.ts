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

interface CargoRunnerConfig {
	prioritySymbolKinds: vscode.SymbolKind[];
	logLevel: 'debug' | 'info' | 'error';
	cargoHome: string;
	nextest: {
		enable: boolean;
	};
}

export function cargo_runner_config(): CargoRunnerConfig {
	const config = vscode.workspace.getConfiguration('cargoRunner');
	const symbolKindMap: Record<string, vscode.SymbolKind> = {
		Module: vscode.SymbolKind.Module,
		Object: vscode.SymbolKind.Object,
		Struct: vscode.SymbolKind.Struct,
		Enum: vscode.SymbolKind.Enum,
		Function: vscode.SymbolKind.Function,
	};
	return {
		prioritySymbolKinds: config.get<string[]>('prioritySymbolKinds', ['Module', 'Object', 'Struct', 'Enum', 'Function']).map(kind => symbolKindMap[kind]),
		logLevel: config.get('logLevel', 'error'),
		cargoHome: config.get('cargoHome', ''),
		nextest: {
			enable: config.get('nextest.enable', false),
		},
	};
}