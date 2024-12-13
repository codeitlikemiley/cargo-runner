import * as vscode from 'vscode';
import * as path from 'path';
import { log } from './logger';
import { CodelensNotFound, handleUnexpectedError, RunnerNotFound } from './errors';
import { updateRustAnalyzerServerExtraENV } from './update_ra_server_extra_env';
import { nextestRunner, useCargoNextest } from './nextest';
import { getDocument } from './editor';
import { findCargoToml } from './cargo_manifest';
import { getBreakpoints, find_symbol } from './document_symbols';

export async function run(): Promise<void> {

	const relevantSymbol = await find_symbol();

	const codelens = await getLenses(relevantSymbol);

	log(`Fetching rust analyzer config`, 'debug');

	const config = vscode.workspace.getConfiguration("rust-analyzer");

	const { testLens, benchLens, isModule, runner } = codelensMetadata(codelens, relevantSymbol);

	if (!runner || runner.command?.title === undefined || runner.command?.arguments?.[0].args === undefined) {
		throw new RunnerNotFound("No Runner found");
	}

	let cargoTomlPath = findCargoToml();

	if (cargoTomlPath) {
		updateRustAnalyzerServerExtraENV(config, cargoTomlPath, runner);
		runner.command.arguments[0].args.workspaceRoot = path.dirname(cargoTomlPath);
	}

	if (await useCargoNextest()) {
		nextestRunner(runner, config, relevantSymbol, isModule, testLens, benchLens);
	}

	if (runner.command.title === benchLens && isModule) {
		runner.command.arguments[0].args.executableArgs = [];
	}

	log(`${runner.command.command} command: ${JSON.stringify(runner.command.arguments?.[0].args.cargoArgs)} ${JSON.stringify(runner.command.arguments?.[0].args.executableArgs)}`, 'debug');

	log(`arguments: ${JSON.stringify(runner.command.arguments)}`, 'debug');

	try {
		let output = await vscode.commands.executeCommand(runner.command.command ?? 'rust-analyzer.runSingle', ...(runner.command.arguments || []));
		if (output) {
			log(`output: ${JSON.stringify(output)}`, 'debug');
		}
	} catch (error: unknown) {
		handleUnexpectedError(error);
	}
}

async function getLenses(
	symbol: vscode.DocumentSymbol
): Promise<vscode.CodeLens[]> {
	const codelenses = await vscode.commands.executeCommand<vscode.CodeLens[]>(
		'vscode.executeCodeLensProvider',
		getDocument().uri
	);

	const symbolRelatedCodeLenses = codelenses.filter((lens) => {
		const lensStart = lens.range.start.line;
		const symbolStart = symbol.range.start.line;
		const symbolEnd = symbol.range.end.line;

		return lensStart >= symbolStart - 2 && lensStart <= symbolEnd;
	});

	if (symbolRelatedCodeLenses.length === 0) {
		log('Trying to get the file-level CodeLenses', 'debug');
		throw new CodelensNotFound("No Code lenses actions available");
	}

	log(`Found codelenses for symbol: ${symbol.name} \n ${JSON.stringify(symbolRelatedCodeLenses)}\n\n \t END of codelenses`, 'debug');

	return symbolRelatedCodeLenses;
}

interface CodelensMetadata {
	testLens: string;
	benchLens: string;
	isModule: boolean;
	runner: vscode.CodeLens | undefined;
}

function codelensMetadata(
	codeLenses: vscode.CodeLens[],
	nearestSymbol: vscode.DocumentSymbol,
): CodelensMetadata {
	const isModule = nearestSymbol?.kind === vscode.SymbolKind.Module || nearestSymbol?.kind === vscode.SymbolKind.Struct;

	const testLens = isModule ? '▶︎ Run Tests' : '▶︎ Run Test';
	const benchLens = '▶︎ Run Bench';
	const runLens = '▶︎ Run ';
	const docLens = '▶︎ Run Doctest';
	const debugLens = 'Debug';

	const run: vscode.CodeLens | undefined = codeLenses.find(lens => lens.command?.title === runLens);
	const bench: vscode.CodeLens | undefined = codeLenses.find(lens => lens.command?.title === benchLens);
	const test: vscode.CodeLens | undefined = codeLenses.find(lens => lens.command?.title === testLens);
	const doc: vscode.CodeLens | undefined = codeLenses.find(lens => lens.command?.title === docLens);
	const debuggable: vscode.CodeLens | undefined = codeLenses.find(lens => lens.command?.title === debugLens);

	const relevantBreakpoints = getBreakpoints(nearestSymbol);

	log(`Relevant breakpoints: ${JSON.stringify(relevantBreakpoints)}\n`, 'debug');
	log(`run: ${run?.command?.title}\n`, 'debug');
	log(`bench: ${bench?.command?.title}\n`, 'debug');
	log(`test: ${test?.command?.title}\n`, 'debug');
	log(`doc: ${doc?.command?.title}\n`, 'debug');
	log(`debuggable: ${debuggable?.command?.title}\n`, 'debug');

	const runner = relevantBreakpoints.length > 0 ? debuggable : run || test || doc || bench;

	log(`Current Runner is ${runner?.command?.title}\n`, 'debug');

	return {
		testLens,
		benchLens,
		isModule,
		runner
	};
}
