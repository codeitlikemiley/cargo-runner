import { CargoRunnerConfig } from "./types";
import * as vscode from 'vscode';

export default function workspaceConfig(): CargoRunnerConfig {
	const config = vscode.workspace.getConfiguration('cargoRunner');
	const symbolKindMap: Record<string, vscode.SymbolKind> = {
		File: vscode.SymbolKind.File,
		Namespace: vscode.SymbolKind.Namespace,
		Package: vscode.SymbolKind.Package,
		Module: vscode.SymbolKind.Module,
		Interface: vscode.SymbolKind.Interface,
		Object: vscode.SymbolKind.Object,
		Class: vscode.SymbolKind.Class,
		Struct: vscode.SymbolKind.Struct,
		Enum: vscode.SymbolKind.Enum,
		Method: vscode.SymbolKind.Method,
		Function: vscode.SymbolKind.Function,
	};
	return {
		prioritySymbolKinds: config.get<string[]>('prioritySymbolKinds', ['File', 'Namespace', 'Package', 'Module', 'Interface', 'Object', 'Class', 'Struct', 'Enum', 'Method', 'Function']).map(kind => symbolKindMap[kind]),
		logLevel: config.get('logLevel', 'info')
	};
}
