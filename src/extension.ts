import * as vscode from 'vscode';

import checkRequiredExtentions from './check_required_extensions';
import { updateRustAnalyzerConfig } from './update_cargo_args';
import { cargoRunner } from './cargo-runner';
import { taskProvider } from './task-provider';
import { getOutputChannel, log } from './logger';
import workspaceConfig from './workspace_config';


export async function activate(context: vscode.ExtensionContext) {
	await checkRequiredExtentions();

	context.subscriptions.push(getOutputChannel());
	context.subscriptions.push(taskProvider);
	context.subscriptions.push(cargoRunner);
	context.subscriptions.push(updateRustAnalyzerConfig);
	context.subscriptions.push(vscode.workspace.onDidChangeConfiguration(() => {
		log(JSON.stringify(workspaceConfig()), 'debug');
	}));

}

export function deactivate() { }

