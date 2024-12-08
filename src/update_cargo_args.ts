import * as vscode from 'vscode';
import fs from 'fs';
import { findCargoToml } from './find_cargo_toml';
import path from 'path';
import { CargoManifestNotFound, InvalidToolChain } from './errors';
import * as toml from '@iarna/toml';
import { isValidToolchain } from './toolchains';
import { removeChannel, updateChannel } from './rust-toolchain';
import { log } from './logger';


export const updateRustAnalyzerConfig = vscode.commands.registerCommand('cargo.rust-analyzer.config', async () => {
    const args = await vscode.window.showInputBox({
        prompt: 'Add or Remove Rust Analyzer Config'
    });
    if (args) {
        const argsArray = args.match(/(?:[^\s"]+|"[^"]*")+/g) || [];

        const extraArgs: string[] = [];
        const extraTestBinaryArgs: string[] = [];
        const features: Set<string> = new Set();
        const extraEnv: Record<string, string> = {};
        let cargoTarget: string | null | undefined;
        let noDefaultFeatures: boolean | undefined;
        let targetDir: boolean | undefined;
        let rustChannel: string | null = null;

        const config = vscode.workspace.getConfiguration('rust-analyzer');

        for (let i = 0; i < argsArray.length; i++) {
            const arg = argsArray[i];
            if (arg.startsWith("!")) {
                await resetConfig(arg, config);
            } else {
                if (arg.startsWith('--features')) {

                    const match = arg.match(/--features(?:=|\s)([^\s,]+(?:,[^\s,]+)*)/);

                    if (match && match[1]) {
                        const featureList = match[1].split(',');
                        featureList.forEach(feature => features.add(feature));
                    }

                } else if (arg.startsWith('--no-default-features')) {

                    const match = arg.match(/--no-default-features(?:=(true|false))?/);

                    if (match) {
                        noDefaultFeatures = match[1] === 'false' ? false : true;
                    } else {
                        noDefaultFeatures = true;
                    }

                } else if (arg.startsWith('--target')) {

                    const match = arg.match(/--target(?:=|\s)([^\s,]+(?:,[^\s,]+)*)/);
                    if (match && match[1]) {
                        cargoTarget = match[1].toString();
                    }
                } else if (arg.startsWith('--cargo-target-dir')) {

                    const match = arg.match(/--cargo-target-dir(?:=(true|false))?/);

                    if (match) {
                        targetDir = match[1] === 'false' ? false : true;
                    } else {
                        targetDir = true;
                    }

                }
                else if (/^[A-Z_]+=/.test(arg)) {
                    const [key, value] = arg.split('=');
                    extraEnv[key] = value;
                } else if (arg === '--') {
                    extraTestBinaryArgs.push(...argsArray.slice(i + 1));
                    break;
                } else if (arg.startsWith('+')) {
                    const potentialToolchain = arg.substring(1);
                    if (isValidToolchain(potentialToolchain)) {
                        log(`Setting rust channel to: ${potentialToolchain}`, 'debug');
                        rustChannel = potentialToolchain;
                    } else {
                        throw new InvalidToolChain(`Invalid toolchain was provided: ${potentialToolchain}`);
                    }
                }
                else {
                    extraArgs.push(arg);
                }
            }
        }

        if (rustChannel) {
            const cargoFilePath = findCargoToml();

            if (!cargoFilePath) { throw new CargoManifestNotFound('Cargo.toml file Not found'); }

            updateChannel(cargoFilePath, rustChannel);
        }

        if (features.size > 0) {
            await config.update('cargo.features', Array.from(features), vscode.ConfigurationTarget.Workspace);
        }
        if (noDefaultFeatures) {
            await config.update('cargo.noDefaultFeatures', noDefaultFeatures ?? false, vscode.ConfigurationTarget.Workspace);
        }
        if (targetDir) {
            await config.update('cargo.targetDir', targetDir, vscode.ConfigurationTarget.Workspace);
        }
        if (extraArgs.length > 0) {
            await config.update('runnables.extraArgs', extraArgs, vscode.ConfigurationTarget.Workspace);
        }
        if (extraTestBinaryArgs.length > 0) {
            await config.update('runnables.extraTestBinaryArgs', extraTestBinaryArgs, vscode.ConfigurationTarget.Workspace);
        }
        if (Object.keys(extraEnv).length > 0) {
            await config.update('runnables.extraEnv', extraEnv, vscode.ConfigurationTarget.Workspace);
        }
        if (cargoTarget) {
            await config.update('cargo.target', cargoTarget, vscode.ConfigurationTarget.Workspace);
        }
        vscode.window.showInformationMessage('Config Updated');
    }
});

const resetConfig = async (arg: string, config: vscode.WorkspaceConfiguration) => {
    switch (arg) {
        case "!channel":
            removeChannel();
            break;
        case "!features":
            await config.update('cargo.features', undefined, vscode.ConfigurationTarget.Workspace);
            await config.update('cargo.noDefaultFeatures', undefined, vscode.ConfigurationTarget.Workspace);
            vscode.window.showInformationMessage('cargo features reset');
            break;
        case "!target":
            await config.update('cargo.target', undefined, vscode.ConfigurationTarget.Workspace);
            vscode.window.showInformationMessage('cargo target reset');
            break;
        case "!targetDir":
            await config.update('cargo.targetDir', undefined, vscode.ConfigurationTarget.Workspace);
            vscode.window.showInformationMessage('cargo target reset');
            break;
        case "!env":
            await config.update('runnables.extraEnv', undefined, vscode.ConfigurationTarget.Workspace);
            vscode.window.showInformationMessage('cargo environment variables reset');
            break;
        case "!--":
            await config.update('runnables.extraTestBinaryArgs', undefined, vscode.ConfigurationTarget.Workspace);
            vscode.window.showInformationMessage('extra test binary args reset');
            break;
        default:
            await config.update('runnables.extraArgs', undefined, vscode.ConfigurationTarget.Workspace);
            vscode.window.showInformationMessage('cargo extra args reset');
    }
};
