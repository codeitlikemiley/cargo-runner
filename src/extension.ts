// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { getTestName } from './get_test_name';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
    let disposable = vscode.commands.registerCommand('cargo-runner.helloWorld', () => {
        const testName = getTestName();
        if (testName) {
            vscode.window.showInformationMessage(`Test function name: ${testName}`);
        } else {
            vscode.window.showInformationMessage('No test function name found.');
        }
    });

    context.subscriptions.push(disposable);
}

// This method is called when your extension is deactivated
export function deactivate() {}
