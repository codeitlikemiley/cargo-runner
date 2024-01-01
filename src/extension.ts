import * as vscode from 'vscode';
import { getMakefile } from './get_makefile';
import { isMakefileValid } from './is_makefile_valid';
import { checkCrateType } from './check_crate_type';
import { isFileInTestContext } from './is_file_in_test_context';
import { getBin } from './get_bin';
import { getPackage } from './get_package';
import { getTestName } from './get_test_name';
import { cargoRun } from './cargo_run';
import { cargoNextest } from './cargo_nextest';

export function activate(context: vscode.ExtensionContext) {

	// add `cargo-runner.cargoNextest` command
	// add `cargo-runner.cargoNextest` command
	context.subscriptions.push(vscode.commands.registerCommand('cargo-runner.cargoNextest', async () => {
		const editor = vscode.window.activeTextEditor;
		if (!editor) {
			vscode.window.showErrorMessage('No active editor found.');
			return;
		}

		const filePath = editor.document.uri.fsPath;
		const packageName = await getPackage(filePath);
		const binName = await getBin(filePath);
		const command = await cargoNextest(filePath, binName);
		if (command) {
			vscode.window.showInformationMessage(`Command: ${command}`);
		} else {
			vscode.window.showInformationMessage('Not a test.');
		}
	}));



	context.subscriptions.push(vscode.commands.registerCommand('cargo-runner.checkCrateType', async () => {
		const editor = vscode.window.activeTextEditor;
		if (editor) {
			const filePath = editor.document.uri.fsPath;
			const crateType = await checkCrateType(filePath);
			vscode.window.showInformationMessage(`Crate Type: ${crateType || 'None'}`);
		}
	}));

	context.subscriptions.push(vscode.commands.registerCommand('cargo-runner.getBin', async () => {
		const editor = vscode.window.activeTextEditor;
		if (editor) {
			const filePath = editor.document.uri.fsPath;
			const binName = await getBin(filePath);
			vscode.window.showInformationMessage(`Binary Name: ${binName || 'None'}`);
		}
	}));

	context.subscriptions.push(vscode.commands.registerCommand('cargo-runner.getMakefile', async () => {
		const editor = vscode.window.activeTextEditor;
		if (!editor) {
			vscode.window.showErrorMessage('No active editor found.');
			return;
		}

		const filePath = editor.document.uri.fsPath;
		const makefilePath = await getMakefile(filePath);
		vscode.window.showInformationMessage(`Makefile Path: ${makefilePath || 'None'}`);
	}));

	context.subscriptions.push(vscode.commands.registerCommand('cargo-runner.getPackage', async () => {
		const editor = vscode.window.activeTextEditor;
		if (editor) {
			const filePath = editor.document.uri.fsPath;
			const packageName = await getPackage(filePath);
			vscode.window.showInformationMessage(`Package Name: ${packageName || 'None'}`);
		}
	}));

	context.subscriptions.push(vscode.commands.registerCommand('cargo-runner.getTestName', async () => {
		const editor = vscode.window.activeTextEditor;
		if (editor) {
			const filePath = editor.document.uri.fsPath;
			const testName = await getTestName(filePath);
			vscode.window.showInformationMessage(`Test Function Name: ${testName || 'None'}`);
		}
	}));

	context.subscriptions.push(vscode.commands.registerCommand('cargo-runner.isFileInTestContext', async () => {
		const editor = vscode.window.activeTextEditor;
		if (!editor) {
			vscode.window.showErrorMessage('No active editor found.');
			return;
		}
		const isInTestContext = await isFileInTestContext();
		vscode.window.showInformationMessage(`Is in Test Context: ${isInTestContext}`);
	}));

	context.subscriptions.push(vscode.commands.registerCommand('cargo-runner.isMakefileValid', async () => {
		const editor = vscode.window.activeTextEditor;
		if (editor) {
			const filePath = editor.document.uri.fsPath;
			const makefilePath = await getMakefile(filePath);
			const isValid = makefilePath ? isMakefileValid(makefilePath) : false;
			vscode.window.showInformationMessage(`Is Makefile Valid: ${isValid}`);
		}
	}));

	context.subscriptions.push(vscode.commands.registerCommand('cargo-runner.isWorkspace', () => {
		const isWorkspace = vscode.workspace.workspaceFolders !== undefined;
		vscode.window.showInformationMessage(`Is Workspace: ${isWorkspace}`);
	}
	));
}

export function deactivate() { }

