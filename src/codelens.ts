import * as path from "node:path";
import * as vscode from "vscode";
import { findCargoToml } from "./cargo_manifest";
import { find_symbol, getBreakpoints } from "./document_symbols";
import { getDocument } from "./editor";
import { executeWithEnvironment, shouldUseTaskExecution } from "./env_handler";
import {
  CodelensNotFound,
  RunnerNotFound,
  handleUnexpectedError,
} from "./errors";
import { log } from "./logger";
import { nextestRunner, useCargoNextest } from "./nextest";
import serverExtraEnv from "./rust_analyzer/server_extraEnv";
import {
  getMergedRustAnalyzerConfig,
  readCargoRunnerSettings,
} from "./settings_handler";

export async function run(): Promise<void> {
  const relevantSymbol = await find_symbol();

  const codelens = await getLenses(relevantSymbol);

  log("Fetching rust analyzer config", "debug");

  // Use merged configuration that combines VS Code settings with cargo-runner-settings.json
  const config = getMergedRustAnalyzerConfig();

  const { testLens, benchLens, isModule, runner } = codelensMetadata(
    codelens,
    relevantSymbol,
  );

  if (
    !runner ||
    runner.command?.title === undefined ||
    runner.command?.arguments?.[0].args === undefined
  ) {
    throw new RunnerNotFound("No Runner found");
  }

  const cargoTomlPath = findCargoToml();

  if (cargoTomlPath) {
    serverExtraEnv({ config, cargoTomlPath, runner });
    runner.command.arguments[0].args.workspaceRoot =
      path.dirname(cargoTomlPath);

    // Apply project-specific settings directly to the command arguments
    applyProjectSettings(runner, cargoTomlPath);
  }

  if (await useCargoNextest()) {
    nextestRunner(
      runner,
      config,
      relevantSymbol,
      isModule,
      testLens,
      benchLens,
    );
  }

  if (runner.command.title === benchLens && isModule) {
    runner.command.arguments[0].args.executableArgs = [];
  }

  log(
    `${runner.command.command} command: ${JSON.stringify(runner.command.arguments?.[0].args.cargoArgs)} ${JSON.stringify(runner.command.arguments?.[0].args.executableArgs)}`,
    "debug",
  );

  // Log environment variables that will be passed to the command
  if (runner.command.arguments?.[0].args.env) {
    log(
      `Environment variables: ${JSON.stringify(runner.command.arguments[0].args.env)}`,
      "debug",
    );
  } else {
    log("No environment variables set for command", "debug");
  }

  log(`arguments: ${JSON.stringify(runner.command.arguments)}`, "debug");

  try {
    // Check if we should use task execution for environment variables
    const useCustomTask = shouldUseTaskExecution();

    // Log environment variables that will be used
    if (runner.command.arguments?.[0].args.env) {
      const envVars = runner.command.arguments[0].args.env;
      log(`Executing command with env: ${JSON.stringify(envVars)}`, "debug");
      log(
        `Using ${useCustomTask ? "task execution" : "standard execution"} method`,
        "debug",
      );
    }

    // Execute the command with environment variables
    const output = await executeWithEnvironment(runner, useCustomTask);

    if (output) {
      log(`output: ${JSON.stringify(output)}`, "debug");
    }
  } catch (error: unknown) {
    handleUnexpectedError(error);
  }
}

/**
 * Apply project-specific settings directly to the command arguments
 * This function now prioritizes runnables.extraArgs for all cargo arguments
 * and ensures environment variables are properly applied
 *
 * The settings structure is:
 * {
 *   "cargo": {
 *     "features": [],             // DEPRECATED: Use runnables.extraArgs instead
 *     "noDefaultFeatures": false, // DEPRECATED: Use runnables.extraArgs instead
 *     "target": string,           // DEPRECATED: Use runnables.extraArgs instead
 *     "targetDir": boolean|string // DEPRECATED: Use runnables.extraArgs instead
 *   },
 *   "runnables": {
 *     "extraArgs": [],            // Args passed to cargo commands
 *     "extraEnv": {},             // Environment variables for cargo commands
 *     "extraTestBinaryArgs": [],  // Args passed to test binaries
 *     "useTaskExecution": boolean // Whether to use task execution for env vars (optional)
 *   },
 *   "server": {
 *     "extraEnv": {}              // Environment variables for rust-analyzer
 *   }
 * }
 */
