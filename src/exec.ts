import * as vscode from 'vscode';
import { getMakefile } from './get_makefile';
import { isMakefileValid } from './is_makefile_valid';
import { isFileInTestContext } from './is_file_in_test_context';
import { checkCrateType } from './check_crate_type';
import { getPackage } from './get_package';
import { getBin } from './get_bin';
import { tests } from './tests';

async function exec(): Promise<string | null> {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        console.log('No active file.');
        return null;
    }

    const filePath = editor.document.uri.fsPath;
    const makefilePath = await getMakefile(filePath);
    const makefileValid = makefilePath ? isMakefileValid(makefilePath) : false; // Use isMakefileValid to check if the Makefile is valid
    const isTestContext = await isFileInTestContext();
    const crateType = await checkCrateType(filePath);
    const packageName = await getPackage(filePath) || vscode.workspace.name;
    const binName = await getBin(filePath);

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
        cmd = await tests(filePath ?? '', binName ?? '') ?? null;
    } else if (makefileValid) {
        const makefileDir = makefilePath ? vscode.Uri.parse(makefilePath).path : '';
        if (crateType === "bin") {
            cmd = `make -C ${makefileDir} run`;
        } else if (crateType === "build") {
            cmd = `make -C ${makefileDir} build`;
        } else {
            console.log("Cannot run makefile for current opened file.");
            return null;
        }
    } else {
        if (crateType === "bin") {
            cmd = `cargo run -p ${packageName}${binName ? ` --bin ${binName}` : ""}`;
        } else if (crateType === "build") {
            cmd = `cargo build -p ${packageName}`;
        } else {
            console.log("Cannot run cargo commands for current opened file.");
            return null;
        }
    }

    return cmd;
}

export { exec };
