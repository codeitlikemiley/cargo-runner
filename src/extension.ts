import * as vscode from 'vscode';
import exec from './exec';
import isDocTest from './is_doctest';

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
	context.subscriptions.push(vscode.commands.registerCommand('cargo-runner.doc-test', async () => {
		const activeEditor = vscode.window.activeTextEditor;
		if (activeEditor) {
			const filePath = activeEditor.document.uri.path;
			const position = vscode.window.activeTextEditor?.selection.active;


			const {  isValid, fnName } = await isDocTest(filePath, position);
			vscode.window.showInformationMessage(`Is on doc-test: ${isValid}, function name: ${fnName}`);

		}
	}));

}