function applyProjectSettings(
  runner: vscode.CodeLens,
  cargoTomlPath: string,
): void {
  // Read project settings
  const projectSettings = readCargoRunnerSettings();
  if (!projectSettings) {
    return;
  }

  log("Applying project settings to command arguments", "debug");

  // Create collections for all arguments we'll gather
  const extraArgs: string[] = [];

  // First, process features - convert them to --features flag for extraArgs
  if (projectSettings.cargo?.features?.length) {
    log(
      `Converting cargo features to runnables.extraArgs: ${projectSettings.cargo.features.join(",")}`,
      "debug",
    );
    extraArgs.push("--features");
    extraArgs.push(projectSettings.cargo.features.join(","));
  }

  // Process noDefaultFeatures - convert to flag for extraArgs
  if (projectSettings.cargo?.noDefaultFeatures === true) {
    log("Converting noDefaultFeatures to runnables.extraArgs", "debug");
    extraArgs.push("--no-default-features");
  }

  // Process cargo target - convert to flag for extraArgs if specified in cargo settings
  if (projectSettings.cargo?.target) {
    log(
      `Converting cargo.target to runnables.extraArgs: ${projectSettings.cargo.target}`,
      "debug",
    );
    extraArgs.push("--target");
    extraArgs.push(projectSettings.cargo.target);
  }

  // Process targetDir - convert to flag for extraArgs if specified in cargo settings
  if (projectSettings.cargo?.targetDir) {
    const targetDir =
      typeof projectSettings.cargo.targetDir === "string"
        ? projectSettings.cargo.targetDir
        : "target";
    log(
      `Converting cargo.targetDir to runnables.extraArgs: ${targetDir}`,
      "debug",
    );
    extraArgs.push("--target-dir");
    extraArgs.push(targetDir);
  }

  // Add any explicit runnables.extraArgs
  if (projectSettings.runnables?.extraArgs?.length) {
    log(
      `Adding explicit runnables.extraArgs: ${projectSettings.runnables.extraArgs.join(" ")}`,
      "debug",
    );
    extraArgs.push(...projectSettings.runnables.extraArgs);
  }

  // Now add all collected extraArgs to the command
  if (extraArgs.length > 0 && runner.command?.arguments?.[0].args.cargoArgs) {
    log(
      `Adding combined extraArgs to command: ${extraArgs.join(" ")}`,
      "debug",
    );
    runner.command.arguments[0].args.cargoArgs.push(...extraArgs);
  }

  // Apply runnables.extraTestBinaryArgs for tests
  if (
    projectSettings.runnables?.extraTestBinaryArgs?.length &&
    runner.command?.arguments?.[0].args.executableArgs &&
    runner.command.title?.includes("Test")
  ) {
    log(
      `Adding extra test binary args: ${projectSettings.runnables.extraTestBinaryArgs.join(" ")}`,
      "debug",
    );

    // For nextest integration the executable args might be already cleared
    if (!runner.command.arguments[0].args.executableArgs.length) {
      // If integrated with nextest, these need to be added to cargoArgs instead
      if (runner.command.arguments[0].args.cargoArgs.includes("nextest")) {
        runner.command.arguments[0].args.cargoArgs.push(
          ...projectSettings.runnables.extraTestBinaryArgs,
        );
      }
    } else {
      runner.command.arguments[0].args.executableArgs.push(
        ...projectSettings.runnables.extraTestBinaryArgs,
      );
    }
  }

  // Apply runnables.extraEnv - ensure the env property exists first
  if (
    projectSettings.runnables?.extraEnv &&
    Object.keys(projectSettings.runnables.extraEnv).length > 0
  ) {
    log(
      `Setting environment variables: ${JSON.stringify(projectSettings.runnables.extraEnv)}`,
      "debug",
    );

    // Initialize env object if it doesn't exist
    if (!runner.command?.arguments?.[0].args.env) {
      if (runner.command?.arguments?.[0]?.args) {
        runner.command.arguments[0].args.env = {};
      }
    }

    // Add or override environment variables
    if (runner.command?.arguments?.[0]?.args?.env) {
      Object.assign(
        runner.command.arguments[0].args.env,
        projectSettings.runnables.extraEnv,
      );
      log(
        `Environment variables applied: ${JSON.stringify(runner.command.arguments[0].args.env)}`,
        "debug",
      );
    }
  }
}

