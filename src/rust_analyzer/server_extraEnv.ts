import * as vscode from "vscode";
import { log } from "../logger";
import {
  readCargoRunnerSettings,
  updateCargoRunnerSetting,
} from "../settings_handler";
import { getActiveToolchain, rustToolchainExists } from "../toolchain";

export default async function serverExtraEnv({
  config,
  cargoTomlPath,
  runner,
  envKey = "RUSTUP_TOOLCHAIN",
}: {
  config: vscode.WorkspaceConfiguration;
  cargoTomlPath: string;
  runner: vscode.CodeLens;
  envKey?: string;
}): Promise<void> {
  // Check if we have project-specific settings
  const projectSettings = readCargoRunnerSettings();
  const useProjectSettings = !!projectSettings;

  // Get the server.extraEnv from either source
  const serverEnv: Record<string, string> = {
    ...(config.get<Record<string, string>>("server.extraEnv") || {}),
  };

  if (rustToolchainExists(cargoTomlPath)) {
    const channel = await getActiveToolchain(cargoTomlPath);
    log(`channel: ${channel}`, "debug");
    if (channel) {
      serverEnv[envKey] = channel;
      log(
        `rust-analyzer.server.extraEnv.${envKey} was set to ${channel}`,
        "debug",
      );

      // Type assertion is necessary here since we know the command structure
      const cmdArgs = runner.command?.arguments?.[0] as {
        args: { overrideCargo: string };
      };
      cmdArgs.args.overrideCargo = `cargo +${channel}`;

      log(`overrideCargo was set to: ${cmdArgs.args.overrideCargo}`, "debug");

      // Update the appropriate settings source
      if (useProjectSettings) {
        updateCargoRunnerSetting("server", "extraEnv", serverEnv);
      } else {
        await config.update(
          "server.extraEnv",
          serverEnv,
          vscode.ConfigurationTarget.Workspace,
        );
      }
    } else {
      log(`rust-analyzer.server.extraEnv.${envKey} was unset`, "debug");
      delete serverEnv[envKey];

      if (useProjectSettings) {
        updateCargoRunnerSetting("server", "extraEnv", serverEnv);
      } else {
        await config.update(
          "server.extraEnv",
          serverEnv,
          vscode.ConfigurationTarget.Workspace,
        );
      }
    }
  } else {
    log(`rust-analyzer.server.extraEnv.${envKey} was unset`, "debug");
    delete serverEnv[envKey];

    if (useProjectSettings) {
      updateCargoRunnerSetting("server", "extraEnv", serverEnv);
    } else {
      await config.update(
        "server.extraEnv",
        serverEnv,
        vscode.ConfigurationTarget.Workspace,
      );
    }
  }
}
