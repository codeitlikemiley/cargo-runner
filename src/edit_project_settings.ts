import { showProjectSettingsSelector } from './project_settings_manager';
import * as vscode from 'vscode';

export const editProjectSettings = vscode.commands.registerCommand('cargo.project-settings.edit', async () => {
    await showProjectSettingsSelector();
});