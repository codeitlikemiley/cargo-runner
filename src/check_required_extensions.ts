import * as vscode from 'vscode';
import { MissingExtension } from './errors';
import { log } from './logger';

let rustAnalyzerLoading = true;

function loadExtensions(): Promise<boolean> {
    return new Promise((resolve, reject) => {
        const rustAnalyzer = vscode.extensions.getExtension('rust-lang.rust-analyzer');
        const codeLLDB = vscode.extensions.getExtension('vadimcn.vscode-lldb');

        if (!rustAnalyzer?.isActive || !codeLLDB?.isActive) {
            let extensions: string[] = [];
            if (!rustAnalyzer) {
                extensions.push('rust-lang.rust-analyzer');
            }
            if (!codeLLDB) {
                extensions.push('vadimcn.vscode-lldb');
            }
            const message = `Missing extension${extensions.length > 1 ? 's' : ''}:\n ${extensions.join(' and ')}`;
            log(message, 'error');
            throw new MissingExtension(message);
        } else {
            resolve(false);
        }
    });
}

export default async function checkRequiredExtentions() {
    try {
        rustAnalyzerLoading = await loadExtensions();
    }
    catch (error: unknown) {
        if (error instanceof MissingExtension) {
            vscode.window.showErrorMessage(error.message);
            return;
        }
    }
}