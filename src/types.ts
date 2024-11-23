import * as vscode from 'vscode';

interface CargoRunnerConfig {
	prioritySymbolKinds: vscode.SymbolKind[];
	logLevel: 'debug' | 'info' | 'error';
}

export { CargoRunnerConfig };