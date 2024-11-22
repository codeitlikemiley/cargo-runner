import * as fs from 'fs';
import * as path from 'path';;
import * as vscode from 'vscode';
import { getBenchmark } from './get_benchmark';
import { findBenchmarkId } from './find_benchmark_id';
import { getPackage } from './get_package';
import { findCargoToml } from './find_cargo_toml';
import getCargoToml from './get_cargo_toml';

let globalOutputChannel: vscode.OutputChannel | null = null;

function getOutputChannel(): vscode.OutputChannel {
	if (!globalOutputChannel) {
		globalOutputChannel = vscode.window.createOutputChannel('cargo-runner');
	}
	return globalOutputChannel;
}

interface CargoRunnerConfig {
	prioritySymbolKinds: vscode.SymbolKind[];
	logLevel: 'debug' | 'info' | 'error';
}


class CargoRunnerTaskProvider implements vscode.TaskProvider {
	static cargoType: string = 'cargo-runner';

	provideTasks(): vscode.ProviderResult<vscode.Task[]> {
		// Define static tasks if needed
		return [];
	}

	resolveTask(_task: vscode.Task): vscode.Task | undefined {
		const command: string = _task.definition.command;
		const title: string = _task.definition.title;
		if (command) {
			const task = new vscode.Task(
				_task.definition,
				vscode.TaskScope.Workspace,
				title,
				'cargo-runner',
				new vscode.ShellExecution(command),
				'$rustc'
			);
			return task;
		}
		return undefined;
	}
}

function createAndExecuteTask(command: string, args: string[]) {
	const fullCommand = [command, ...args].join(' ');
	const task = new vscode.Task(
		{ type: 'cargo-runner', command: fullCommand },
		vscode.TaskScope.Workspace,
		fullCommand,
		'cargo-runner',
		new vscode.ShellExecution(fullCommand),
		'$rustc'
	);
	vscode.tasks.executeTask(task);
}

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


async function isCargoNextestInstalled(): Promise<boolean> {
	const cargoHome = process.env.CARGO_HOME;
	if (!cargoHome) {
		return false;
	}

	const cargoNextestPath = path.join(cargoHome, 'bin', 'cargo-nextest');
	return fs.existsSync(cargoNextestPath);
}

let config = loadConfiguration();

class SymbolNotFound extends Error {
	constructor(message: string) {
		super(message);
		this.name = 'SymbolNotFound';
	}
}

class NoRelatedSymbolFound extends Error {
	constructor(message: string) {
		super(message);
		this.name = 'NoRelatedSymbolFound';
	}
}


class CodelensNotFound extends Error {
	constructor(message: string) {
		super(message);
		this.name = 'CodelensNotFound';
	}
}

export function activate(context: vscode.ExtensionContext) {
	const taskProvider = vscode.tasks.registerTaskProvider(CargoRunnerTaskProvider.cargoType, new CargoRunnerTaskProvider());
	context.subscriptions.push(taskProvider);

	const command = vscode.commands.registerCommand('cargo.runner', async () => {
		const activeEditor = vscode.window.activeTextEditor;
		if (!activeEditor) {
			showUserError('No active editor found');
			return;
		}
		const document = activeEditor.document;
		const filepath = document.uri.fsPath;
		try {
			const cursorPosition = activeEditor.selection.active;

			const documentSymbols = await getSymbols(document);

			const nearestSymbol = findRelevantSymbol(documentSymbols, cursorPosition, config);

			const codelens = await extractCodeLensesForSymbol(document, nearestSymbol);

			await executeCodelens(codelens, nearestSymbol, document.uri);

		} catch (error) {
			if (error instanceof SymbolNotFound) {
				log('No document symbols found', 'debug');
			} else if (error instanceof NoRelatedSymbolFound) {
				await handleFileCodelens(document, filepath);
			} else if (error instanceof CodelensNotFound) {
				log('No CodeLens actions found for symbol', 'debug');
				const criterion = await getBenchmark(filepath);
				if (criterion) {
					run_criterion(criterion, document.uri.fsPath);
				}
			}
			else {
				handleUnexpectedError(error);
			}
		}
	});

	context.subscriptions.push(command);

	context.subscriptions.push(vscode.workspace.onDidChangeConfiguration(() => {
		config = loadConfiguration();
	}));

}

