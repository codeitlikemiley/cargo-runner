import * as vscode from "vscode";
import { log } from "./logger";
import { readCargoRunnerSettings } from "./settings_handler";
import { runCargoTask } from "./task_runner";

/**
 * Ensures environment variables are applied to cargo commands
 * Provides fallback mechanisms when rust-analyzer doesn't handle env vars correctly
 *
 * @param runner The CodeLens with command information
 * @param fallbackToTask Whether to use task execution instead of rust-analyzer.runSingle
 * @returns The result of command execution
 */
export async function executeWithEnvironment(
  runner: vscode.CodeLens,
  fallbackToTask = false,
): Promise<unknown> {
  if (!runner.command?.arguments?.[0].args) {
    log("No arguments found in runner", "debug");
    return vscode.commands.executeCommand(
      runner.command?.command ?? "rust-analyzer.runSingle",
      ...(runner.command?.arguments || []),
    );
  }

  // Log the command that will be executed
  log(
    `Executing ${runner.command.command} with title: ${runner.command.title}`,
    "debug",
  );

  // Get environment variables
  const envVars = runner.command.arguments[0].args.env || {};

  // Use task execution if:
  // 1. We have environment variables AND fallbackToTask is true, OR
  // 2. User has explicitly set useTaskExecution to true
  if (
    (Object.keys(envVars).length > 0 && fallbackToTask) ||
    shouldUseTaskExecution()
  ) {
    log(
      `Using task execution with environment variables: ${JSON.stringify(envVars)}`,
      "debug",
    );

    const cargoArgs = runner.command.arguments[0].args.cargoArgs || [];
    const executableArgs =
      runner.command.arguments[0].args.executableArgs || [];
    const workspaceRoot = runner.command.arguments[0].args.workspaceRoot || "";
    const overrideCargo =
      runner.command.arguments[0].args.overrideCargo || "cargo";

    // Handle nextest integration specially
    const isNextest = cargoArgs.includes("nextest");

    if (isNextest) {
      log("Detected nextest integration, adjusting command structure", "debug");

      // When using nextest, the command structure is:
      // cargo nextest <command> <args> instead of cargo <command> <args>
      const nextestIndex = cargoArgs.indexOf("nextest");

      // Extract the cargo command part and nextest args
      const baseArgs = cargoArgs.slice(0, nextestIndex);
      const nextestCmd = cargoArgs[nextestIndex + 1] || "run"; // Default to "run" if not specified
      const nextestArgs = cargoArgs.slice(nextestIndex + 2);

      // Combine into a proper nextest command
      const combinedArgs = [...baseArgs, "nextest", nextestCmd, ...nextestArgs];

      // Execute as a task to ensure environment variables are applied
      return runCargoTask(
        overrideCargo,
        combinedArgs,
        envVars,
        workspaceRoot,
        `Cargo Runner: ${runner.command.title}`,
      );
    }
    // Standard cargo command
    // Execute as a task to ensure environment variables are applied
    return runCargoTask(
      overrideCargo,
      cargoArgs,
      envVars,
      workspaceRoot,
      `Cargo Runner: ${runner.command.title}`,
    );
  }

  // Otherwise, use standard rust-analyzer.runSingle command
  log(
    `Using standard execution${Object.keys(envVars).length ? " with env vars" : ""}`,
    "debug",
  );
  return vscode.commands.executeCommand(
    runner.command.command ?? "rust-analyzer.runSingle",
    ...(runner.command.arguments || []),
  );
}

/**
 * Check if the command should use a task execution instead of rust-analyzer.runSingle
 * This is useful if rust-analyzer doesn't handle environment variables correctly
 *
 * @returns True if task execution should be used, false otherwise
 */
export function shouldUseTaskExecution(): boolean {
  // Read settings to determine if we should use task execution
  const settings = readCargoRunnerSettings();

  // Check if we have a specific setting for this
  const useTaskExecution = settings?.runnables?.useTaskExecution;

  if (useTaskExecution !== undefined) {
    return useTaskExecution === true;
  }

  // Default behavior - auto-detect based on environment
  // If we have environment variables defined in settings, default to task execution
  return !!(
    settings?.runnables?.extraEnv &&
    Object.keys(settings.runnables.extraEnv).length > 0
  );
}
