import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

export default function findCargoRunnerArgsToml(filePath: string) : string | null {
    let currentDir = path.dirname(filePath);
    const workspaceRoot = vscode.workspace.rootPath || process.cwd();
    let tomlPath = path.join(currentDir, '.cargo_runner.toml');
    while (!fs.existsSync(tomlPath)) {
        if (currentDir === workspaceRoot) {
            return null;
        }
        currentDir = path.dirname(currentDir);
        tomlPath = path.join(currentDir, '.cargo_runner.toml');
    }
    return tomlPath;
}
