import * as vscode from 'vscode';
import { getMakefile } from './get_makefile';
import { isMakefileValid } from './is_makefile_valid';
import { isFileInTestContext } from './is_file_in_test_context';
import { checkCrateType } from './check_crate_type';
import { getPackage } from './get_package';
import { getBin } from './get_bin';
import { tests } from './tests';
import { isCargoNextestInstalled } from './is_cargo_nextest_install';
import { isMakeAvailable } from './is_make_available';
import path from 'path';
import handleDocAttribute from './handle_doc_attribute';
import handleDocTest from './handle_doc_test';
import handleMultilineDocTest from './handle_multiline_docs';
import getTestFunctionName from './get_fn_name';
import isInsideModTests from './is_inside_mod_test';

async function exec(): Promise<string | null> {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        console.log('No active file.');
        return null;
    }

    const filePath = editor.document.uri.fsPath;
    const makefilePath = await getMakefile(filePath);
    const makefileValid = makefilePath ? isMakefileValid(makefilePath) : false;
    const isTestContext = await isFileInTestContext();
    const crateType = await checkCrateType(filePath);
    const packageName = await getPackage(filePath);
    const binName = await getBin(filePath);
    const make = await isMakeAvailable();

    console.log(`----------------------------------------------------------`);
    console.log(`makefile_path: ${makefilePath || "nil"}`);
    console.log(`makefile_valid: ${makefileValid}`);
    console.log(`is_test_context: ${isTestContext}`);
    console.log(`crate_type: ${crateType || "nil"}`);
    console.log(`package_name: ${packageName || "nil"}`);
    console.log(`bin_name: ${binName || "nil"}`);
    console.log(`----------------------------------------------------------`);

    let cmd: string | null;

    if (isTestContext) {
        const isNextestInstalled = await isCargoNextestInstalled();
        const testCommand = isNextestInstalled ? 'nextest run' : 'test';
        const exactCaptureOption = isNextestInstalled ? '-- --nocapture' : '--exact --nocapture';
        const position = editor.selection.active;
        const fnName = getTestFunctionName(editor.document, position);
        console.log(`fn_name: ${fnName}`);
    
        let filename = path.basename(filePath, '.rs');
        if (filename === 'main' || filename === 'lib') {
            filename = '';
        }
    
        let command = `cargo ${testCommand} --package ${packageName}`;
        if (crateType === 'bin' && binName) {
            command += ` --bin ${binName}`;
        } else if (crateType === 'lib') {
            command += ` --lib`;
        }
    
        if (fnName) {
            // If inside a 'mod tests' context, prepend filename
            const testFnName = isInsideModTests(editor.document, position.line) && filename ? `${filename}::${fnName}` : fnName;
            command += ` -- ${testFnName} ${exactCaptureOption}`;
        } else {
            command += ` ${exactCaptureOption}`;
        }
    
        return command;
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
        return `cargo run -p ${packageName}${binName ? ` --bin ${binName}` : ""}`;
    }
    if (crateType === "build") {
        return `cargo build -p ${packageName}`;
    }
    const document = editor.document;
    const position = editor.selection.active;
    const docAttributeResult = await handleDocAttribute(document, position);
    const docTestResult = await handleDocTest(document, position);
    const multilineDocsResult = await handleMultilineDocTest(document, position);
    // If any doc test function returns a valid function name, run the doc test
    if (docAttributeResult?.isValid && docAttributeResult.fnName) {
        // follow this format cargo test --doc --package auth_service -- login
        return `cargo test --doc --package ${packageName} -- ${docAttributeResult.fnName}`;
    } else if (docTestResult.isValid && docTestResult.fnName) {
        return `cargo test --doc --package ${packageName} -- ${docTestResult.fnName}`;
    } else if (multilineDocsResult.isValid && multilineDocsResult.fnName) {
        return `cargo test --doc --package ${packageName} -- ${multilineDocsResult.fnName}`;
    }
    console.log("Cannot run cargo commands for current opened file.");
    return null;
}

export default exec;