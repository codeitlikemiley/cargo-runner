import * as vscode from 'vscode';


class CargoRunnerTaskProvider implements vscode.TaskProvider {
	static cargoType: string = 'cargo-runner';

	provideTasks(): vscode.ProviderResult<vscode.Task[]> {
		// Define static tasks if needed
		return [];
	}

	resolveTask(_task: vscode.Task): vscode.Task | undefined {
		const command: string = _task.definition.command;
		const title: string = _task.definition.title;
		if (command) {
			const task = new vscode.Task(
				_task.definition,
				vscode.TaskScope.Workspace,
				title,
				'cargo-runner',
				new vscode.ShellExecution(command),
				'$rustc'
			);
			return task;
		}
		return undefined;
	}
}

// TODO: This would be used to run commands from Config
function createAndExecuteTask(command: string, args: string[]) {
	const fullCommand = [command, ...args].join(' ');
	const task = new vscode.Task(
		{ type: 'cargo-runner', command: fullCommand },
		vscode.TaskScope.Workspace,
		fullCommand,
		'cargo-runner',
		new vscode.ShellExecution(fullCommand),
		'$rustc'
	);
	vscode.tasks.executeTask(task);
}

export { CargoRunnerTaskProvider, createAndExecuteTask };