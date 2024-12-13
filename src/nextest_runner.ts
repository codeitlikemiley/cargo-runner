import * as vscode from "vscode";
import { log } from "./logger";
import testSymbolPattern from "./test_symbol_pattern";
import handleCustomBench from "./handle_custom_bench";


export function nextestRunner(
	runner: vscode.CodeLens,
	config: vscode.WorkspaceConfiguration,
	nearestSymbol: vscode.DocumentSymbol,
	isModule: boolean,
	testLens: string,
	benchLens: string
) {
	if (runner?.command?.arguments?.[0].args && ( runner?.command?.title === testLens || runner?.command?.title === benchLens)) {
		runner.command.arguments[0].args.cargoArgs[0] = "run";
		runner.command.arguments[0].args.cargoArgs.unshift("nextest");

		let extraTestBinaryArgs = config.get<string[]>("runnables.extraTestBinaryArgs") || ["--nocapture"];
		log(`extraTestBinaryArgs ${JSON.stringify(extraTestBinaryArgs)}`, "debug");

		const testName = runner.command.arguments[0].args.executableArgs[0];
		log(`testName: ${testName}`, "debug");

		const testPattern = testSymbolPattern(nearestSymbol, testName, isModule);
		log(`: ${testPattern}`, "debug");

		let testParams = ["-E", testPattern];
		runner.command.arguments[0].args.cargoArgs.push(...testParams);

		handleCustomBench(runner);

		runner.command.arguments[0].args.executableArgs = [];

		const argsToFilter = ["--show-output", "--quiet", "--exact"];
		extraTestBinaryArgs = [...extraTestBinaryArgs.filter(arg => !argsToFilter.includes(arg))];

		runner.command.arguments[0].args.cargoArgs.push(...extraTestBinaryArgs);
	}

}