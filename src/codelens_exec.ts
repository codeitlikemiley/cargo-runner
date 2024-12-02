import * as vscode from 'vscode';
import { log } from './logger';
import { handleUnexpectedError, RunnerNotFound } from './errors';
import getRelevantBreakpoints from './get_relevant_breakpoints';
import testSymbolPattern from './test_symbol_pattern';
import handleCustomBench from './handle_custom_bench';
import getRelevantSymbol from './get_relevant_symbol';
import isCargoNextestInstalled from './is_nextest_installed';

export default async function codelensExec(codeLenses: vscode.CodeLens[]): Promise<void> {
	log(`Fetching rust analyzer config`, 'debug');
	// NOTE: most of the rust-analyzer config are re-usable across all rust-analyzer commands
	const rustAnalyzerConfig = vscode.workspace.getConfiguration("rust-analyzer");

	const nearestSymbol = await getRelevantSymbol();
	const isModule = nearestSymbol?.kind === vscode.SymbolKind.Module || nearestSymbol?.kind === vscode.SymbolKind.Struct;

	let testLens = isModule ? '▶︎ Run Tests' : '▶︎ Run Test';
	let benchLens = '▶︎ Run Bench';
	let runLens = '▶︎ Run ';
	let docLens = '▶︎ Run Doctest';
	let debugLens = 'Debug';

	const run: vscode.CodeLens | undefined = codeLenses.find(lens => lens.command?.title === runLens);
	const bench: vscode.CodeLens | undefined = codeLenses.find(lens => lens.command?.title === benchLens);
	const test: vscode.CodeLens | undefined = codeLenses.find(lens => lens.command?.title === testLens);
	const doc: vscode.CodeLens | undefined = codeLenses.find(lens => lens.command?.title === docLens);
	const debuggable: vscode.CodeLens | undefined = codeLenses.find(lens => lens.command?.title === debugLens);
	const relevantBreakpoints = getRelevantBreakpoints(nearestSymbol);

	log(`Relevant breakpoints: ${JSON.stringify(relevantBreakpoints)}\n`, 'debug');
	log(`run: ${run?.command?.title}\n`, 'debug');
	log(`bench: ${bench?.command?.title}\n`, 'debug');
	log(`test: ${test?.command?.title}\n`, 'debug');
	log(`doc: ${doc?.command?.title}\n`, 'debug');
	log(`debuggable: ${debuggable?.command?.title}\n`, 'debug');

	const runner = run || test || doc || bench;

	log(`Current Runner is ${runner?.command?.title}\n`, 'debug');

	if (!runner) {
		throw new RunnerNotFound("No Runner found");
	}

	if (relevantBreakpoints.length > 0 && debuggable?.command?.title === 'Debug') {
		log(`Running Debugger on relevant breakpoint`, 'debug');
		// TODO: inject here our custom config if we have define one
		await vscode.commands.executeCommand(
			debuggable.command.command,
			...(debuggable.command.arguments || [])
		);
		return;
	}

	const isNextest = await isCargoNextestInstalled();

	if (isNextest && (runner.command?.title === testLens || runner.command?.title === benchLens) && runner.command.arguments?.[0]?.args && runner.command.arguments?.[0]?.args.cargoArgs) {
		// replace subcommand of `test` with `nextest run`
		runner.command.arguments[0].args.cargoArgs[0] = "run";
		runner.command.arguments[0].args.cargoArgs.unshift("nextest");

        // load extraArgs from config
		let extraTestBinaryArgs = rustAnalyzerConfig.get<string[]>("runnables.extraTestBinaryArgs") || ["--nocapture"];
		log(`extraTestBinaryArgs ${JSON.stringify(extraTestBinaryArgs)}`, "debug");

		// testname is always the first element in the executableArgs
		const testName = runner.command.arguments[0].args.executableArgs[0];
		log(`testName: ${testName}`, "debug");

        // correctly set the test pattern
		const testPattern = testSymbolPattern(nearestSymbol, testName, isModule);

		log(`: ${testPattern}`, "debug");
		let testParams = ["-E", testPattern];
        // add extra test binary args
		runner.command.arguments[0].args.cargoArgs.push(...testParams);
        
		// for nightly bench do custom handling
		handleCustomBench(runner);
	    // remove executable args as this is not supported by cargo-nextest	
		runner.command.arguments[0].args.executableArgs = [];
        
		// remove conflicting args from extraTestBinaryArgs only for cargo-nextest
		const argsToFilter = ["--show-output", "--quiet", "--exact"];
		extraTestBinaryArgs = [...extraTestBinaryArgs.filter(arg => !argsToFilter.includes(arg))];
        // add extraTestBinaryArgs to cargoArgs
		runner.command.arguments[0].args.cargoArgs.push(...extraTestBinaryArgs);
	}

	if (runner.command?.title === benchLens && isModule && runner.command.arguments?.[0]?.args) {
		runner.command.arguments[0].args.executableArgs = [];
	}

	log(`${runner?.command?.command} command: ${JSON.stringify(runner?.command?.arguments?.[0].args.cargoArgs)} ${JSON.stringify(runner?.command?.arguments?.[0].args.executableArgs)}`, 'debug');

	log(`arguments: ${JSON.stringify(runner?.command?.arguments)}`, 'debug');
	try {
		let output = await vscode.commands.executeCommand(runner?.command?.command ?? 'rust-analyzer.runSingle', ...(runner?.command?.arguments || []));
		if (output) {
			log(`output: ${JSON.stringify(output)}`, 'debug');
		}
	} catch (error: unknown) {
		handleUnexpectedError(error);
	}
}
