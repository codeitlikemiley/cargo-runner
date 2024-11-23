import * as vscode from 'vscode';
import { NoActiveEditor } from './errors';

function getActiveEditor(): vscode.TextEditor {
	const activeEditor = vscode.window.activeTextEditor;
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
	return getDocument().uri.fsPath;
}

export { getActiveEditor, cursorPosition, getDocument, getFilePath };