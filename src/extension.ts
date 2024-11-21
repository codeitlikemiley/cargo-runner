import * as fs from 'fs';
import * as path from 'path';;
import * as vscode from 'vscode';

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

class NoRelevantSymbolError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'NoRelevantSymbolError';
    }
}



export function activate(context: vscode.ExtensionContext) {
	const taskProvider = vscode.tasks.registerTaskProvider(CargoRunnerTaskProvider.cargoType, new CargoRunnerTaskProvider());
	context.subscriptions.push(taskProvider);

	log('Starting Cargo Runner', 'debug');

	const command = vscode.commands.registerCommand('cargo.runner', async () => {
		try {
			log(`Loaded configuration: ${JSON.stringify(config)}`, 'debug');

			const activeEditor = vscode.window.activeTextEditor;
			if (!activeEditor) {
				showUserError('No active editor found!');
				return;
			}

			const document = activeEditor.document;
			const cursorPosition = activeEditor.selection.active;

			const documentSymbols = await safelyGetDocumentSymbols(document);
			if (!documentSymbols || documentSymbols.length === 0) {
				throw new NoRelevantSymbolError('No symbols found in the document');
			}
	
			const nearestSymbol = findNearestRelevantSymbol(documentSymbols, cursorPosition, config);
			if (!nearestSymbol) {
				throw new NoRelevantSymbolError('No relevant symbol found near the cursor');
			}
	
			log(`Nearest Relevant Symbol: ${nearestSymbol.name}`, 'debug');
	
			const symbolCodeLenses = await extractCodeLensesForSymbol(document, nearestSymbol);
			if (!symbolCodeLenses || symbolCodeLenses.length === 0) {
				throw new NoRelevantSymbolError(`No CodeLens actions found for symbol: ${nearestSymbol.name}`);
			}

			const uniqueCodeLenses = filterUniqueCodeLenses(symbolCodeLenses, nearestSymbol);
			const hasActiveBreakpoints = vscode.debug.breakpoints.length > 0;

			await executeAppropriateCodeLens(uniqueCodeLenses, hasActiveBreakpoints, nearestSymbol, document.uri);

			logCodeLensDetails(uniqueCodeLenses);
		} catch (error) {
			if (error instanceof NoRelevantSymbolError) {
				try {
					await handleFileCodeLenses(vscode.window.activeTextEditor!.document);
				} catch (fileCodeLensError) {
					handleUnexpectedError(fileCodeLensError);
				}
			} else {
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
	try {
		const allCodeLenses = await vscode.commands.executeCommand<vscode.CodeLens[]>(
			'vscode.executeCodeLensProvider',
			document.uri
		);

		if (!allCodeLenses) {
			return [];
		}

		const symbolRelatedCodeLenses = allCodeLenses.filter((lens) => {
			const lensStart = lens.range.start.line;
			const symbolStart = symbol.range.start.line;
			const symbolEnd = symbol.range.end.line;

			return lensStart >= symbolStart - 2 && lensStart <= symbolEnd;
		});

		return symbolRelatedCodeLenses;
	} catch (error) {
		log(`Error extracting CodeLenses: ${error}`, 'error');
		return [];
	}
}

async function handleFileCodeLenses(document: vscode.TextDocument): Promise<void> {
    log('Attempting to retrieve file-level CodeLenses', 'debug');

    const fileCodeLenses = await vscode.commands.executeCommand<vscode.CodeLens[]>(
        'vscode.executeCodeLensProvider',
        document.uri
    );

    log(`Total CodeLenses found: ${fileCodeLenses?.length || 0}`, 'debug');

    if (!fileCodeLenses || fileCodeLenses.length === 0) {
        showUserError('No file-level CodeLens actions found');
        return;
    }

    // Log all CodeLens details for debugging
    fileCodeLenses.forEach((lens, index) => {
        log(`CodeLens [${index}]:`, 'debug');
        log(`  - Title: ${lens.command?.title}`, 'debug');
        log(`  - Command: ${lens.command?.command}`, 'debug');
        log(`  - Line: ${lens.range.start.line}`, 'debug');
        log(`  - Arguments: ${JSON.stringify(lens.command?.arguments)}`, 'debug');
    });

    const fileTestAction = fileCodeLenses.find(lens => {
        const isFileTest = lens.range.start.line === 0 || lens.range.start.line === 1;
        const isTestAction = lens.command?.title.toLowerCase().includes('run test') ||
                             lens.command?.title.toLowerCase().includes('test');
        
        const isNotFunctionSpecific = !lens.command?.title.toLowerCase().includes('get_count') &&
                                      !lens.command?.title.toLowerCase().includes('doctest');
        
        return isFileTest && isTestAction && isNotFunctionSpecific;
    });

    if (!fileTestAction) {
        showUserError('No file-level test action available');
        return;
    }

    if (fileTestAction?.command?.arguments?.[0]?.args) {
        const args = fileTestAction.command.arguments[0].args;
        const isNextest = await isCargoNextestInstalled();

        const fileSymbol = new vscode.DocumentSymbol(
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

        const parsedArgs = buildCargoCommand(args, isNextest, fileSymbol);
        const cargoCommand = 'cargo';
        createAndExecuteTask(cargoCommand, parsedArgs);
    } else {
        showUserError('No file-level codelens action available');
    }
}

function filterUniqueCodeLenses(codeLenses: vscode.CodeLens[], relevantSymbol: vscode.DocumentSymbol): vscode.CodeLens[] {
    const seenCommands = new Set();
    const filteredCodeLenses: vscode.CodeLens[] = [];

    const isModuleSymbol = relevantSymbol.kind === vscode.SymbolKind.Module;

    let addedRunTest = false;
    let addedDebug = false;
    let addedDoctest = false;

    codeLenses.forEach((lens) => {
        if (lens.command && !seenCommands.has(lens.command.title)) {
            const commandTitle = lens.command.title.toLowerCase();

            const isWithinSymbolScope = 
                lens.range.start.line >= relevantSymbol.range.start.line &&
                lens.range.end.line <= relevantSymbol.range.end.line;

            if (isModuleSymbol) {
                if ((commandTitle.includes('run test') || commandTitle.includes('debug')) &&
                    (!addedRunTest || !addedDebug)) {
                    filteredCodeLenses.push(lens);
                    seenCommands.add(lens.command.title);
                    if (commandTitle.includes('run test')) { addedRunTest = true; }
                    if (commandTitle.includes('debug')) { addedDebug = true; }
                }
            } else {
                if (isWithinSymbolScope && 
                    (commandTitle.includes('run test') || commandTitle.includes('debug') || commandTitle.includes('doctest')) &&
                    (!addedRunTest || !addedDebug || !addedDoctest)) {
                    
                    filteredCodeLenses.push(lens);
                    seenCommands.add(lens.command.title);
                    if (commandTitle.includes('run test')) { addedRunTest = true; }
                    if (commandTitle.includes('debug')) { addedDebug = true; }
                    if (commandTitle.includes('doctest')) { addedDoctest = true; }
                }
            }
        }
    });

    return filteredCodeLenses;
}

async function executeAppropriateCodeLens(
	codeLenses: vscode.CodeLens[],
	hasBreakpoints: boolean,
	nearestSymbol: vscode.DocumentSymbol,
	documentUri: vscode.Uri
): Promise<void> {
	log(`Executing CodeLens actions for symbol: ${nearestSymbol.name}`, 'debug');
	log(`CodeLens actions: ${JSON.stringify(codeLenses)}`, 'debug');
	
	const debugAction = codeLenses.find(lens =>
		lens.command?.title.toLowerCase().includes('debug'));
	const testAction = codeLenses.find(lens =>
		lens.command?.title.toLowerCase().includes('run test'));
	const doctestAction = codeLenses.find(lens =>
		lens.command?.title.toLowerCase().includes('doctest'));
	const runAction = codeLenses.find(lens => 
		lens.command?.command === 'rust-analyzer.debugSingle' && 
		lens.command?.arguments?.[0]?.kind === 'cargo');

	try {
		if (hasBreakpoints && debugAction?.command) {
			const relevantBreakpoints = vscode.debug.breakpoints.filter(breakpoint => {
				if (breakpoint instanceof vscode.SourceBreakpoint) {
					const { location } = breakpoint;
					const { start, end } = nearestSymbol.range;

					return (
						location.uri.toString() === documentUri.toString() &&
						location.range.start.isAfterOrEqual(start) &&
						location.range.end.isBeforeOrEqual(end)
					);
				}
				return false;
			});

			if (relevantBreakpoints.length > 0 && debugAction?.command) {
				log(`Executing debug command for breakpoints within the nearest symbol's scope...`, 'debug');
				await vscode.commands.executeCommand(
					debugAction.command.command,
					...(debugAction.command.arguments || [])
				);
				return;
			} else {
				log(`No relevant breakpoints found within the nearest symbol's scope. Skipping debug.`, 'info');
			}
		}

		// Prioritize actions: test, doctest, or run
		const selectedAction = testAction || doctestAction || runAction;
		if (selectedAction?.command?.arguments?.[0]?.args) {
			const args = selectedAction.command.arguments[0].args;
			const isNextest = await isCargoNextestInstalled();
			const parsedArgs = buildCargoCommand(args, isNextest, nearestSymbol);

			const cargoCommand = 'cargo';
			log(`Executing cargo command: ${cargoCommand} ${parsedArgs.join(' ')}`, 'debug');
			createAndExecuteTask(cargoCommand, parsedArgs);
		} else {
			log(`No valid test, doctest, or run action found.`, 'info');
			showUserError('No valid action found');
		}
	} catch (error) {
		showUserError(`Error executing CodeLens action: ${error}`);
	}
}


function log(message: string, level: 'debug' | 'info' | 'error') {
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
	vscode.window.showErrorMessage(`Cargo Runner encountered an unexpected error: ${errorMessage}`);
	log(`[CRITICAL ERROR] ${errorMessage}`, 'error');
}

async function safelyGetDocumentSymbols(document: vscode.TextDocument): Promise<vscode.DocumentSymbol[] | null> {
	try {
		const symbols = await vscode.commands.executeCommand<vscode.DocumentSymbol[]>(
			'vscode.executeDocumentSymbolProvider',
			document.uri
		);
		return symbols || null;
	} catch (error) {
		log(`Failed to retrieve document symbols: ${error}`, 'error');
		return null;
	}
}

function findNearestRelevantSymbol(
	symbols: vscode.DocumentSymbol[],
	position: vscode.Position,
	config: CargoRunnerConfig
): vscode.DocumentSymbol | null {
	let relevantSymbol: vscode.DocumentSymbol | null = null;

	const isPositionWithinRange = (pos: vscode.Position, range: vscode.Range) =>
		pos.isAfterOrEqual(range.start) && pos.isBeforeOrEqual(range.end);

	const searchSymbolHierarchy = (symbols: vscode.DocumentSymbol[]) => {
		for (const symbol of symbols) {
			if (config.prioritySymbolKinds.includes(symbol.kind) &&
				isPositionWithinRange(position, symbol.range)) {
				relevantSymbol = symbol;
				if (symbol.children.length > 0) {
					searchSymbolHierarchy(symbol.children);
				}
				break;
			}
		}
	};

	searchSymbolHierarchy(symbols);
	return relevantSymbol;
}

function logCodeLensDetails(uniqueCodeLenses: vscode.CodeLens[]) {
	uniqueCodeLenses.forEach((lens, index) => {
		if (lens.command) {
			log(`[${index + 1}] ${lens.command.title} - ${lens.command.command}`, 'debug');
			if (lens.command.arguments) {
				log(`    Arguments: ${JSON.stringify(lens.command.arguments)}`, 'debug');
			}
		} else {
			log(`[${index + 1}] CodeLens command not resolved.`, 'debug');
		}
	});
}

export function deactivate() { }