import * as vscode from 'vscode';
import * as path from 'node:path';
import { log } from './logger';
import { CodelensNotFound, handleUnexpectedError, RunnerNotFound } from './errors';
import { nextestRunner, useCargoNextest } from './nextest';
import { getDocument } from './editor';
import { findCargoToml } from './cargo_manifest';
import { getBreakpoints, find_symbol } from './document_symbols';
import serverExtraEnv from './rust_analyzer/server_extraEnv';
import { getMergedRustAnalyzerConfig, readCargoRunnerSettings } from './settings_handler';

export async function run(): Promise<void> {

	const relevantSymbol = await find_symbol();

	const codelens = await getLenses(relevantSymbol);

	log("Fetching rust analyzer config", 'debug');

	// Use merged configuration that combines VS Code settings with cargo-runner-settings.json
	const config = getMergedRustAnalyzerConfig();

	const { testLens, benchLens, isModule, runner } = codelensMetadata(codelens, relevantSymbol);

	if (!runner || runner.command?.title === undefined || runner.command?.arguments?.[0].args === undefined) {
		throw new RunnerNotFound("No Runner found");
	}

	const cargoTomlPath = findCargoToml();

	if (cargoTomlPath) {
		serverExtraEnv({ config, cargoTomlPath, runner });
		runner.command.arguments[0].args.workspaceRoot = path.dirname(cargoTomlPath);
		
		// Apply project-specific settings directly to the command arguments
		applyProjectSettings(runner, cargoTomlPath);
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
		const output = await vscode.commands.executeCommand(runner.command.command ?? 'rust-analyzer.runSingle', ...(runner.command.arguments || []));
		if (output) {
			log(`output: ${JSON.stringify(output)}`, 'debug');
		}
	} catch (error: unknown) {
		handleUnexpectedError(error);
	}
}

/**
 * Apply project-specific settings directly to the command arguments
 */
function applyProjectSettings(runner: vscode.CodeLens, cargoTomlPath: string): void {
	// Read project settings
	const projectSettings = readCargoRunnerSettings();
	if (!projectSettings) {
		return;
	}

	log("Applying project settings to command arguments", 'debug');

	// Apply cargo features
	if (projectSettings.cargo?.features?.length) {
		log(`Applying cargo features: ${projectSettings.cargo.features.join(',')}`, 'debug');
		let featuresAdded = false;

		// Check if there's already a --features flag, and append to it if found
		if (runner.command?.arguments?.[0].args.cargoArgs) {
			const cargoArgs = runner.command.arguments[0].args.cargoArgs as string[];
			const featuresIndex = cargoArgs.findIndex(arg => arg.startsWith('--features'));
			
			if (featuresIndex !== -1) {
				// There's already a --features flag, append our features
				const featuresArg = cargoArgs[featuresIndex];
				let existingFeatures = '';
				
				if (featuresArg === '--features') {
					// --features is separate from its value
					existingFeatures = cargoArgs[featuresIndex + 1] || '';
					
					// If there's existing features, combine them
					if (existingFeatures) {
						cargoArgs[featuresIndex + 1] = `${existingFeatures},${projectSettings.cargo.features.join(',')}`;
					} else {
						cargoArgs[featuresIndex + 1] = projectSettings.cargo.features.join(',');
					}
				} else {
					// --features=value format
					const match = featuresArg.match(/--features(?:=|\s)([^\s,]+(?:,[^\s,]+)*)/);
					if (match?.[1]) {
						existingFeatures = match[1];
						cargoArgs[featuresIndex] = `--features=${existingFeatures},${projectSettings.cargo.features.join(',')}`;
					}
				}
				
				featuresAdded = true;
			}
			
			// If features weren't added by modifying an existing flag, add a new one
			if (!featuresAdded) {
				cargoArgs.push('--features');
				cargoArgs.push(projectSettings.cargo.features.join(','));
			}
		}
	}

	// Apply noDefaultFeatures
	if (projectSettings.cargo?.noDefaultFeatures === true && runner.command?.arguments?.[0].args.cargoArgs) {
		const cargoArgs = runner.command.arguments[0].args.cargoArgs as string[];
		if (!cargoArgs.includes('--no-default-features')) {
			log("Adding --no-default-features flag", 'debug');
			cargoArgs.push('--no-default-features');
		}
	}

	// Apply target
	if (projectSettings.cargo?.target && runner.command?.arguments?.[0].args.cargoArgs) {
		const cargoArgs = runner.command.arguments[0].args.cargoArgs as string[];
		const targetIndex = cargoArgs.findIndex(arg => arg === '--target');
		
		if (targetIndex !== -1) {
			// Replace existing target
			cargoArgs[targetIndex + 1] = projectSettings.cargo.target;
		} else {
			// Add new target
			cargoArgs.push('--target');
			cargoArgs.push(projectSettings.cargo.target);
		}
		
		log(`Set target to ${projectSettings.cargo.target}`, 'debug');
	}

	// Apply runnables.extraArgs
	if (projectSettings.runnables?.extraArgs?.length && runner.command?.arguments?.[0].args.cargoArgs) {
		log(`Adding extra args: ${projectSettings.runnables.extraArgs.join(' ')}`, 'debug');
		const cargoArgs = runner.command.arguments[0].args.cargoArgs as string[];
		cargoArgs.push(...projectSettings.runnables.extraArgs);
	}

	// Apply runnables.extraTestBinaryArgs for tests
	if (projectSettings.runnables?.extraTestBinaryArgs?.length && 
		runner.command?.arguments?.[0].args.executableArgs && 
		runner.command.title?.includes('Test')) {
		log(`Adding extra test binary args: ${projectSettings.runnables.extraTestBinaryArgs.join(' ')}`, 'debug');
		
		// For nextest integration the executable args might be already cleared
		if (!runner.command.arguments[0].args.executableArgs.length) {
			// If integrated with nextest, these need to be added to cargoArgs instead
			if (runner.command.arguments[0].args.cargoArgs.includes('nextest')) {
				runner.command.arguments[0].args.cargoArgs.push(...projectSettings.runnables.extraTestBinaryArgs);
			}
		} else {
			runner.command.arguments[0].args.executableArgs.push(...projectSettings.runnables.extraTestBinaryArgs);
		}
	}

	// Apply runnables.extraEnv
	if (projectSettings.runnables?.extraEnv && Object.keys(projectSettings.runnables.extraEnv).length > 0) {
		log(`Setting environment variables: ${JSON.stringify(projectSettings.runnables.extraEnv)}`, 'debug');
		
		if (!runner.command?.arguments?.[0].args.env) {
			if (runner.command?.arguments?.[0]?.args) {
				runner.command.arguments[0].args.env = {};
			}
		}
		
		// Add or override environment variables
		if (runner.command?.arguments?.[0]?.args?.env) {
			Object.assign(runner.command.arguments[0].args.env, projectSettings.runnables.extraEnv);
		}
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