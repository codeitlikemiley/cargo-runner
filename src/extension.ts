import * as vscode from 'vscode';
import { getCargoRunnerConfig, cargoRunner } from './cargo_runner';
import { getOutputChannel, log } from './logger';
import { taskProvider } from './task_runner';
import { rustAnalyzerConfig } from './rust_analyzer_config';
import { checkRequiredExtentions } from './requirements';

export async function activate(context: vscode.ExtensionContext) {
	await checkRequiredExtentions();

	context.subscriptions.push(getOutputChannel());
	context.subscriptions.push(taskProvider);
	context.subscriptions.push(cargoRunner);
	context.subscriptions.push(rustAnalyzerConfig);
	context.subscriptions.push(vscode.workspace.onDidChangeConfiguration(() => {
		log(JSON.stringify(getCargoRunnerConfig()), 'debug');
	}));
}

export function deactivate() { }

