import * as vscode from 'vscode';
import { getDocument } from './editor';
import { cursorPosition } from "./editor";
import { NoRelevantSymbol } from "./errors";
import { log } from "./logger";
import resolveKind from './resolve_kind';
import { cargo_runner_config } from "./cargo-runner";
import { SymbolNotFound } from './errors';

export function getBreakpoints(symbol: vscode.DocumentSymbol): vscode.Breakpoint[] {
    return vscode.debug.breakpoints.filter(breakpoint => {
        if (breakpoint instanceof vscode.SourceBreakpoint) {
            const { location } = breakpoint;
            const { start, end } = symbol.range;

            return (
                location.uri.toString() === getDocument().uri.toString() &&
                location.range.start.isAfterOrEqual(start) &&
                location.range.end.isBeforeOrEqual(end)
            );
        }
        return false;
    });
}

export async function find_symbol(): Promise<vscode.DocumentSymbol> {
    const config = cargo_runner_config();
    const position = cursorPosition();
    const symbols = await getSymbols();

    const isPositionWithinRange = (pos: vscode.Position, range: vscode.Range) =>
        pos.isAfterOrEqual(range.start) && pos.isBeforeOrEqual(range.end);

    const isPositionInSymbol = (pos: vscode.Position, symbol: vscode.DocumentSymbol) =>
        isPositionWithinRange(pos, symbol.range) || isPositionWithinRange(pos, symbol.selectionRange);

    if (cargo_runner_config().logLevel === 'debug') {
        symbols.forEach(symbol => {
            log(`Symbol: ${symbol.name}, Kind: ${resolveKind(symbol)}, Range: (${symbol.range.start.line}-${symbol.range.end.line})`, 'debug');
            symbol.children.forEach(child => {
                log(`  Child: ${child.name}, Kind: ${resolveKind(child)}, Range: (${child.range.start.line}-${child.range.end.line})`, 'debug');
            });
        });
    }

    const filter_symbol = (symbols: vscode.DocumentSymbol[]): vscode.DocumentSymbol | null => {
        for (const symbol of symbols) {
            if (config.prioritySymbolKinds.includes(symbol.kind) && isPositionInSymbol(position, symbol)) {
                const childSymbol = filter_symbol(symbol.children);
                return childSymbol || symbol;
            }
        }
        return symbols.find(symbol => symbol.name === 'main') ?? null;
    };

    const relevantSymbol = filter_symbol(symbols);
    if (!relevantSymbol) { throw new NoRelevantSymbol('No relevant symbol found near the cursor'); }

    log(`Found nearest symbol: ${relevantSymbol.name}`, 'debug');
    return relevantSymbol;
}

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

