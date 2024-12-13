import { log } from "./logger";
import { getActiveToolchain, rustToolchainExists } from "./toolchain";
import * as vscode from "vscode";

export async function updateRustAnalyzerServerExtraENV(config: vscode.WorkspaceConfiguration, cargoTomlPath: string, runner: vscode.CodeLens, envKey: string = "RUSTUP_TOOLCHAIN"): Promise<void> {
    const serverEnv = { ...config.get<{ [key: string]: string }>("server.extraEnv") };

    if (rustToolchainExists(cargoTomlPath)) {
        let channel = await getActiveToolchain(cargoTomlPath);
        log(`channel: ${channel}`, 'debug');
        if (channel) {
            serverEnv[envKey] = channel as string;
            log(`rust-analyzer.server.extraEnv.${envKey} was set to ${channel}`, 'debug');
            runner!.command!.arguments![0].args.overrideCargo = `cargo +${channel}`;
            log(`overrideCargo was set to: ${runner!.command!.arguments![0].args.overrideCargo}`, 'debug');
            await config.update("server.extraEnv", serverEnv, vscode.ConfigurationTarget.Workspace);
        }
        else {
            log(`rust-analyzer.server.extraEnv.${envKey} was unset`, 'debug');
            delete serverEnv[envKey];
            await config.update("server.extraEnv", serverEnv, vscode.ConfigurationTarget.Workspace);
        }
    } else {
        log(`rust-analyzer.server.extraEnv.${envKey} was unset`, 'debug');
        delete serverEnv[envKey];
        await config.update("server.extraEnv", serverEnv, vscode.ConfigurationTarget.Workspace);
    }
}