function loadConfiguration(): CargoRunnerConfig {
	const config = vscode.workspace.getConfiguration('cargoRunner');
	const symbolKindMap: Record<string, vscode.SymbolKind> = {
		File: vscode.SymbolKind.File,
		Module: vscode.SymbolKind.Module,
		Namespace: vscode.SymbolKind.Namespace,
		Package: vscode.SymbolKind.Package,
		Class: vscode.SymbolKind.Class,
		Method: vscode.SymbolKind.Method,
		Property: vscode.SymbolKind.Property,
		Field: vscode.SymbolKind.Field,
		Constructor: vscode.SymbolKind.Constructor,
		Enum: vscode.SymbolKind.Enum,
		Interface: vscode.SymbolKind.Interface,
		Function: vscode.SymbolKind.Function,
		Variable: vscode.SymbolKind.Variable,
		Constant: vscode.SymbolKind.Constant,
		String: vscode.SymbolKind.String,
		Number: vscode.SymbolKind.Number,
		Boolean: vscode.SymbolKind.Boolean,
		Array: vscode.SymbolKind.Array,
		Object: vscode.SymbolKind.Object,
		Key: vscode.SymbolKind.Key,
		Null: vscode.SymbolKind.Null,
		EnumMember: vscode.SymbolKind.EnumMember,
		Struct: vscode.SymbolKind.Struct,
		Event: vscode.SymbolKind.Event,
		Operator: vscode.SymbolKind.Operator,
		TypeParameter: vscode.SymbolKind.TypeParameter,
	};
	return {
		prioritySymbolKinds: config.get<string[]>('prioritySymbolKinds', ['Function', 'Module', 'Class']).map(kind => symbolKindMap[kind]),
		logLevel: config.get('logLevel', 'info')
	};
}


