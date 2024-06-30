import * as vscode from 'vscode';
import { getMakefile } from './get_makefile';
import { isMakefileValid } from './is_makefile_valid';
import { isFileInTestContext } from './is_file_in_test_context';
import { checkCrateType } from './check_crate_type';
import { getPackage } from './get_package';
import { getBin } from './get_bin';
import { isCargoNextestInstalled } from './is_cargo_nextest_install';
import { isMakeAvailable } from './is_make_available';
import path from 'path';
import getTestFunctionName from './get_test_fn_name';
import isInsideModTests from './is_inside_mod_test';
import { getBenchmark } from './get_benchmark';
import { findBenchmarkId } from './find_benchmark_id';
import findCargoRunnerArgsToml from './get_cargo_runner_args_config';
import getArgs from './get_args';
import { isIntegrationTest } from './is_integration_test';
import { isInsideExamples } from './is_inside_examples';
import findModuleName from './find_module_name';

export default async function exec(): Promise<string | null> {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        return null;
    }

    const filePath = editor.document.uri.fsPath;
    const makefilePath = await getMakefile(filePath);
    const cargoRunnerArgsConfig = await findCargoRunnerArgsToml(filePath);
    const makefileValid = makefilePath ? isMakefileValid(makefilePath) : false;
    const inTestContext = await isFileInTestContext();
    const crateType = await checkCrateType(filePath);
    const packageName = await getPackage(filePath);
    const binName = await getBin(filePath);
    const make = await isMakeAvailable();
    const cargo_runner_args = await getArgs(cargoRunnerArgsConfig);
    const prefix_env = cargo_runner_args?.env ? `${cargo_runner_args.env} ` : '';

    const cmd = "cargo";
    let cargoCmd: string | null;
    let additionalArgs: string | null = null;
    let pkgArg = packageName ? `--package ${packageName}` : '';
    let commandArray = [];


    const position = editor.selection.active;
    const currentLineText = editor.document.lineAt(position.line).text;

    if (currentLineText.includes("#[cfg(test)]")) {
        return null;
    }
    const get_benchmark = await getBenchmark(filePath);
    if (get_benchmark) {
        const id = await findBenchmarkId();
        cargoCmd = "bench";
        let benchArg = `--bench ${get_benchmark}`;
        let idArg = id ? `-- ${id}` : '';

        if (cargo_runner_args?.bench) {
            additionalArgs = cargo_runner_args?.bench;
        }
        commandArray = [
            prefix_env,
            cmd,
            cargoCmd,
            pkgArg,
            benchArg,
            idArg,
            additionalArgs
        ];
        const finalCommand = commandArray.filter(Boolean).join(' ');

        return finalCommand;
    }

    if (isIntegrationTest(filePath)) {
        const isNextestInstalled = await isCargoNextestInstalled();
        cargoCmd = isNextestInstalled ? 'nextest run' : 'test';
        const integrationTestName = path.basename(filePath, '.rs');
        const fnName = getTestFunctionName(editor.document, position);
        const inModTestsContext = isInsideModTests(editor.document, position);

        if (cargo_runner_args?.test) {
            additionalArgs = cargo_runner_args?.test;
        }

        let default_args = isNextestInstalled ? "--nocapture" : "--exact --nocapture --show-output";
        additionalArgs = additionalArgs || default_args;

        let testFunctionName = fnName ? `tests::${fnName}` : '';
        if (!inModTestsContext) {
            testFunctionName = fnName || '';
        }

        if (isNextestInstalled) {
            commandArray = [
                prefix_env,
                cmd,
                cargoCmd,
                `--test ${integrationTestName}`,
                `-E 'test(/^${testFunctionName}$/)'`,
                pkgArg,
                additionalArgs
            ];
        } else {
            commandArray = [
                prefix_env,
                cmd,
                cargoCmd,
                `--package ${packageName}`,
                `--test ${integrationTestName}`,
                testFunctionName ? `-- ${testFunctionName}` : '',
                additionalArgs
            ];
        }

        const finalCommand = commandArray.filter(Boolean).join(' ');

        return finalCommand;
    }

    if (isInsideExamples(filePath) && !inTestContext) {
        let exampleArgs = `--example ${path.basename(filePath, '.rs')}`;
        cargoCmd = "run";
        if (cargo_runner_args?.run) {
            additionalArgs = cargo_runner_args?.run;
        }
        commandArray = [
            prefix_env,
            cmd,
            cargoCmd,
            pkgArg,
            exampleArgs,
            additionalArgs
        ];
        const finalCommand = commandArray.filter(Boolean).join(' ');
        return finalCommand;
    }

    if (inTestContext) {

        const isNextestInstalled = await isCargoNextestInstalled();

        const inModTestsContext = isInsideModTests(editor.document, position);

        let modulePath = findModuleName(filePath, inModTestsContext) || '';

        const fnName = getTestFunctionName(editor.document, position);

        let testfnName = fnName ? (modulePath ? `${modulePath}::${fnName}` : fnName) : '';

        let testCrateType = '';
        if (crateType === 'bin' && binName) {
            testCrateType = `--bin ${binName}`;
        } else if (crateType === 'lib') {
            testCrateType = `--lib`;
        }

        let exampleArgs = '';
        if (path.basename(path.dirname(filePath)) === 'examples') {
            exampleArgs = `--example ${path.basename(filePath, '.rs')}`;
        }

        if (cargo_runner_args?.test) {
            additionalArgs = cargo_runner_args?.test;
        }

        let default_args = isNextestInstalled ? "--nocapture" : "--exact --nocapture --show-output";
        additionalArgs = additionalArgs || default_args;

        if (isNextestInstalled) {
            cargoCmd = 'nextest run';
            commandArray = [
                prefix_env,
                cmd,
                cargoCmd,
                exampleArgs,
                testfnName ? `-E 'test(/^${testfnName}$/)'` : '',
                pkgArg,
                testCrateType,
                additionalArgs
            ];
        } else {
            cargoCmd = 'test';
            commandArray = [
                prefix_env,
                cmd,
                cargoCmd,
                pkgArg,
                exampleArgs,
                testCrateType,
                testfnName ? `-- ${testfnName}` : '',
                additionalArgs
            ];
        }

        const finalCommand = commandArray.filter(Boolean).join(' ');

        return finalCommand;
    }


    if (make && makefileValid) {
        const makefileDir = makefilePath ? path.dirname(vscode.Uri.parse(makefilePath).path) : '';
        if (crateType === "bin") {
            return `make -C ${makefileDir} run`;
        }
        if (crateType === "build") {
            return `make -C ${makefileDir} build`;
        }
        return null;
    }

    if (crateType === "bin") {
        if (cargo_runner_args?.run) {
            additionalArgs = cargo_runner_args?.run;
        }

        cargoCmd = "run";
        commandArray = [
            prefix_env,
            cmd,
            cargoCmd,
            pkgArg,
            binName ? `--bin ${binName}` : '',
            additionalArgs
        ];
        const finalCommand = commandArray.filter(Boolean).join(' ');

        return finalCommand;
    }
    if (crateType === "build") {
        if (cargo_runner_args?.build) {
            additionalArgs = cargo_runner_args?.build;
        }
        cargoCmd = "build";

        commandArray = [
            prefix_env,
            cmd,
            cargoCmd,
            pkgArg,
            additionalArgs
        ];

        const finalCommand = commandArray.filter(Boolean).join(' ');

        return finalCommand;
    }
    return null;
}
