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
import handleDocAttribute from './handle_doc_attribute';
import handleDocTest from './handle_doc_test';
import handleMultilineDocTest from './handle_multiline_docs';
import getTestFunctionName from './get_fn_name';
import isInsideModTests from './is_inside_mod_test';
import { getBenchmark } from './get_benchmark';
import { findBenchmarkId } from './find_benchmark_id';
import findCargoRunnerArgsToml from './get_cargo_runner_args_config';
import getArgs from './get_args';
import { isIntegrationTest } from './is_integration_test';
import { findModuleName, getProjectModules } from './get_module_path';
import { isInsideExamples } from './is_inside_examples';

async function exec(): Promise<string | null> {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        console.log('No active file.');
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

    console.log(`----------------------------------------------------------`);
    console.log(`makefile_path: ${makefilePath || "nil"}`);
    console.log(`makefile_valid: ${makefileValid}`);
    console.log(`is_test_context: ${inTestContext}`);
    console.log(`crate_type: ${crateType || "nil"}`);
    console.log(`package_name: ${packageName || "nil"}`);
    console.log(`bin_name: ${binName || "nil"}`);
    console.log(`cargo runner args: ${cargo_runner_args || "nil"}`);

    console.log(`----------------------------------------------------------`);

    let cmd: string | null;
    let additionalArgs: string | null = null;

    const position = editor.selection.active;
    const currentLineText = editor.document.lineAt(position.line).text;

    if (currentLineText.includes("#[cfg(test)]")) {
        console.log('Current line contains #[cfg(test)], returning null.');
        return null;
    }
    const get_benchmark = await getBenchmark(filePath);
    if (get_benchmark) {
        const id = await findBenchmarkId();
        if (cargo_runner_args?.bench) {
            additionalArgs = cargo_runner_args?.bench;
        }
        if (id) {
            return `${prefix_env}cargo bench --package ${packageName} --bench ${get_benchmark} -- ${id} ${additionalArgs}`;
        }
        return `${prefix_env}cargo bench --package ${packageName} --bench ${get_benchmark}${additionalArgs ? ` ${additionalArgs}` : ''}`;
    }

    if (isIntegrationTest(filePath)) {
        const isNextestInstalled = await isCargoNextestInstalled();
        const testCommand = isNextestInstalled ? 'nextest run' : 'test';
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

        let commandArray = [];

        if (isNextestInstalled) {
            commandArray = [
                prefix_env ? `${prefix_env}cargo` : 'cargo',
                testCommand,
                `--test ${integrationTestName}`,
                `-E 'test(/^${testFunctionName}$/)'`,
                `--package ${packageName}`,
                additionalArgs
            ];
        } else {
            commandArray = [
               prefix_env ? `${prefix_env}cargo` : 'cargo',
                testCommand,
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
        if (cargo_runner_args?.run) {
            additionalArgs = cargo_runner_args?.run;
        }
        let commandArray = [];
        commandArray = [
            prefix_env ? `${prefix_env}cargo` : 'cargo',
            "run",
            packageName ? `--package ${packageName}` : '',
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

        let commandArray = [];

        if (isNextestInstalled) {
            commandArray = [
                `${prefix_env}cargo nextest run`,
                exampleArgs ? `${exampleArgs} -E 'test(/${testfnName}$/)' -p ${packageName}` : `-E 'test(/${testfnName}$/)' -p ${packageName}`,
                testCrateType,
                additionalArgs
            ];
        } else {
            commandArray = [
                `${prefix_env}cargo test`,
                `--package ${packageName}`,
                exampleArgs,
                testCrateType,
                '--',
                testfnName,
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
        console.log("Cannot run makefile for current opened file.");
        return null;
    }

    if (crateType === "bin") {
        if (cargo_runner_args?.run) {
            additionalArgs = cargo_runner_args?.run;
        }
        return `${prefix_env}cargo run -p ${packageName}${binName ? ` --bin ${binName}` : ""}${additionalArgs ? ` ${additionalArgs}` : ""}`;
    }
    if (crateType === "build") {
        if (cargo_runner_args?.build) {
            additionalArgs = cargo_runner_args?.build;
        }
        return `${prefix_env}cargo build -p ${packageName}${additionalArgs ? ` ${additionalArgs}` : ""}`;
    }
    const document = editor.document;
    const docAttributeResult = await handleDocAttribute(document, position);
    const docTestResult = await handleDocTest(document, position);
    const multilineDocsResult = await handleMultilineDocTest(document, position);
    // If any doc test function returns a valid function name, run the doc test
    if (cargo_runner_args?.doctest) {
        additionalArgs = cargo_runner_args?.doctest;
    }
    if (docAttributeResult?.isValid && docAttributeResult.fnName) {
        // follow this format cargo test --doc --package auth_service -- login
        return `${prefix_env}cargo test --doc --package ${packageName} -- ${docAttributeResult.fnName}${additionalArgs ? ` ${additionalArgs}` : ""}`;
    } else if (docTestResult.isValid && docTestResult.fnName) {
        return `${prefix_env}cargo test --doc --package ${packageName} -- ${docTestResult.fnName}${additionalArgs ? ` ${additionalArgs}` : ""}`;
    } else if (multilineDocsResult.isValid && multilineDocsResult.fnName) {
        return `${prefix_env}cargo test --doc --package ${packageName} -- ${multilineDocsResult.fnName}${additionalArgs ? ` ${additionalArgs}` : ""}`;
    }
    console.log("Cannot run cargo commands for current opened file.");
    return null;
}

export default exec;