async function extractCodeLensesForSymbol(
	document: vscode.TextDocument,
	symbol: vscode.DocumentSymbol
): Promise<vscode.CodeLens[]> {
	const codelenses = await vscode.commands.executeCommand<vscode.CodeLens[]>(
		'vscode.executeCodeLensProvider',
		document.uri
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

function getRelevantBreakpoints(symbol: vscode.DocumentSymbol, documentUri: vscode.Uri): vscode.Breakpoint[] {
	return vscode.debug.breakpoints.filter(breakpoint => {
		if (breakpoint instanceof vscode.SourceBreakpoint) {
			const { location } = breakpoint;
			const { start, end } = symbol.range;

			return (
				location.uri.toString() === documentUri.toString() &&
				location.range.start.isAfterOrEqual(start) &&
				location.range.end.isBeforeOrEqual(end)
			);
		}
		return false;
	});
}

async function run_criterion(name: string, filePath: string) {

	const id = await findBenchmarkId();
	const packageName = await getPackage(filePath);
	let cargoCmd = "bench";
	let benchArg = `--bench ${name}`;
	let idArg = id ? `-- ${JSON.stringify(id)}` : '';
	let pkgArg = packageName ? `--package ${packageName}` : '';

	//TODO: pass here the additional args from config

	let commandArray = [];

	commandArray = [
		cargoCmd,
		pkgArg,
		benchArg,
		idArg,
		// additionalArgs,
	];
	log(`running command cargo: ${commandArray.join(' ')}`, 'debug');

	createAndExecuteTask("cargo", commandArray);

}

function getCurrentFileSymbol(): vscode.DocumentSymbol {
	return new vscode.DocumentSymbol(
		'File',
		'',
		vscode.SymbolKind.File,
		new vscode.Range(
			new vscode.Position(0, 0),
			new vscode.Position(Number.MAX_VALUE, Number.MAX_VALUE)
		),
		new vscode.Range(
			new vscode.Position(0, 0),
			new vscode.Position(Number.MAX_VALUE, Number.MAX_VALUE)
		)
	);

}


async function handleFileCodelens(document: vscode.TextDocument, filepath: string): Promise<void> {

	const fileCodeLenses = await vscode.commands.executeCommand<vscode.CodeLens[]>(
		'vscode.executeCodeLensProvider',
		document.uri
	);

	const currentFileSymbol = getCurrentFileSymbol();

	log(`Current File Symbol: ${JSON.stringify(currentFileSymbol)}`, 'debug');

	fileCodeLenses.forEach((lens, index) => {
		log(`CodeLens [${index}]:`, 'debug');
		log(`  - Title: ${lens.command?.title}`, 'debug');
		log(`  - Command: ${lens.command?.command}`, 'debug');
		log(`  - Line: ${lens.range.start.line}`, 'debug');
		log(`  - Arguments: ${JSON.stringify(lens.command?.arguments)}`, 'debug');
	});

	const fileTestAction = fileCodeLenses.find(lens => {
		const isTopLevelAction = lens.range.start.line === 0 || lens.range.start.line === 1;
		const isTest = lens.command?.title === '▶︎ Run Tests';
		const isRun = lens.command?.title === '▶︎ Run ';
		return isTopLevelAction && (isTest || isRun);
	});

	const debuggable = fileCodeLenses.find(lens => {
		const isTopLevelAction = lens.range.start.line === 0 || lens.range.start.line === 1;
		const isDebug = lens.command?.title === 'Debug';
		return isTopLevelAction && isDebug;
	});

	const relavantBreakpoints = getRelevantBreakpoints(currentFileSymbol, document.uri);

	if (relavantBreakpoints.length > 0 && debuggable?.command?.title === 'Debug') {
		log(`Running Debugger on relevant breakpoint`, 'debug');
		// TODO: inject here our custom config if we have define one
		await vscode.commands.executeCommand(
			debuggable.command.command,
			...(debuggable.command.arguments || [])
		);
		return;
	}


	const isNextest = await isCargoNextestInstalled();

	if (isNextest && fileTestAction?.command?.title === '▶︎ Run Tests' && fileTestAction?.command?.arguments?.[0]?.args && fileTestAction?.command?.arguments?.[0]?.args.cargoArgs) {
		fileTestAction.command.arguments[0].args.cargoArgs = fileTestAction.command.arguments[0].args.cargoArgs.slice(1);
		fileTestAction.command.arguments[0].args.cargoArgs.unshift('run');
		fileTestAction.command.arguments[0].args.cargoArgs.unshift('nextest');

		fileTestAction.command.arguments[0].args.cargoArgs.push("--nocapture");

		fileTestAction.command.arguments[0].args.executableArgs = [];
		// TODO: inject here our custom config if we have define one
		log(`cargo nextest command: ${JSON.stringify(fileTestAction.command.arguments[0].args.cargoArgs)}`, 'debug');
	}

	vscode.commands.executeCommand(fileTestAction?.command?.command ?? '', ...(fileTestAction?.command?.arguments || []));
}

async function executeCodelens(
	codeLenses: vscode.CodeLens[],
	nearestSymbol: vscode.DocumentSymbol,
	documentUri: vscode.Uri
): Promise<void> {

	const isModule = nearestSymbol?.kind === vscode.SymbolKind.Module;

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
	const relevantBreakpoints = getRelevantBreakpoints(nearestSymbol, documentUri);

	log(`Relevant breakpoints: ${JSON.stringify(relevantBreakpoints)}\n`, 'debug');
	log(`run: ${run?.command?.title}\n`, 'debug');
	log(`bench: ${bench?.command?.title}\n`, 'debug');
	log(`test: ${test?.command?.title}\n`, 'debug');
	log(`doc: ${doc?.command?.title}\n`, 'debug');
	log(`debuggable: ${debuggable?.command?.title}\n`, 'debug');

	const runner = run || test || doc || bench;

	log(`Current Runner is ${runner?.command?.title}\n`, 'debug');

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

	if (isNextest && (runner?.command?.title === testLens || runner?.command?.title === benchLens) && runner?.command?.arguments?.[0]?.args && runner?.command?.arguments?.[0]?.args.cargoArgs) {
		runner.command.arguments[0].args.cargoArgs = runner.command.arguments[0].args.cargoArgs.slice(1);
		runner.command.arguments[0].args.cargoArgs.unshift('run');
		runner.command.arguments[0].args.cargoArgs.unshift('nextest');

		const testName = runner.command.arguments[0].args.executableArgs[0];

		const testPattern = isModule
			? `test(/^${nearestSymbol.name}::.*$/)`
			: `test(/^${testName}$/)`;
        
		handleCustomBench(runner,documentUri,benchLens);

		runner.command.arguments[0].args.cargoArgs.push("-E");
		runner.command.arguments[0].args.cargoArgs.push(testPattern);
		runner.command.arguments[0].args.cargoArgs.push("--nocapture");

		runner.command.arguments[0].args.executableArgs = [];
		// TODO: inject here our custom config if we have define one

		log(`cargo nextest command: ${JSON.stringify(runner.command.arguments[0].args.cargoArgs)}`, 'debug');
	}

	if (runner?.command?.title === benchLens && isModule && runner?.command?.arguments?.[0]?.args) {
		runner.command.arguments[0].args.executableArgs = [];
	}

	vscode.commands.executeCommand(runner?.command?.command ?? 'rust-analyzer.runSingle', ...(runner?.command?.arguments || []));
}

function handleCustomBench(runner: vscode.CodeLens , documentUri: vscode.Uri, benchLens: string) {
	if (
		runner.command?.arguments?.[0]?.args?.cargoArgs?.includes('--test') &&
		runner.command?.title === benchLens
	) {
		const cargoTomlPath = findCargoToml(documentUri.fsPath);
		if (!cargoTomlPath) {
			log('Cargo.toml not found in the workspace root', 'debug');
			return;
		}

		const cargo = getCargoToml(cargoTomlPath ?? '');
		if (!cargo?.bench?.length) {
			log('No benches found in Cargo.toml', 'debug');
			return;
		}

		const currentFilePath = path.resolve(documentUri.fsPath);
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

export function log(message: string, level: 'debug' | 'info' | 'error') {
	const outputChannel = getOutputChannel();

	const logLevels = {
		'debug': 0,
		'info': 1,
		'error': 2
	};

	if (logLevels[level] >= logLevels[config.logLevel]) {
		outputChannel.appendLine(`[${level.toUpperCase()}] ${message}`);
	}
}

function showUserError(message: string) {
	vscode.window.showErrorMessage(message);
	log(`[ERROR] ${message}`, 'info');
}

function handleUnexpectedError(error: unknown) {
	const errorMessage = error instanceof Error ? error.message : String(error);
	vscode.window.showErrorMessage(`Cargo Runner Error: ${errorMessage}`);
	log(`[CRITICAL ERROR] ${errorMessage}`, 'error');
}

async function getSymbols(document: vscode.TextDocument): Promise<vscode.DocumentSymbol[]> {
	const symbols = await vscode.commands.executeCommand<vscode.DocumentSymbol[]>(
		'vscode.executeDocumentSymbolProvider',
		document.uri
	) ?? [];

	if (symbols.length === 0) {
		throw new SymbolNotFound('No document symbols found');
	}
	log(`Document Symbols: ${JSON.stringify(symbols)}`, 'debug');
	return symbols;
}

function findRelevantSymbol(
	symbols: vscode.DocumentSymbol[],
	position: vscode.Position,
	config: CargoRunnerConfig
): vscode.DocumentSymbol {
	const isPositionWithinRange = (pos: vscode.Position, range: vscode.Range) =>
		pos.isAfterOrEqual(range.start) && pos.isBeforeOrEqual(range.end);

	const findSymbol = (symbols: vscode.DocumentSymbol[]): vscode.DocumentSymbol | null => {
		for (const symbol of symbols) {
			if (config.prioritySymbolKinds.includes(symbol.kind) &&
				isPositionWithinRange(position, symbol.range)) {
				const childSymbol = findSymbol(symbol.children);
				return childSymbol || symbol;
			}
		}
		return null;
	};

	const relevantSymbol = findSymbol(symbols);
	if (!relevantSymbol) {
		throw new NoRelatedSymbolFound('No relevant symbol found near the cursor');
	}
	log(`Found nearest symbol: ${relevantSymbol.name}`, 'debug');
	return relevantSymbol;
}

export function deactivate() { }