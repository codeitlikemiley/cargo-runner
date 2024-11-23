import * as vscode from 'vscode';
import { getDocument, getFilePath } from './editor';
import { getSymbols } from './get_symbols';
import { log } from './logger';
import getRelevantBreakpoints from './get_relevant_breakpoints';
import isCargoNextestInstalled from './is_nextest_installed';

// TODO: unused
export default async function handleFileCodelens(): Promise<void> {

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