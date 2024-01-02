import * as vscode from 'vscode';
import exec from './exec';
import handleDocAttribute from './handle_doc_attribute';
import handleDocTest from './handle_doc_test';
import handleOptimizedDocTest from './handle_multiline_docs';



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
	// create subscription for getTestName
	context.subscriptions.push(vscode.commands.registerCommand('cargo-runner.test-doc-attr', async () => {
		const editor = vscode.window.activeTextEditor;
		if (!editor) {
			vscode.window.showInformationMessage('Open a document to test');
			return;
		}

		const document = editor.document;
		const position = editor.selection.active;

		const result = await handleDocAttribute(document, position);

		if (result) {
			vscode.window.showInformationMessage(`Doc attribute valid: ${result.isValid}, Function name: ${result.fnName}`);
		} else {
			vscode.window.showInformationMessage('Not in a doc attribute scope');
		}
	}
	));

	context.subscriptions.push(vscode.commands.registerCommand('cargo-runner.test-multiline-doc', async () => {
		const editor = vscode.window.activeTextEditor;
		if (!editor) {
			vscode.window.showInformationMessage('Open a document to test');
			return;
		}

		const document = editor.document;
		const position = editor.selection.active;

		const result = await handleOptimizedDocTest(document, position);

		if (result) {
			vscode.window.showInformationMessage(`Doc attribute valid: ${result.isValid}, Function name: ${result.fnName}`);
		} else {
			vscode.window.showInformationMessage('Not in Multiline Doc Scope');
		}
	}
	));

	
	context.subscriptions.push(vscode.commands.registerCommand('cargo-runner.doc-test', async () => {
		const editor = vscode.window.activeTextEditor;
		if (!editor) {
			vscode.window.showInformationMessage('Open a document to test');
			return;
		}
		const document = editor.document;
		const position = editor.selection.active;

		const result = await handleDocTest(document, position);

		if (result) {
			vscode.window.showInformationMessage(`Doc attribute valid: ${result.isValid}, Function name: ${result.fnName}`);
		} else {
			vscode.window.showInformationMessage('Not in a doc attribute scope');
		}
	}));

}