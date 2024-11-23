import * as fs from 'fs';
import * as path from 'path';;
import * as vscode from 'vscode';
import { getBenchmark } from './get_benchmark';
import { findBenchmarkId } from './find_benchmark_id';
import { getPackage } from './get_package';
import { findCargoToml } from './find_cargo_toml';
import getCargoToml from './get_cargo_toml';
import { get } from 'http';

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

class NoRelevantSymbol extends Error {
	constructor(message: string) {
		super(message);
		this.name = 'NoRelevantSymbol';
	}
}


class CodelensNotFound extends Error {
	constructor(message: string) {
		super(message);
		this.name = 'CodelensNotFound';
	}
}

class NoActiveEditor extends Error {
	constructor(message: string) {
		super(message);
		this.name = 'NoActiveEditor';
	}
}

function getActiveEditor(): vscode.TextEditor {
	const activeEditor = vscode.window.activeTextEditor;
	if (!activeEditor) {
		throw new NoActiveEditor('No active editor found');
	}
	return activeEditor;
}

function cursorPosition(): vscode.Position {
	return getActiveEditor().selection.active;
}

function getDocument(): vscode.TextDocument {
	return getActiveEditor().document;
}

function getFilePath(): string {
	return getDocument().uri.fsPath;
}

export function activate(context: vscode.ExtensionContext) {
	const taskProvider = vscode.tasks.registerTaskProvider(CargoRunnerTaskProvider.cargoType, new CargoRunnerTaskProvider());
	context.subscriptions.push(taskProvider);

	const command = vscode.commands.registerCommand('cargo.runner', async () => {
		try {
			const relevantSymbol = await getRelevantSymbol();
			const codelens = await getCodelenses(relevantSymbol);
			await executeCodelens(codelens);
		} catch (error: unknown) {
			if (typeof error === "object" && error !== null && "name" in error) {
				switch ((error as { name: string }).name) {
					case "NoRelatedSymbol":
						await handleFileCodelens();
						break;
					case "CodelensNotFound":
						const criterion = await getBenchmark(getFilePath());
						if (criterion) {
							run_criterion(criterion);
						}
						break;
					default:
						handleUnexpectedError(error);
				}
			} else {
				// Handle non-object or unexpected errors
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
		Namespace: vscode.SymbolKind.Namespace,
		Package: vscode.SymbolKind.Package,
		Module: vscode.SymbolKind.Module,
		Interface: vscode.SymbolKind.Interface,
		Object: vscode.SymbolKind.Object,
		Class: vscode.SymbolKind.Class,
		Struct: vscode.SymbolKind.Struct,
		Enum: vscode.SymbolKind.Enum,
		Method: vscode.SymbolKind.Method,
		Function: vscode.SymbolKind.Function,
	};
	return {
		prioritySymbolKinds: config.get<string[]>('prioritySymbolKinds', ['File', 'Namespace', 'Package', 'Module', 'Interface', 'Object', 'Class', 'Struct', 'Enum', 'Method', 'Function']).map(kind => symbolKindMap[kind]),
		logLevel: config.get('logLevel', 'info')
	};
}


async function getCodelenses(
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

function getRelevantBreakpoints(symbol: vscode.DocumentSymbol): vscode.Breakpoint[] {
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

async function run_criterion(name: string) {

	const id = await findBenchmarkId();
	const packageName = await getPackage(getFilePath());
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


async function handleFileCodelens(): Promise<void> {

	const fileCodeLenses = await vscode.commands.executeCommand<vscode.CodeLens[]>(
		'vscode.executeCodeLensProvider',
		getDocument().uri
	);

	const docsymbols = await getSymbols();

	const fileSymbol = docsymbols.find(symbol => {
		const isMainFile = getFilePath().endsWith('main.rs');
		const isBinFile = getFilePath().includes('/src/bin/');
		const isExampleFile = getFilePath().includes('/examples/');
		const isTestFile = getFilePath().includes('/tests/');

		if ((isMainFile || isBinFile || isExampleFile) && symbol.name === 'main' || isTestFile) {
			return true;
		}

		return false;
	});

	log(`Current File Symbol: ${JSON.stringify(fileSymbol)}`, 'debug');

	fileCodeLenses.forEach((lens, index) => {
		log(`CodeLens [${index}]:`, 'debug');
		log(`  - Title: ${lens.command?.title}`, 'debug');
		log(`  - Command: ${lens.command?.command}`, 'debug');
		log(`  - Line: ${lens.range.start.line}`, 'debug');
		log(`  - Arguments: ${JSON.stringify(lens.command?.arguments)}`, 'debug');
	});

	const fileTestAction = fileCodeLenses.find(lens => {
		const isTest = lens.command?.title === '▶︎ Run Tests';
		const isRun = lens.command?.title === '▶︎ Run ';
		const isMainFile = getFilePath().endsWith('main.rs');
		const isTestFile = getFilePath().includes('/tests/');
		const isExampleFile = getFilePath().includes('/examples/');
		const isBinFile = getFilePath().includes('/src/bin/');
		const isBecnhFile = getFilePath().includes('/benches/');

		// Only consider top-level actions in main.rs or integration test files
		return isRun && (isMainFile || isExampleFile || isBinFile) || (isTest && isTestFile) || (isBecnhFile);
	});

	const debuggable = fileCodeLenses.find(lens => {
		const isTopLevelAction = lens.range.start.line === 0 || lens.range.start.line === 1;
		const isDebug = lens.command?.title === 'Debug';
		return isTopLevelAction && isDebug;
	});

	if (!fileSymbol) {
		return;
	}

	const relavantBreakpoints = getRelevantBreakpoints(fileSymbol);

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

function buildTestPattern(nearestSymbol: vscode.DocumentSymbol, testName: string, isModule: boolean): string {
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

async function executeCodelens(
	codeLenses: vscode.CodeLens[],
): Promise<void> {

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
		throw new CodelensNotFound("No Code lenses actions available");
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
		runner.command.arguments[0].args.cargoArgs = runner.command.arguments[0].args.cargoArgs.slice(1);
		runner.command.arguments[0].args.cargoArgs.unshift('run');
		runner.command.arguments[0].args.cargoArgs.unshift('nextest');

		const testName = runner.command.arguments[0].args.executableArgs[0];

		log(`testName: ${testName}`, "debug");

		const testPattern = buildTestPattern(nearestSymbol, testName, isModule);

		log(`testPattern: ${testPattern}`, "debug");

		handleCustomBench(runner);

		runner.command.arguments[0].args.cargoArgs.push("-E");
		runner.command.arguments[0].args.cargoArgs.push(testPattern);
		runner.command.arguments[0].args.cargoArgs.push("--nocapture");

		runner.command.arguments[0].args.executableArgs = [];
		// TODO: inject here our custom config if we have define one

		log(`cargo nextest command: ${JSON.stringify(runner.command.arguments[0].args.cargoArgs)}`, 'debug');
	}

	if (runner.command?.title === benchLens && isModule && runner.command.arguments?.[0]?.args) {
		runner.command.arguments[0].args.executableArgs = [];
	}

	vscode.commands.executeCommand(runner?.command?.command ?? 'rust-analyzer.runSingle', ...(runner?.command?.arguments || []));
}

function handleCustomBench(runner: vscode.CodeLens) {
	if (
		runner.command?.arguments?.[0]?.args?.cargoArgs?.includes('--test') &&
		runner.command?.title === "▶︎ Run Bench"
	) {
		const cargoTomlPath = findCargoToml(getDocument().uri.fsPath);
		if (!cargoTomlPath) {
			log('Cargo.toml not found in the workspace root', 'debug');
			return;
		}

		const cargo = getCargoToml(cargoTomlPath ?? '');
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

function handleUnexpectedError(error: unknown) {
	const errorMessage = error instanceof Error ? error.message : String(error);
	vscode.window.showErrorMessage(`Cargo Runner Error: ${errorMessage}`);
	log(`[ERROR] ${errorMessage}`, 'error');
}



async function getSymbols(): Promise<vscode.DocumentSymbol[]> {
	log(`Doc uri: ${getDocument().uri.toString()}`, 'debug');
	const symbols = await vscode.commands.executeCommand<vscode.DocumentSymbol[]>(
		'vscode.executeDocumentSymbolProvider',
		getDocument().uri
	) ?? [];

	if (symbols.length === 0) {
		throw new SymbolNotFound('No document symbols found');
	}
	log(`Document Symbols: ${JSON.stringify(symbols)}`, 'debug');
	return symbols;
}

async function getRelevantSymbol(): Promise<vscode.DocumentSymbol> {
	const config = loadConfiguration();
	const position = cursorPosition();
	const symbols = await getSymbols();
	const isPositionWithinRange = (pos: vscode.Position, range: vscode.Range) =>
		pos.isAfterOrEqual(range.start) && pos.isBeforeOrEqual(range.end);

	const isPositionInSymbol = (pos: vscode.Position, symbol: vscode.DocumentSymbol) =>
		isPositionWithinRange(pos, symbol.range) || isPositionWithinRange(pos, symbol.selectionRange);

	symbols.forEach(symbol => {
		log(`Symbol: ${symbol.name}, Kind: ${symbol.kind}, Range: (${symbol.range.start.line}-${symbol.range.end.line})`, 'debug');
		symbol.children.forEach(child => {
			log(`  Child: ${child.name}, Kind: ${child.kind}, Range: (${child.range.start.line}-${child.range.end.line})`, 'debug');
		});
	});

	const findSymbol = (symbols: vscode.DocumentSymbol[]): vscode.DocumentSymbol | null => {
		for (const symbol of symbols) {
			if (config.prioritySymbolKinds.includes(symbol.kind) && isPositionInSymbol(position, symbol)) {
				const childSymbol = findSymbol(symbol.children);
				return childSymbol || symbol;
			}
		}
		return symbols.find(symbol => symbol.name === 'main') ?? null;
	};


	const relevantSymbol = findSymbol(symbols);
	if (!relevantSymbol) { throw new NoRelevantSymbol('No relevant symbol found near the cursor'); }

	log(`Found nearest symbol: ${relevantSymbol.name}`, 'debug');
	return relevantSymbol;
}


export function deactivate() { }