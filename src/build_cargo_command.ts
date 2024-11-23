import * as vscode from 'vscode';
// TODO: Unused
function buildCargoCommand(args: any, isNextest: boolean, nearestSymbol: vscode.DocumentSymbol): string[] {
	const isTestCommand = args.cargoArgs?.includes('test') || args.cargoArgs?.includes('--test');
	const isDoctestCommand = args.cargoArgs?.includes('--doc');

	if (isTestCommand && isNextest && !isDoctestCommand) {
		const packageArgs = args.cargoArgs.slice(1);
		const testName = args.executableArgs?.[0];
		const isModuleTest = nearestSymbol?.kind === vscode.SymbolKind.Module;

		if (!testName) {
			return ['nextest', 'run', ...packageArgs, '--nocapture'];
		}

		const exactTestPattern = isModuleTest
			? `-E 'test(/^${testName}::.*$/)'`
			: `-E 'test(/^${testName}$/)'`;

		return ['nextest', 'run', exactTestPattern, ...packageArgs, '--nocapture'];
	}

	return [
		...args.cargoArgs,
		...(args.executableArgs?.length > 0 ? ['--', ...args.executableArgs] : [])
	];
}

export {buildCargoCommand};