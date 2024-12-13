import * as vscode from 'vscode';
import { getDocument } from './editor';


export  function getRelevantBreakpoints(symbol: vscode.DocumentSymbol): vscode.Breakpoint[] {
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
