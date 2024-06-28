import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import * as toml from '@iarna/toml';
import { findCargoToml } from './find_cargo_toml';

export default async function addArgsToToml(field: string, context: string) {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        vscode.window.showErrorMessage('No active editor found.');
        return;
    }
    let cargoTomlPath =  findCargoToml(editor.document.uri.fsPath) ?? editor.document.uri.fsPath;

    let tomlPath = path.join(path.dirname(cargoTomlPath), '.cargo_runner.toml');
    
    let config: any;
    if (fs.existsSync(tomlPath)) {
        const tomlContent = fs.readFileSync(tomlPath, 'utf-8');
        config = toml.parse(tomlContent);
    } else {
        config = {};
    }

    if (field.length === 0) {
        // If no arguments are provided, remove the selected context from the TOML
        delete config[context];
        vscode.window.showInformationMessage(`Context '${context}' removed from .cargo_runner.toml.`);
    } else {
        // Replace existing args for the context with the new ones
        config[context] = field;
        vscode.window.showInformationMessage(`Arguments for context '${context}' updated in .cargo_runner.toml.`);
    }

    // Write the (updated or reduced) config back to .cargo_runner.toml
    fs.writeFileSync(tomlPath, toml.stringify(config));
}