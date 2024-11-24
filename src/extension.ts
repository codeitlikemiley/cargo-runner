import * as vscode from 'vscode';

import { CodelensNotFound, handleUnexpectedError, NoActiveEditor, NoRelevantSymbol, RunnerNotFound, SymbolNotFound, MissingExtension } from './errors';
import { CargoRunnerTaskProvider } from './tasks';
import { getOutputChannel, log } from './logger';
import codelensExec from './codelens_exec';
import getRelevantSymbol from './get_relevant_symbol';
import getCodelenses from './get_codelens';
import workspaceConfig from './workspace_config';
import checkRequiredExtentions from './check_required_extensions';

let config = workspaceConfig();

export async function activate(context: vscode.ExtensionContext) {

    await checkRequiredExtentions();

	const outputChannel = getOutputChannel();

	const taskProvider = vscode.tasks.registerTaskProvider(
		CargoRunnerTaskProvider.cargoType,
		new CargoRunnerTaskProvider()
	);

	const command = vscode.commands.registerCommand('cargo.runner', async () => {
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

	context.subscriptions.push(outputChannel);
	context.subscriptions.push(taskProvider);
	context.subscriptions.push(command);

	context.subscriptions.push(vscode.workspace.onDidChangeConfiguration(() => {
		config = workspaceConfig();
	}));


}

export function deactivate() { }