import * as vscode from 'vscode';
import { updateRustAnalyzerConfig } from './update_cargo_args';
import { cargo_runner_config, cargoRunner } from './cargo-runner';
import { getOutputChannel, log } from './logger';
import { taskProvider } from './tasks';
import { MissingExtension } from './errors';

let rustAnalyzerLoading = true;

export async function activate(context: vscode.ExtensionContext) {
	await checkRequiredExtentions();

	context.subscriptions.push(getOutputChannel());
	context.subscriptions.push(taskProvider);
	context.subscriptions.push(cargoRunner);
	context.subscriptions.push(updateRustAnalyzerConfig);
	context.subscriptions.push(vscode.workspace.onDidChangeConfiguration(() => {
		log(JSON.stringify(cargo_runner_config()), 'debug');
	}));

}

function loadExtensions(): Promise<boolean> {
	return new Promise((resolve, reject) => {
		const rustAnalyzer = vscode.extensions.getExtension('rust-lang.rust-analyzer');
		const codeLLDB = vscode.extensions.getExtension('vadimcn.vscode-lldb');

		if (!rustAnalyzer?.isActive || !codeLLDB?.isActive) {
			let extensions: string[] = [];
			if (!rustAnalyzer) {
				extensions.push('rust-lang.rust-analyzer');
			}
			if (!codeLLDB) {
				extensions.push('vadimcn.vscode-lldb');
			}
			const message = `Missing extension${extensions.length > 1 ? 's' : ''}:\n ${extensions.join(' and ')}`;
			log(message, 'error');
			throw new MissingExtension(message);
		} else {
			resolve(false);
		}
	});
}

async function checkRequiredExtentions() {
	try {
		setTimeout(async () => {
			rustAnalyzerLoading = await loadExtensions();
		}, 1000);
	}
	catch (error: unknown) {
		if (error instanceof MissingExtension) {
			vscode.window.showErrorMessage(error.message);
			return;
		}
	}
}

export function deactivate() { }

