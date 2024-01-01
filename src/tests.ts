import { checkCrateType } from "./check_crate_type";
import { getPackage } from "./get_package";
import { getTestName } from "./get_test_name";
import { isFileInTestContext } from "./is_file_in_test_context";
import * as vscode from 'vscode';

async function tests(filePath: string, binName: string | null): Promise<string | null> {
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
        // If it's a binary crate and a binName is provided, use --bin
        return `cargo test --bin ${binName} ${testName}`;
    } else if (crateType === 'lib') {
        // If it's a library crate, use the package name
        const packageName = await getPackage(filePath);
        return `cargo test --package ${packageName} ${testName}`;
    }

    // For other crate types, return null
    return null;
}

export { tests };