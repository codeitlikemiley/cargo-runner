import * as vscode from 'vscode';
import { log } from './logger';

class SymbolNotFound extends Error {
	constructor(message: string) {
		super(message);
		this.name = 'SymbolNotFound';
	}
}

class NoRelevantSymbol extends Error {
	constructor(message: string) {
		super(message);
		this.name = 'NoRelevantSymbol';
	}
}

class CodelensNotFound extends Error {
	constructor(message: string) {
		super(message);
		this.name = 'CodelensNotFound';
	}
}

class NoActiveEditor extends Error {
	constructor(message: string) {
		super(message);
		this.name = 'NoActiveEditor';
	}
}

class RunnerNotFound extends Error {
	constructor(message: string) {
		super(message);
		this.name = 'RunnerNotFound';
	}
}

function handleUnexpectedError(error: unknown) {
	const errorMessage = error instanceof Error ? error.message : String(error);
	vscode.window.showErrorMessage(`Cargo Runner Error: ${errorMessage}`);
	log(`[ERROR] ${errorMessage}`, 'error');
}
export { SymbolNotFound, NoRelevantSymbol, CodelensNotFound, NoActiveEditor, RunnerNotFound, handleUnexpectedError };