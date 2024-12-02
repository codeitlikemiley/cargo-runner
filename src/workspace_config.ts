import * as vscode from 'vscode';

interface CargoRunnerConfig {
	prioritySymbolKinds: vscode.SymbolKind[];
	logLevel: 'debug' | 'info' | 'error';
	cargoHome: string;
	nextest: {
		enable: boolean;
	};
}

export default function workspaceConfig(): CargoRunnerConfig {
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
