import * as vscode from 'vscode';
import { NoActiveEditor } from './errors';
import { log } from './logger';

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
	try {
		const activeEditor = vscode.window.activeTextEditor;

		if (activeEditor) { return activeEditor.document.uri.fsPath; }

		log('No active editor found', 'debug');
		const workspaceFolder = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;

		if (workspaceFolder) {
			log(`Workspace folder found: ${workspaceFolder}`, 'debug');
			return workspaceFolder;
		}

		log('No workspace folder found, returning cwd', 'debug');
		return process.cwd();
	} catch (error) {
		log(`Error getting file path: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
		return process.cwd();
	}
}

export { cursorPosition, getDocument, getFilePath };