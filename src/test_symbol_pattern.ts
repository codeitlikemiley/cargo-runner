import * as vscode from 'vscode';

export default function testSymbolPattern(nearestSymbol: vscode.DocumentSymbol, testName: string, isModule: boolean): string {
	if (isModule) {
		return `test(/^${nearestSymbol.name}::.*$/)`;
	}

	const symbolIndex = testName.lastIndexOf(nearestSymbol.name);
	if (symbolIndex === -1) {
		return `test(/^${testName}$/)`;
	}

	const pathUpToSymbol = testName.substring(0, symbolIndex + nearestSymbol.name.length);
	return `test(/^${pathUpToSymbol}$/)`;
}