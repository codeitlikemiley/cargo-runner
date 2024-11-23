import * as vscode from 'vscode';
import { MissingExtension } from './errors';

export default function checkRequirements(): Promise<void> {
    return new Promise((resolve, reject) => {
        const rustAnalyzer = vscode.extensions.getExtension('rust-lang.rust-analyzer');
        const codeLLDB = vscode.extensions.getExtension('vadimcn.vscode-lldb');

        if (!rustAnalyzer || !codeLLDB) {
            let extensions: string[] = [];
            if (!rustAnalyzer) {
                extensions.push('rust-lang.rust-analyzer');
            }
            if (!codeLLDB) {
                extensions.push('vadimcn.vscode-lldb');
            }
            const message = `Missing Extension(s): ${extensions.join(', ')}`;
            return reject(new MissingExtension(message));
        }

        resolve();
    });
}