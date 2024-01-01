// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { getTestName } from './get_test_name';
import { isWorkspace } from './is_workspace';
import { getPackage } from './get_package';
import { getMakefile } from './get_makefile';
import { isFileInTestContext } from './is_file_in_test_context';
import { isMakefileValid } from './is_makefile_valid';
import { checkCrateType } from './check_crate_type';
import { getBin } from './get_bin';
import { cargoNextest } from './cargo_nextest';
import { get } from 'http';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
    context.subscriptions.push(vscode.commands.registerCommand('cargo-runner.getTestName', async () => {
        const testName = getTestName();
        vscode.window.showInformationMessage(`Test function name: ${testName || 'None'}`);
    }));

    context.subscriptions.push(vscode.commands.registerCommand('cargo-runner.isWorkspace', async () => {
        const result = await isWorkspace();
        vscode.window.showInformationMessage(`Is Workspace: ${result}`);
    }));

    // ... repeat for other functions like getPackage, getMakefile, etc.
    
    context.subscriptions.push(vscode.commands.registerCommand('cargo-runner.getPackage', async () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            const filePath = editor.document.uri.fsPath;
            const packageName = await getPackage(filePath);
            vscode.window.showInformationMessage(`Package Name: ${packageName || 'None'}`);
        }
    }));

	context.subscriptions.push(vscode.commands.registerCommand('cargo-runner.getMakefile', async () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            const filePath = editor.document.uri.fsPath;
            const makefilePath = await getMakefile(filePath);
            vscode.window.showInformationMessage(`Makefile Path: ${makefilePath || 'None'}`);
        }
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

    context.subscriptions.push(vscode.commands.registerCommand('cargo-runner.checkCrateType', async () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            const filePath = editor.document.uri.fsPath;
            const crateType = await checkCrateType(filePath);
            vscode.window.showInformationMessage(`Crate Type: ${crateType || 'None'}`);
        }
    }));

    context.subscriptions.push(vscode.commands.registerCommand('cargo-runner.isFileInTestContext', async () => {
        const isInTestContext = isFileInTestContext();
        vscode.window.showInformationMessage(`Is in Test Context: ${isInTestContext}`);
    }));

    context.subscriptions.push(vscode.commands.registerCommand('cargo-runner.getBin', async () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            const filePath = editor.document.uri.fsPath;
            const binName = await getBin(filePath);
            vscode.window.showInformationMessage(`Binary Name: ${binName || 'None'}`);
        }
    }));

	context.subscriptions.push(vscode.commands.registerCommand('cargo-runner.cargoNextest', async () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            const filePath = editor.document.uri.fsPath;
            // Assuming you have a way to determine the package and bin names. Update this as needed.
            const packageName = await getPackage(filePath) ?? '';
            const binName = await getBin(filePath) ?? '';

            const command = await cargoNextest(packageName, binName);
            if (command) {
                vscode.window.showInformationMessage(`Running command: ${command}`);
                // Optionally execute the command in a VS Code terminal here
            } else {
                vscode.window.showErrorMessage('Failed to construct the cargo nextest command.');
            }
        } else {
            vscode.window.showErrorMessage('No active Rust file.');
        }
    }));

    // Add similar command registrations for getMakefile, isMakefileValid, checkCrateType, isFileInTestContext, getBin
}

