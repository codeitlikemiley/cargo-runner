import * as vscode from 'vscode';
import { checkCrateType } from './check_crate_type';
import { getTestName } from './get_test_name';

async function cargoNextest(packageName: string, binName: string): Promise<string | null> {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        vscode.window.showErrorMessage('No active editor.');
        return null;
    }

    const filePath = editor.document.uri.fsPath;
    const crateType = await checkCrateType(filePath);
    const testFnName =  getTestName();

    // Determine if inside a test function
    let insideTestFunction = false;
    for (let i = 0; i < editor.document.lineCount; i++) {
        const lineText = editor.document.lineAt(i).text;
        if (lineText.includes("#[test]") || lineText.includes("#[tokio::test]")) {
            insideTestFunction = true;
            break;
        }
    }

    let cmd: string = '';

    if (insideTestFunction) {
        if (crateType === "bin") {
            cmd = `cargo nextest run -p ${packageName} --bin ${binName}`;
            if (testFnName) {
                cmd += ` -- tests::${testFnName}`;
            }
        } else if (crateType === "lib") {
            cmd = `cargo nextest run -p ${packageName}`;
            if (testFnName) {
                cmd += ` -- tests::${testFnName}`;
            }
        } else {
            vscode.window.showErrorMessage('Unsupported crate type for test context.');
            return null;
        }
    } else {
        vscode.window.showErrorMessage('Not inside a test function.');
        return null;
    }

    return cmd;
}

export { cargoNextest };
