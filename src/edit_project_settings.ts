import * as vscode from "vscode";
import { showProjectSettingsSelector } from "./project_settings_manager";

export const editProjectSettings = vscode.commands.registerCommand(
  "cargo.project-settings.edit",
  async () => {
    await showProjectSettingsSelector();
  },
);
