import * as vscode from 'vscode';
import { NoActiveEditor } from './errors';

const activeEditor = vscode.window.activeTextEditor;

function getActiveEditor(): vscode.TextEditor {
	if (!activeEditor) {
		throw new NoActiveEditor('No active editor found');
	}
	return activeEditor;
}

function cursorPosition(): vscode.Position {
	return getActiveEditor().selection.active;
}

function getDocument(): vscode.TextDocument {
	return getActiveEditor().document;
}

function getFilePath(): string {
     return activeEditor?.document.uri.fsPath ?? vscode.workspace.workspaceFolders?.[0]?.uri.fsPath ?? process.cwd();	
}

export { getActiveEditor, cursorPosition, getDocument, getFilePath };