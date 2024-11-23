import * as vscode from 'vscode';

import { CodelensNotFound, handleUnexpectedError, NoActiveEditor, NoRelevantSymbol, RunnerNotFound, SymbolNotFound } from './errors';
import { CargoRunnerTaskProvider } from './tasks';
import { log } from './logger';
import codelensExec from './codelens_exec';
import getRelevantSymbol from './get_relevant_symbol';
import getCodelenses from './get_codelens';
import workspaceConfig from './workspace_config';

let config = workspaceConfig();

export function activate(context: vscode.ExtensionContext) {
	log(`Activating cargo-runner`, 'debug');

	const taskProvider = vscode.tasks.registerTaskProvider(CargoRunnerTaskProvider.cargoType, new CargoRunnerTaskProvider());

	const command = vscode.commands.registerCommand('cargo.runner', async () => {
		try {
			const relevantSymbol = await getRelevantSymbol();
			const codelens = await getCodelenses(relevantSymbol);
			await codelensExec(codelens);
		} catch (error: unknown) {
			switch ((error as { name: string }).name) {
				case NoActiveEditor.name:
					log(NoActiveEditor.name, "debug");
					break;
				case SymbolNotFound.name:
					log(SymbolNotFound.name, "debug");
					break;
				case NoRelevantSymbol.name:
					log(NoRelevantSymbol.name, "debug");
					// await handleFileCodelens();
					break;
				case CodelensNotFound.name:
					//TODO: Perform Special Cases 
					// 1. If is a main.rs file, run the main function
					// 2. If is a lib.rs file, run all the tests
					// 3. If file is located in /src/bin/, run the main function
					// 4. If file is located in /examples/, run the main function
					// 5. If file is located in /tests/, run the tests
					// 6. If file is located in /benches/, run the benches

					log(CodelensNotFound.name, "debug");
					// below is an example of the special case for handing benchmarks functios with criterion
					// const criterion = await getBenchmark(getFilePath());
					// if (criterion) {
					// 	run_criterion(criterion);
					// }
					break;
				case RunnerNotFound.name:
					log(RunnerNotFound.name, "debug");
					break;
				default:
					handleUnexpectedError(error);
			}
		}
	});


	context.subscriptions.push(taskProvider);

	context.subscriptions.push(command);

	context.subscriptions.push(vscode.workspace.onDidChangeConfiguration(() => {
		config = workspaceConfig();
	}));
}

export function deactivate() {}