import * as vscode from 'vscode';
import { isRustScript, runRustScript } from './rust_file_script';
import parseUserInput from './parseUserInput';
import addArgsToToml from './add_args_to_toml';
import exec from './exec';

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

	context.subscriptions.push(vscode.commands.registerCommand('cargo-runner.addArgs', async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showErrorMessage('No active editor found.');
            return;
        }

		// Choose what arguments we would override
		// run, test, bench, doctest , build
		let context: string|null |undefined = await vscode.window.showQuickPick(['run', 'test', 'bench', 'doctest', 'build'], {
			placeHolder: 'Choose what arguments context you would like to override.'
		}).then(async (context) => {
			if (context) {
				return context;
			}
		}
		);

		if (!context) {
			vscode.window.showErrorMessage('No context selected.');
			return;
		}

        // Open input box for user input
        const userInput = await vscode.window.showInputBox({
            prompt: 'Enter your args (e.g., "--count=5 --verbose --name=cargo-runner")',
            ignoreFocusOut: true
        });

        if (!userInput || userInput.trim() === "" || userInput === undefined || userInput === null){
			// we should delete the whole context if no args are provided
			await addArgsToToml("", context);
        }else {
			// fill the context with the input
			await addArgsToToml(userInput, context);
		}
		
    }));
}