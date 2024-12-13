import { parse } from '@iarna/toml';
import * as fs from 'fs';
import { log } from './logger';
import { getFilePath } from './editor';
import * as vscode from 'vscode';
import * as path from 'path';
import * as os from 'os';
import { cargo_runner_config } from './cargo-runner';

export interface CargoToml {
    bench?: Array<{
        name: string;
        path: string;
    }>;
    package?: {
        name?: string;
    };
    bin?: Array<{
        name: string;
        path: string;
    }>;
    lib?: {
        name?: string;
        path?: string;
    };
}

export function findCargoToml(): string | null {
    let filePath = getFilePath();

    let currentDir = fs.lstatSync(filePath).isDirectory() ? filePath : path.dirname(filePath);
    const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || process.cwd();

    let cargoTomlPath = path.join(currentDir, 'Cargo.toml');

    while (!fs.existsSync(cargoTomlPath)) {
        if (currentDir === workspaceRoot || currentDir === process.cwd()) {
            return null;
        }
        currentDir = path.dirname(currentDir);
        cargoTomlPath = path.join(currentDir, 'Cargo.toml');
    }
    return cargoTomlPath;
}

export function parseCargoManifest(filePath: string): CargoToml | null {
    try {
        const cargoTomlContent = fs.readFileSync(filePath, 'utf-8');
        return parse(cargoTomlContent) as CargoToml;
    } catch (_) {
        log('failed to read Cargo.toml', 'debug');
        return null;
    }
}


export function cargoHome() {
    return cargo_runner_config().cargoHome || process.env.CARGO_HOME || path.resolve(os.homedir(), '.cargo');
}

