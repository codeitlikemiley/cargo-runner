import * as vscode from 'vscode';
import addArgsToToml from './add_args_to_toml';
import exec from './exec';

export function activate(context: vscode.ExtensionContext) {
	context.subscriptions.push(vscode.commands.registerCommand('cargo-runner.exec', async () => {
		const editor = vscode.window.activeTextEditor;
		if (!editor) {
			vscode.window.showErrorMessage('No active editor found.');
			return;
		}
		const breakpoints = vscode.debug.breakpoints;
		const analyzer = vscode.extensions.getExtension('rust-lang.rust-analyzer');
		const codelldb = vscode.extensions.getExtension('vadimcn.vscode-lldb');
		if (codelldb && analyzer && breakpoints.length > 0) {
		   return  vscode.commands.executeCommand('rust-analyzer.debug', editor.document.uri);
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
			let analyzer = vscode.extensions.getExtension('rust-lang.rust-analyzer');
			if (analyzer) {
				vscode.commands.executeCommand('rust-analyzer.run', editor.document.uri);
			}else {
                vscode.window.showErrorMessage('Please Install Rust Analyzer');
			}
		}
	}));

	context.subscriptions.push(vscode.commands.registerCommand('cargo-runner.addArgs', async () => {
		const editor = vscode.window.activeTextEditor;
		if (!editor) {
			vscode.window.showErrorMessage('No active editor found.');
			return;
		}

		let context: string | null | undefined = await vscode.window.showQuickPick(['run', 'test', 'bench', 'build', 'env'], {
			placeHolder: 'Choose what arguments context you would like to override.'
		}).then(async (context) => {
			if (context) {
				return context;
			}
		}
		);

		if (!context) {
			return;
		}
		// Open input box for user input
		const userInput = await vscode.window.showInputBox({
			prompt: `Enter your args e.g. [RUSTFLAGS="-Awarnings"] [--no-default-features --features <feature>]`,
			ignoreFocusOut: true
		});

		if (!userInput || userInput.trim() === "" || userInput === undefined || userInput === null) {
			// we should delete the whole context if no args are provided
			await addArgsToToml("", context);
		} else {
			// fill the context with the input
			await addArgsToToml(userInput, context);
		}
	}));
}