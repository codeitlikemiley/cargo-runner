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
import { getTestFunctionName } from './get_fn_name';

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
        const exactCaptureOption = isNextestInstalled ? '-- tests -- --nocapture' : '-- tests --nocapture';
        const position = editor.selection.active;
        const fnName = getTestFunctionName(editor.document, position);
        console.log(`fn_name: ${fnName}`)
        let filename = path.basename(filePath, '.rs');
        if (filename === 'main' || filename === 'lib') {
            filename = '';
        }

        const fileNameOrFilenameAndFnname = filename ? `${filename}::${fnName}` : fnName;
        if (crateType === 'bin') {
            // example output we need to follow:
            // cargo test --package multiplexer --bin multiplexer -- test_more --exact --nocapture
            // if main.rs we dont need the filename only the function name 
            const binCommandPart = binName ? ` --bin ${binName}` : "";
            return `cargo ${testCommand} --package ${packageName}${binCommandPart} -- ${fileNameOrFilenameAndFnname} ${exactCaptureOption}`;
        }
        if (crateType === 'lib') {
            // If no doc tests, run the regular test command
            // example command: cargo test --package libra --lib -- example::test_example --exact --nocapture 
            // we are missing the filenamehere  without .rs
            // we need to get the filename and the function name
            return `cargo ${testCommand} --package ${packageName} --lib -- ${fileNameOrFilenameAndFnname} ${exactCaptureOption}`;
        }
        return null;
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