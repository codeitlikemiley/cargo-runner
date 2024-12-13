import { cursorPosition } from "./editor";
import { NoRelevantSymbol } from "./errors";
import { getSymbols } from "./get_symbols";
import { log } from "./logger";
import * as vscode from 'vscode';
import workspaceConfig from "./workspace_config";
import resolveKind from './resolve_kind';

export async function getRelevantSymbol(): Promise<vscode.DocumentSymbol> {
	const config = workspaceConfig();
	const position = cursorPosition();
	const symbols = await getSymbols();

	const isPositionWithinRange = (pos: vscode.Position, range: vscode.Range) =>
		pos.isAfterOrEqual(range.start) && pos.isBeforeOrEqual(range.end);

	const isPositionInSymbol = (pos: vscode.Position, symbol: vscode.DocumentSymbol) =>
		isPositionWithinRange(pos, symbol.range) || isPositionWithinRange(pos, symbol.selectionRange);

	if (workspaceConfig().logLevel === 'debug') {
		symbols.forEach(symbol => {
			log(`Symbol: ${symbol.name}, Kind: ${resolveKind(symbol)}, Range: (${symbol.range.start.line}-${symbol.range.end.line})`, 'debug');
			symbol.children.forEach(child => {
				log(`  Child: ${child.name}, Kind: ${resolveKind(child)}, Range: (${child.range.start.line}-${child.range.end.line})`, 'debug');
			});
		});
	}

	const findSymbol = (symbols: vscode.DocumentSymbol[]): vscode.DocumentSymbol | null => {
		for (const symbol of symbols) {
			if (config.prioritySymbolKinds.includes(symbol.kind) && isPositionInSymbol(position, symbol)) {
				const childSymbol = findSymbol(symbol.children);
				return childSymbol || symbol;
			}
		}
		return symbols.find(symbol => symbol.name === 'main') ?? null;
	};

	const relevantSymbol = findSymbol(symbols);
	if (!relevantSymbol) { throw new NoRelevantSymbol('No relevant symbol found near the cursor'); }

	log(`Found nearest symbol: ${relevantSymbol.name}`, 'debug');
	return relevantSymbol;
}
