import * as vscode from "vscode";
import { cargoRunner, getCargoRunnerConfig } from "./cargo_runner";
import { editProjectSettings } from "./edit_project_settings";
import { getOutputChannel, log } from "./logger";
import { checkRequiredExtentions } from "./requirements";
import { rustAnalyzerConfig } from "./rust_analyzer_config";
import { taskProvider } from "./task_runner";

export async function activate(context: vscode.ExtensionContext) {
  await checkRequiredExtentions();

  context.subscriptions.push(getOutputChannel());
  context.subscriptions.push(taskProvider);
  context.subscriptions.push(cargoRunner);
  context.subscriptions.push(rustAnalyzerConfig);
  context.subscriptions.push(editProjectSettings);
  context.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration(() => {
      log(JSON.stringify(getCargoRunnerConfig()), "debug");
    }),
  );
}

export function deactivate() {}
