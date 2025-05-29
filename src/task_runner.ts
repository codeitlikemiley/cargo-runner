import * as vscode from "vscode";
import { log } from "./logger";

class CargoRunnerTaskProvider implements vscode.TaskProvider {
  static cargoType = "cargo-runner";

  provideTasks(): vscode.ProviderResult<vscode.Task[]> {
    // Define static tasks if needed
    return [];
  }

  resolveTask(_task: vscode.Task): vscode.Task | undefined {
    const command: string = _task.definition.command;
    const title: string = _task.definition.title || "Cargo Runner Task";
    const envVars: Record<string, string> = _task.definition.env || {};
    const cwd: string = _task.definition.cwd || "";

    if (command) {
      // Create shell execution with environment variables
      const shellOptions: vscode.ShellExecutionOptions = {
        env: envVars,
      };

      // Add working directory if specified
      if (cwd) {
        shellOptions.cwd = cwd;
      }

      const task = new vscode.Task(
        _task.definition,
        vscode.TaskScope.Workspace,
        title,
        "cargo-runner",
        new vscode.ShellExecution(command, shellOptions),
        "$rustc",
      );

      return task;
    }
    return undefined;
  }
}

export const taskProvider = vscode.tasks.registerTaskProvider(
  CargoRunnerTaskProvider.cargoType,
  new CargoRunnerTaskProvider(),
);

/**
 * Run a cargo command as a task with environment variables
 * This is an alternative to using rust-analyzer.runSingle when environment variables
 * are not being properly passed through the rust-analyzer command
 *
 * @param command The cargo command to run (usually 'cargo' or a toolchain override)
 * @param args The arguments to pass to cargo
 * @param env Environment variables to set
 * @param cwd Working directory for the command
 * @param title Optional title for the task
 * @returns The task execution
 */
export async function runCargoTask(
  command: string,
  args: string[] = [],
  env: Record<string, string> = {},
  cwd = "",
  title = "",
): Promise<vscode.TaskExecution> {
  // Build command string from command and arguments
  const fullCommand = [command, ...args].join(" ");
  const taskTitle = title || `Cargo Runner: ${command}`;

  log(`Running task: ${fullCommand}`, "debug");
  log(`With environment variables: ${JSON.stringify(env)}`, "debug");
  if (cwd) {
    log(`Working directory: ${cwd}`, "debug");
  }

  // Create shell execution options with environment variables
  const shellOptions: vscode.ShellExecutionOptions = {
    env: env,
  };

  // Add working directory if specified
  if (cwd) {
    shellOptions.cwd = cwd;
  }

  // Create and execute the task
  const task = new vscode.Task(
    {
      type: "cargo-runner",
      command: fullCommand,
      env: env,
      cwd: cwd,
      title: taskTitle,
    },
    vscode.TaskScope.Workspace,
    taskTitle,
    "cargo-runner",
    new vscode.ShellExecution(fullCommand, shellOptions),
    "$rustc",
  );

  return vscode.tasks.executeTask(task);
}

/**
 * Legacy function for backward compatibility
 */
export function task_run(command: string, args: string[]) {
  runCargoTask(command, args);
}