async function getLenses(
  symbol: vscode.DocumentSymbol,
): Promise<vscode.CodeLens[]> {
  const codelenses = await vscode.commands.executeCommand<vscode.CodeLens[]>(
    "vscode.executeCodeLensProvider",
    getDocument().uri,
  );

  const symbolRelatedCodeLenses = codelenses.filter((lens) => {
    const lensStart = lens.range.start.line;
    const symbolStart = symbol.range.start.line;
    const symbolEnd = symbol.range.end.line;

    return lensStart >= symbolStart - 2 && lensStart <= symbolEnd;
  });

  if (symbolRelatedCodeLenses.length === 0) {
    log("Trying to get the file-level CodeLenses", "debug");
    throw new CodelensNotFound("No Code lenses actions available");
  }

  log(
    `Found codelenses for symbol: ${symbol.name} \n ${JSON.stringify(symbolRelatedCodeLenses)}\n\n \t END of codelenses`,
    "debug",
  );

  return symbolRelatedCodeLenses;
}

interface CodelensMetadata {
  testLens: string;
  benchLens: string;
  isModule: boolean;
  runner: vscode.CodeLens | undefined;
}

function codelensMetadata(
  codeLenses: vscode.CodeLens[],
  nearestSymbol: vscode.DocumentSymbol,
): CodelensMetadata {
  const isModule =
    nearestSymbol?.kind === vscode.SymbolKind.Module ||
    nearestSymbol?.kind === vscode.SymbolKind.Struct;

  const testLens = isModule ? "▶︎ Run Tests" : "▶︎ Run Test";
  const benchLens = "▶︎ Run Bench";
  const runLens = "▶︎ Run ";
  const docLens = "▶︎ Run Doctest";
  const debugLens = "Debug";

  const run: vscode.CodeLens | undefined = codeLenses.find(
    (lens) => lens.command?.title === runLens,
  );
  const bench: vscode.CodeLens | undefined = codeLenses.find(
    (lens) => lens.command?.title === benchLens,
  );
  const test: vscode.CodeLens | undefined = codeLenses.find(
    (lens) => lens.command?.title === testLens,
  );
  const doc: vscode.CodeLens | undefined = codeLenses.find(
    (lens) => lens.command?.title === docLens,
  );
  const debuggable: vscode.CodeLens | undefined = codeLenses.find(
    (lens) => lens.command?.title === debugLens,
  );

  const relevantBreakpoints = getBreakpoints(nearestSymbol);

  log(
    `Relevant breakpoints: ${JSON.stringify(relevantBreakpoints)}\n`,
    "debug",
  );
  log(`run: ${run?.command?.title}\n`, "debug");
  log(`bench: ${bench?.command?.title}\n`, "debug");
  log(`test: ${test?.command?.title}\n`, "debug");
  log(`doc: ${doc?.command?.title}\n`, "debug");
  log(`debuggable: ${debuggable?.command?.title}\n`, "debug");

  const runner =
    relevantBreakpoints.length > 0 ? debuggable : run || test || doc || bench;

  log(`Current Runner is ${runner?.command?.title}\n`, "debug");

  return {
    testLens,
    benchLens,
    isModule,
    runner,
  };
}
