import * as fs from 'fs';
import * as path from 'path';
import * as vscode from "vscode";
import { cargoHome } from './cargo_manifest';
import { cargo_runner_config } from './cargo-runner';
import { log } from "./logger";
import handleCustomBench from "./handle_custom_bench";

function isCargoNextestEnabled() {
	return cargo_runner_config().nextest.enable;
}

export async function useCargoNextest(): Promise<boolean> {
	if (!isCargoNextestEnabled()) {
		return false;
	}
	const cargoNextestPath = path.join(cargoHome(), 'bin', 'cargo-nextest');
	return fs.existsSync(cargoNextestPath);
}

export function nextestRunner(
	runner: vscode.CodeLens,
	config: vscode.WorkspaceConfiguration,
	nearestSymbol: vscode.DocumentSymbol,
	isModule: boolean,
	testLens: string,
	benchLens: string
) {
	if (runner?.command?.arguments?.[0].args && (runner?.command?.title === testLens || runner?.command?.title === benchLens)) {
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

function testSymbolPattern(nearestSymbol: vscode.DocumentSymbol, testName: string, isModule: boolean): string {
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