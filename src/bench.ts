import * as path from 'path';
import { log } from './logger'; 
import { getDocument } from './editor';
import * as vscode from 'vscode';
import { findCargoToml, parseCargoManifest } from './cargo_manifest';

export default function handleBenchTest(runner: vscode.CodeLens) {
	if (
		runner.command?.arguments?.[0]?.args?.cargoArgs?.includes('--test') &&
		runner.command?.title === "▶︎ Run Bench"
	) {
		const cargoTomlPath = findCargoToml();
		if (!cargoTomlPath) {
			log('Cargo.toml not found in the workspace root', 'debug');
			return;
		}

		const cargo = parseCargoManifest(cargoTomlPath ?? '');
		if (!cargo?.bench?.length) {
			log('No benches found in Cargo.toml', 'debug');
			return;
		}

		const currentFilePath = path.resolve(getDocument().uri.fsPath);
		const matchingBench = cargo.bench.find(bench => {
			const benchFilePath = path.resolve(
				path.isAbsolute(bench.path) ? bench.path : path.join(path.dirname(cargoTomlPath ?? ''), bench.path)
			);
			return benchFilePath === currentFilePath;
		});

		if (!matchingBench) {
			log(`No matching bench found for file: ${currentFilePath}`, 'debug');
			return;
		}

		const cargoArgs = runner.command?.arguments[0].args.cargoArgs;
		const testIndex = cargoArgs.indexOf('--test');
		if (testIndex !== -1) {
			cargoArgs.splice(testIndex, 2);
		}

		const packageIndex = cargoArgs.indexOf('--package');
		if (packageIndex !== -1) {
			cargoArgs.splice(packageIndex + 2, 0, '--bench', matchingBench.name);
		}

		log(`Selected bench: ${matchingBench.name}`, 'debug');
	}
}
