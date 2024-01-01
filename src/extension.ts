import * as vscode from 'vscode';
import { exec } from './exec';

export function activate(context: vscode.ExtensionContext) {
    context.subscriptions.push(vscode.commands.registerCommand('cargo-runner.exec', async () => {
		const editor = vscode.window.activeTextEditor;
		if (!editor) {
			vscode.window.showErrorMessage('No active editor found.');
			return;
		}
		const command = await exec();
		if (command) {
			let terminal = vscode.window.activeTerminal;
			if (!terminal) {
				terminal = vscode.window.createTerminal(`Cargo Run Terminal`);
			}
			terminal.sendText(command);
			terminal.show();
		} else {
			vscode.window.showInformationMessage('Cannot run.');
		}
	}));
}