import { checkCrateType } from "./check_crate_type";
import { getPackage } from "./get_package";
import { getTestName } from "./get_test_name";
import { isFileInTestContext } from "./is_file_in_test_context";
import * as vscode from 'vscode';

async function tests(filePath: string, packageName: string | null, binName: string | null): Promise<string | null> {
    // Check if the file is in a test context
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        vscode.window.showErrorMessage('No active editor found.');
        return null;
    }
    const isInTestContext = await isFileInTestContext();
    if (!isInTestContext) {
        return null;
    }

    // Get the test name
    const testName = await getTestName(filePath);
    if (!testName) {
        return null;
    }

    // Check the crate type
    const crateType = await checkCrateType(filePath);
    if (crateType === 'bin' && binName) {
        // cargo test --package packageName --bin example -- tests::test_example --exact --nocapture 
        return `cargo test --package ${packageName} --bin ${binName} -- tests::${testName} --exact --nocapture`;
    } else if (crateType === 'lib') {
        // cargo test --package packageName --lib -- tests::test_example --exact --nocapture 
        return `cargo test --package ${packageName} --lib -- tests::${testName} --exact --nocapture`;
    }

    // For other crate types, return null
    return null;
}

export { tests };