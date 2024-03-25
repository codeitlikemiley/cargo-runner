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
import getModulePath from './get_module_path';
import { log } from 'console';
import { getBenchmark } from './get_benchmark';
import { findBenchmarkId } from './find_benchmark_id';
import findCargoRunnerArgsToml from './get_cargo_runner_args_config';
import getArgs from './get_args';
import buildArgs from './build_args';

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
    const isTestContext = await isFileInTestContext();
    const crateType = await checkCrateType(filePath);
    const packageName = await getPackage(filePath);
    const binName = await getBin(filePath);
    const make = await isMakeAvailable();
    const cargo_runner_args =  await getArgs(cargoRunnerArgsConfig);

    console.log(`----------------------------------------------------------`);
    console.log(`makefile_path: ${makefilePath || "nil"}`);
    console.log(`makefile_valid: ${makefileValid}`);
    console.log(`is_test_context: ${isTestContext}`);
    console.log(`crate_type: ${crateType || "nil"}`);
    console.log(`package_name: ${packageName || "nil"}`);
    console.log(`bin_name: ${binName || "nil"}`);
    console.log(`cargo runner args: ${cargo_runner_args || "nil"}`);
    
    console.log(`----------------------------------------------------------`);

    let cmd: string | null;
    let additionalArgs: string | null = null;

    const position = editor.selection.active;
    const currentLineText = editor.document.lineAt(position.line).text;
    // fix for isTestContext , avoid use to invoke command at this line
    if (currentLineText.includes("#[cfg(test)]")) {
        console.log('Current line contains #[cfg(test)], returning null.');
        return null;
    }
    const get_benchmark = await getBenchmark(filePath);
    if(get_benchmark){
        let id = await findBenchmarkId();
        if (cargo_runner_args?.bench) {
            additionalArgs =  buildArgs(cargo_runner_args?.bench);
        }
        if (id) {
            return `cargo bench --package ${packageName} --bench ${get_benchmark} -- ${id} ${additionalArgs}`;
        }
        return `cargo bench --package ${packageName} --bench ${get_benchmark} ${additionalArgs ? ` -- ${additionalArgs}` : ''}`;
    }


    if (isTestContext) {
        const isNextestInstalled = await isCargoNextestInstalled();
        const testCommand = isNextestInstalled ? 'nextest run' : 'test';

        const fnName = getTestFunctionName(editor.document, position);
        log(`fn_name: ${fnName}`);

        let exactCaptureOption;

        console.log('file path: ', filePath);
        let modulePath = path.basename(filePath, '.rs');
        if (modulePath === 'main' || modulePath === 'lib') {
            modulePath = '';
        } else {
            modulePath = getModulePath(filePath, packageName!, binName);
        }

        log(`modulepath: ${modulePath}`);

        let command = `cargo ${testCommand} --package ${packageName}`;
        const inModTestsContext = isInsideModTests(editor.document, position);

        if (crateType === 'bin' && binName) {
            command += ` --bin ${binName}`;
        } else if (crateType === 'lib') {
            command += ` --lib`;
        }

        if (fnName) {
            let testFnName = null;

            if (inModTestsContext) {
                if (fnName === "tests" || fnName === "tests::tests") {
                    log('running all test');
                    testFnName = modulePath ? `${modulePath}::tests` : "tests";
                    exactCaptureOption = '-- --nocapture';
                    console.log('IF: fn name is: ${fnName}');
                } else {
                    log('running specific test');
                    exactCaptureOption = isNextestInstalled ? '-- --nocapture' : '--exact --nocapture';
                    testFnName = modulePath ? `${modulePath}::tests::${fnName}` : `tests::${fnName}`;
                    console.log(`testFnName generated inModTestsContext: ${testFnName}`);

                }
            } else {
                log('running specific test outside mod test');
                exactCaptureOption = isNextestInstalled ? '-- --nocapture' : '--exact --nocapture';
                testFnName = modulePath ? `${modulePath}::${fnName}` : fnName;

                console.log(`testFnName generated standalone: ${testFnName}`);
            }

            command += ` -- ${testFnName} ${exactCaptureOption}`;
        } else {
            console.log('no fn name');
            exactCaptureOption = isNextestInstalled ? '-- --nocapture' : '--exact --nocapture';
            command += ` ${exactCaptureOption}`;
        }
        if (cargo_runner_args?.test) {
                additionalArgs =  buildArgs(cargo_runner_args?.test);
        }
        return command + (additionalArgs ? ` -- ${additionalArgs}` : '');
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
            additionalArgs =  buildArgs(cargo_runner_args?.run);
        }
        return `cargo run -p ${packageName}${binName ? ` --bin ${binName}` : ""}${additionalArgs ? ` -- ${additionalArgs}` : ""}`;
    }
    if (crateType === "build") {
        if (cargo_runner_args?.build) {
            additionalArgs =  buildArgs(cargo_runner_args?.build);
        }
        return `cargo build -p ${packageName}${additionalArgs ? ` -- ${additionalArgs}` : ""}`;
    }
    const document = editor.document;
    const docAttributeResult = await handleDocAttribute(document, position);
    const docTestResult = await handleDocTest(document, position);
    const multilineDocsResult = await handleMultilineDocTest(document, position);
    // If any doc test function returns a valid function name, run the doc test
    if (cargo_runner_args?.doctest){
        additionalArgs =  buildArgs(cargo_runner_args?.doctest);
    }
    if (docAttributeResult?.isValid && docAttributeResult.fnName) {
        // follow this format cargo test --doc --package auth_service -- login
        return `cargo test --doc --package ${packageName} -- ${docAttributeResult.fnName}${additionalArgs ? ` -- ${additionalArgs}` : ""}`;
    } else if (docTestResult.isValid && docTestResult.fnName) {
        return `cargo test --doc --package ${packageName} -- ${docTestResult.fnName}${additionalArgs ? ` -- ${additionalArgs}` : ""}`;
    } else if (multilineDocsResult.isValid && multilineDocsResult.fnName) {
        return `cargo test --doc --package ${packageName} -- ${multilineDocsResult.fnName}${additionalArgs ? ` -- ${additionalArgs}` : ""}`;
    }
    console.log("Cannot run cargo commands for current opened file.");
    return null;
}







export default exec;


