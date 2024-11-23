import * as vscode from 'vscode';
import vscodeConfig from './workspace_config';

export let globalOutputChannel: vscode.OutputChannel | null = null;

function getOutputChannel(): vscode.OutputChannel {
	if (!globalOutputChannel) {
		globalOutputChannel = vscode.window.createOutputChannel('cargo-runner');
	}
	return globalOutputChannel;
}

 function log(message: string, level: 'debug' | 'info' | 'error') {
	const outputChannel = getOutputChannel();
    let config = vscodeConfig();

	const logLevels = {
		'debug': 0,
		'info': 1,
		'error': 2
	};

	if (logLevels[level] >= logLevels[config.logLevel]) {
		outputChannel.appendLine(`[${level.toUpperCase()}] ${message}`);
	}
}

export {log , getOutputChannel};