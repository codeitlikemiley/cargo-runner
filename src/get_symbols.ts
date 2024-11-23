import * as vscode from 'vscode';
import { SymbolNotFound } from './errors';
import { log } from './logger';
import { getDocument } from './editor';

async function getSymbols(): Promise<vscode.DocumentSymbol[]> {
	log(`Doc uri: ${getDocument().uri.toString()}`, 'debug');
	const symbols = await vscode.commands.executeCommand<vscode.DocumentSymbol[]>(
		'vscode.executeDocumentSymbolProvider',
		getDocument().uri
	) ?? [];

	if (symbols.length === 0) {
		throw new SymbolNotFound('No document symbols found');
	}
	log(`Document Symbols:\n ${JSON.stringify(symbols, null, 2)}\n`, 'debug');
	return symbols;
}

export {getSymbols};