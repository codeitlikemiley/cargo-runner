import * as vscode from 'vscode';
import exec from './exec';
import { isRustScript, runRustScript } from './rust_file_script';

export function activate(context: vscode.ExtensionContext) {
	context.subscriptions.push(vscode.commands.registerCommand('cargo-runner.exec', async () => {
		const editor = vscode.window.activeTextEditor;
		if (!editor) {
			vscode.window.showErrorMessage('No active editor found.');
			return;
		}
		let filePath = editor.document.uri.fsPath;
		// Check if the file is a rust script
		if (isRustScript(filePath)) {
			let rustScript = runRustScript(filePath);
			let terminal = vscode.window.activeTerminal;
			if (!terminal) {
				terminal = vscode.window.createTerminal(`Cargo Run Terminal`);
			}
			terminal.sendText(rustScript!); // we know it's not null
			terminal.show();
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