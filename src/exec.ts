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
        cmd = await tests(filePath ?? '', packageName ?? '', binName ?? '') ?? null;
        if (cmd !== null) {
            return cmd;
        }
        if (crateType === 'bin') {
            return `cargo ${testCommand} --package ${packageName} --bin ${binName} ${exactCaptureOption}`;
        }
        if (crateType === 'lib') {
            return `cargo ${testCommand} --package ${packageName} --lib ${exactCaptureOption}`;
        }
        console.log("Cannot run cargo tests for the current opened file");
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
    console.log("Cannot run cargo commands for current opened file.");
    return null;
}

export default exec;