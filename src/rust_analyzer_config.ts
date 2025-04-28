import * as vscode from 'vscode';
import { CargoManifestNotFound, InvalidToolChain } from './errors';
import { isValidToolchain, removeChannel, updateChannel } from './toolchain';
import { log } from './logger';
import { findCargoToml } from './cargo_manifest';
import { updateCargoRunnerSetting, deleteCargoRunnerSetting, readCargoRunnerSettings } from './settings_handler';
import path from 'node:path';
import * as fs from 'node:fs';

export const rustAnalyzerConfig = vscode.commands.registerCommand('cargo.rust-analyzer.config', async () => {
    const args = await vscode.window.showInputBox({
        prompt: 'Add or Remove Rust Analyzer Config'
    });
    if (args) {
        const argsArray: string[] = args.match(/(?:[^\s"]+|"[^"]*")+/g) || [];

        const extraArgs: string[] = [];
        const extraTestBinaryArgs: string[] = [];
        const features: Set<string> = new Set();
        const extraEnv: Record<string, string> = {};
        let cargoTarget: string | null | undefined;
        let cargoTargetDir: boolean | undefined;
        let noDefaultFeatures: boolean | undefined;
        let rustChannel: string | null = null;

        // Check for append mode (@)
        let isAppendMode = false;
        
        // Check if command starts with @
        if (argsArray.length > 0 && argsArray[0] === '@') {
            isAppendMode = true;
            log("Using append mode - will merge with existing settings", 'debug');
            
            // Remove @ from the args array completely
            argsArray.shift();
        }

        const config = vscode.workspace.getConfiguration('rust-analyzer');

        // Ask user if they want to save to project settings or workspace settings
        const saveLocation = await vscode.window.showQuickPick(
            ['Workspace Settings (.vscode/settings.json)', 'Project Settings (cargo-runner-settings.json)'],
            { placeHolder: 'Where would you like to save these settings?' }
        );
        
        const useProjectSettings = saveLocation === 'Project Settings (cargo-runner-settings.json)';

        // Check if we use '#' as test binary args delimiter 
        const testBinaryArgsDelimiterIndex = argsArray.indexOf('#');
        
        // Process test binary args first if the delimiter exists
        if (testBinaryArgsDelimiterIndex !== -1) {
            // Add everything after the '#' to extraTestBinaryArgs
            extraTestBinaryArgs.push(...argsArray.slice(testBinaryArgsDelimiterIndex + 1));
            // Remove the test binary args and delimiter from argsArray for further processing
            argsArray.splice(testBinaryArgsDelimiterIndex);
        }

        for (let i = 0; i < argsArray.length; i++) {
            const arg = argsArray[i];
            if (arg.startsWith("!")) {
                await resetConfig(arg, config, useProjectSettings);
            } else {
                if (arg.startsWith('--features')) {
                    // Improved regex that handles both --features=example and --features example
                    const match = arg.match(/--features(?:=|\s+)([^\s,]+(?:,[^\s,]+)*)/);
                    
                    if (match?.[1]) {
                        const featureList = match[1].split(',');
                        for (const feature of featureList) {
                            features.add(feature.trim());
                        }
                        log(`Detected features: ${Array.from(features).join(', ')}`, 'debug');
                    } else if (arg === '--features' && i + 1 < argsArray.length) {
                        // Handle the case where the value is in the next array item
                        const featureList = argsArray[i + 1].split(',');
                        for (const feature of featureList) {
                            features.add(feature.trim());
                        }
                        log(`Detected features from next arg: ${Array.from(features).join(', ')}`, 'debug');
                        i++; // Skip the next item since we already processed it
                    }
                } else if (arg.startsWith('--no-default-features')) {
                    const match = arg.match(/--no-default-features(?:=(true|false))?/);

                    if (match) {
                        noDefaultFeatures = match[1] !== 'false';
                    } else {
                        noDefaultFeatures = true;
                    }
                    log(`Set noDefaultFeatures to ${noDefaultFeatures}`, 'debug');
                } else if (arg.startsWith('--cargo-target')) {
                    const match = arg.match(/--cargo-target(?:=|\s)([^\s,]+(?:,[^\s,]+)*)/);
                    if (match?.[1]) {
                        cargoTarget = match[1].toString();
                    }
                }
                else if (arg.startsWith('--target-dir')) {
                    const match = arg.match(/--target-dir(?:=(true|false))?/);
                    if (match) {
                        cargoTargetDir = match[1] !== 'false';
                    } else {
                        cargoTargetDir = true;
                    }
                }
                else if (/^[A-Z_]+=/.test(arg)) {
                    const [key, value] = arg.split('=');
                    extraEnv[key] = value;
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

        const featureArray = Array.from(features);
        log(`Final features to be applied: ${featureArray.join(', ')}`, 'debug');
        
        if (useProjectSettings) {
            await updateProjectSettings(
                isAppendMode,
                featureArray,
                noDefaultFeatures,
                cargoTarget,
                cargoTargetDir,
                extraArgs,
                extraTestBinaryArgs,
                extraEnv
            );
        } else {
            await updateWorkspaceSettings(
                config,
                isAppendMode,
                featureArray,
                noDefaultFeatures,
                cargoTarget,
                cargoTargetDir,
                extraArgs,
                extraTestBinaryArgs,
                extraEnv
            );
        }
        
        vscode.window.showInformationMessage(`Config Updated in ${useProjectSettings ? 'cargo-runner-settings.json' : '.vscode/settings.json'}`);
    }
});

// Helper function to deduplicate arrays while preserving order
function deduplicateArray<T>(array: T[]): T[] {
    return [...new Set(array)];
}

async function updateProjectSettings(
    isAppendMode: boolean,
    featureArray: string[],
    noDefaultFeatures: boolean | undefined,
    cargoTarget: string | undefined | null,
    cargoTargetDir: boolean | undefined,
    extraArgs: string[],
    extraTestBinaryArgs: string[],
    extraEnv: Record<string, string>
): Promise<void> {
    // Get existing settings
    const existingSettings = readCargoRunnerSettings() || {};
    
    if (isAppendMode) {
        log("Using append mode - merging with existing settings", 'debug');
        
        // Handle features - merge and deduplicate
        if (featureArray.length > 0) {
            const existingFeatures = existingSettings.cargo?.features || [];
            const mergedFeatures = deduplicateArray([...existingFeatures, ...featureArray]);
            updateCargoRunnerSetting('cargo', 'features', mergedFeatures);
            log(`Updated features: ${mergedFeatures.join(', ')}`, 'debug');
        }
        
        // Handle noDefaultFeatures - override if specified
        if (noDefaultFeatures !== undefined) {
            updateCargoRunnerSetting('cargo', 'noDefaultFeatures', noDefaultFeatures);
            log(`Updated noDefaultFeatures: ${noDefaultFeatures}`, 'debug');
        }
        
        // Handle cargo target - override if specified
        if (cargoTarget) {
            updateCargoRunnerSetting('cargo', 'target', cargoTarget);
            log(`Updated cargo target: ${cargoTarget}`, 'debug');
        }
        
        // Handle cargo target dir - override if specified
        if (cargoTargetDir !== undefined) {
            updateCargoRunnerSetting('cargo', 'targetDir', cargoTargetDir);
            log(`Updated cargo target dir: ${cargoTargetDir}`, 'debug');
        }
        
        // Handle extra args - merge and deduplicate
        if (extraArgs.length > 0) {
            const existingArgs = existingSettings.runnables?.extraArgs || [];
            // Filter out duplicate args
            const filteredNewArgs = extraArgs.filter(newArg => !existingArgs.includes(newArg));
            if (filteredNewArgs.length > 0) {
                const mergedArgs = [...existingArgs, ...filteredNewArgs];
                updateCargoRunnerSetting('runnables', 'extraArgs', mergedArgs);
                log(`Updated extra args: ${mergedArgs.join(' ')}`, 'debug');
            } else {
                log("No new args to add, all were duplicates", 'debug');
            }
        }
        
        // Handle test binary args - merge and deduplicate
        if (extraTestBinaryArgs.length > 0) {
            const existingTestArgs = existingSettings.runnables?.extraTestBinaryArgs || [];
            // Filter out duplicate test args
            const filteredNewTestArgs = extraTestBinaryArgs.filter(
                newArg => !existingTestArgs.includes(newArg)
            );
            if (filteredNewTestArgs.length > 0) {
                const mergedTestArgs = [...existingTestArgs, ...filteredNewTestArgs];
                updateCargoRunnerSetting('runnables', 'extraTestBinaryArgs', mergedTestArgs);
                log(`Updated test binary args: ${mergedTestArgs.join(' ')}`, 'debug');
            } else {
                log("No new test binary args to add, all were duplicates", 'debug');
            }
        }
        
        // Handle environment variables - merge (objects handle duplicates automatically)
        if (Object.keys(extraEnv).length > 0) {
            const existingEnv = existingSettings.runnables?.extraEnv || {};
            const mergedEnv = { ...existingEnv, ...extraEnv };
            updateCargoRunnerSetting('runnables', 'extraEnv', mergedEnv);
            log(`Updated environment variables: ${JSON.stringify(mergedEnv)}`, 'debug');
        }
    } else {
        // Regular replace mode - only update specified settings
        log("Using replace mode - overriding existing settings", 'debug');
        
        if (featureArray.length > 0) {
            updateCargoRunnerSetting('cargo', 'features', featureArray);
            log(`Set features: ${featureArray.join(', ')}`, 'debug');
        }
        
        if (noDefaultFeatures !== undefined) {
            updateCargoRunnerSetting('cargo', 'noDefaultFeatures', noDefaultFeatures);
            log(`Set noDefaultFeatures: ${noDefaultFeatures}`, 'debug');
        }
        
        if (cargoTarget) {
            updateCargoRunnerSetting('cargo', 'target', cargoTarget);
            log(`Set cargo target: ${cargoTarget}`, 'debug');
        }
        
        if (cargoTargetDir !== undefined) {
            updateCargoRunnerSetting('cargo', 'targetDir', cargoTargetDir);
            log(`Set cargo target dir: ${cargoTargetDir}`, 'debug');
        }
        
        if (extraArgs.length > 0) {
            updateCargoRunnerSetting('runnables', 'extraArgs', extraArgs);
            log(`Set extra args: ${extraArgs.join(' ')}`, 'debug');
        }
        
        if (extraTestBinaryArgs.length > 0) {
            updateCargoRunnerSetting('runnables', 'extraTestBinaryArgs', extraTestBinaryArgs);
            log(`Set test binary args: ${extraTestBinaryArgs.join(' ')}`, 'debug');
        }
        
        if (Object.keys(extraEnv).length > 0) {
            updateCargoRunnerSetting('runnables', 'extraEnv', extraEnv);
            log(`Set environment variables: ${JSON.stringify(extraEnv)}`, 'debug');
        }
    }
    
    // Read back the settings to verify they were applied
    const updatedSettings = readCargoRunnerSettings();
    log(`Updated settings: ${JSON.stringify(updatedSettings)}`, 'debug');
}

async function updateWorkspaceSettings(
    config: vscode.WorkspaceConfiguration,
    isAppendMode: boolean,
    featureArray: string[],
    noDefaultFeatures: boolean | undefined,
    cargoTarget: string | undefined | null,
    cargoTargetDir: boolean | undefined,
    extraArgs: string[],
    extraTestBinaryArgs: string[],
    extraEnv: Record<string, string>
): Promise<void> {
    if (isAppendMode) {
        log("Using append mode - merging with existing settings", 'debug');
        
        // Handle features - merge and deduplicate
        if (featureArray.length > 0) {
            const existingFeatures = config.get<string[]>('cargo.features') || [];
            const mergedFeatures = deduplicateArray([...existingFeatures, ...featureArray]);
            await config.update('cargo.features', mergedFeatures, vscode.ConfigurationTarget.Workspace);
            log(`Updated features: ${mergedFeatures.join(', ')}`, 'debug');
        }
        
        // Handle noDefaultFeatures - override if specified
        if (noDefaultFeatures !== undefined) {
            await config.update('cargo.noDefaultFeatures', noDefaultFeatures, vscode.ConfigurationTarget.Workspace);
            log(`Updated noDefaultFeatures: ${noDefaultFeatures}`, 'debug');
        }
        
        // Handle cargo target - override if specified
        if (cargoTarget) {
            await config.update('cargo.target', cargoTarget, vscode.ConfigurationTarget.Workspace);
            log(`Updated cargo target: ${cargoTarget}`, 'debug');
        }
        
        // Handle cargo target dir - override if specified
        if (cargoTargetDir !== undefined) {
            await config.update('cargo.targetDir', cargoTargetDir, vscode.ConfigurationTarget.Workspace);
            log(`Updated cargo target dir: ${cargoTargetDir}`, 'debug');
        }
        
        // Handle extra args - merge and deduplicate
        if (extraArgs.length > 0) {
            const existingArgs = config.get<string[]>('runnables.extraArgs') || [];
            // Filter out duplicate args
            const filteredNewArgs = extraArgs.filter(newArg => !existingArgs.includes(newArg));
            if (filteredNewArgs.length > 0) {
                const mergedArgs = [...existingArgs, ...filteredNewArgs];
                await config.update('runnables.extraArgs', mergedArgs, vscode.ConfigurationTarget.Workspace);
                log(`Updated extra args: ${mergedArgs.join(' ')}`, 'debug');
            } else {
                log("No new args to add, all were duplicates", 'debug');
            }
        }
        
        // Handle test binary args - merge and deduplicate
        if (extraTestBinaryArgs.length > 0) {
            const existingTestArgs = config.get<string[]>('runnables.extraTestBinaryArgs') || [];
            // Filter out duplicate test args
            const filteredNewTestArgs = extraTestBinaryArgs.filter(
                newArg => !existingTestArgs.includes(newArg)
            );
            if (filteredNewTestArgs.length > 0) {
                const mergedTestArgs = [...existingTestArgs, ...filteredNewTestArgs];
                await config.update('runnables.extraTestBinaryArgs', mergedTestArgs, vscode.ConfigurationTarget.Workspace);
                log(`Updated test binary args: ${mergedTestArgs.join(' ')}`, 'debug');
            } else {
                log("No new test binary args to add, all were duplicates", 'debug');
            }
        }
        
        // Handle environment variables - merge (objects handle duplicates automatically)
        if (Object.keys(extraEnv).length > 0) {
            const existingEnv = config.get<Record<string, string>>('runnables.extraEnv') || {};
            const mergedEnv = { ...existingEnv, ...extraEnv };
            await config.update('runnables.extraEnv', mergedEnv, vscode.ConfigurationTarget.Workspace);
            log(`Updated environment variables: ${JSON.stringify(mergedEnv)}`, 'debug');
        }
    } else {
        // Regular replace mode - only update specified settings
        log("Using replace mode - overriding existing settings", 'debug');
        
        if (featureArray.length > 0) {
            await config.update('cargo.features', featureArray, vscode.ConfigurationTarget.Workspace);
            log(`Set features: ${featureArray.join(', ')}`, 'debug');
        }
        
        if (noDefaultFeatures !== undefined) {
            await config.update('cargo.noDefaultFeatures', noDefaultFeatures, vscode.ConfigurationTarget.Workspace);
            log(`Set noDefaultFeatures: ${noDefaultFeatures}`, 'debug');
        }
        
        if (cargoTarget) {
            await config.update('cargo.target', cargoTarget, vscode.ConfigurationTarget.Workspace);
            log(`Set cargo target: ${cargoTarget}`, 'debug');
        }
        
        if (cargoTargetDir !== undefined) {
            await config.update('cargo.targetDir', cargoTargetDir, vscode.ConfigurationTarget.Workspace);
            log(`Set cargo target dir: ${cargoTargetDir}`, 'debug');
        }
        
        if (extraArgs.length > 0) {
            await config.update('runnables.extraArgs', extraArgs, vscode.ConfigurationTarget.Workspace);
            log(`Set extra args: ${extraArgs.join(' ')}`, 'debug');
        }
        
        if (extraTestBinaryArgs.length > 0) {
            await config.update('runnables.extraTestBinaryArgs', extraTestBinaryArgs, vscode.ConfigurationTarget.Workspace);
            log(`Set test binary args: ${extraTestBinaryArgs.join(' ')}`, 'debug');
        }
        
        if (Object.keys(extraEnv).length > 0) {
            await config.update('runnables.extraEnv', extraEnv, vscode.ConfigurationTarget.Workspace);
            log(`Set environment variables: ${JSON.stringify(extraEnv)}`, 'debug');
        }
    }
}

const resetConfig = async (arg: string, config: vscode.WorkspaceConfiguration, useProjectSettings: boolean) => {
    // Default settings structure for project settings
    const defaultSettings = {
        cargo: {
            features: [],
            noDefaultFeatures: false
        },
        runnables: {
            extraArgs: [],
            extraEnv: {},
            extraTestBinaryArgs: []
        },
        server: {
            extraEnv: {}
        }
    };

    // Reset all configurations with !!
    if (arg === "!!") {
        if (useProjectSettings) {
            // Reset cargo-runner-settings.json to default structure
            const settingsPath = findCargoToml();
            if (settingsPath) {
                const projectSettingsPath = path.join(path.dirname(settingsPath), 'cargo-runner-settings.json');
                
                try {
                    fs.writeFileSync(
                        projectSettingsPath, 
                        JSON.stringify(defaultSettings, null, 4), 
                        'utf8'
                    );
                    log('Reset cargo-runner-settings.json to default structure', 'debug');
                } catch (error) {
                    log(`Error writing default settings: ${error}`, 'error');
                }
            }
            
            // Also remove rust-toolchain.toml
            removeChannel();
            vscode.window.showInformationMessage('Project settings have been reset to defaults');
        } else {
            // For workspace settings, completely remove all cargo runner settings
            await config.update('cargo.features', undefined, vscode.ConfigurationTarget.Workspace);
            await config.update('cargo.noDefaultFeatures', undefined, vscode.ConfigurationTarget.Workspace);
            await config.update('cargo.target', undefined, vscode.ConfigurationTarget.Workspace);
            await config.update('cargo.targetDir', undefined, vscode.ConfigurationTarget.Workspace);
            await config.update('runnables.extraArgs', undefined, vscode.ConfigurationTarget.Workspace);
            await config.update('runnables.extraEnv', undefined, vscode.ConfigurationTarget.Workspace);
            await config.update('runnables.extraTestBinaryArgs', undefined, vscode.ConfigurationTarget.Workspace);
            await config.update('server.extraEnv', undefined, vscode.ConfigurationTarget.Workspace);
            
            // Also remove rust-toolchain.toml
            removeChannel();
            vscode.window.showInformationMessage('All workspace cargo settings have been removed');
        }
        return;
    }

    // Handle individual reset commands
    switch (arg) {
        case "!channel":
            removeChannel();
            vscode.window.showInformationMessage('Rust toolchain channel reset');
            break;
        case "!features":
            if (useProjectSettings) {
                // For project settings, reset to default empty arrays
                updateCargoRunnerSetting('cargo', 'features', defaultSettings.cargo.features);
                updateCargoRunnerSetting('cargo', 'noDefaultFeatures', defaultSettings.cargo.noDefaultFeatures);
            } else {
                // For workspace settings, completely remove the settings
                await config.update('cargo.features', undefined, vscode.ConfigurationTarget.Workspace);
                await config.update('cargo.noDefaultFeatures', undefined, vscode.ConfigurationTarget.Workspace);
            }
            vscode.window.showInformationMessage('Cargo features reset');
            break;
        case "!target":
            if (useProjectSettings) {
                deleteCargoRunnerSetting('cargo', 'target');
            } else {
                await config.update('cargo.target', undefined, vscode.ConfigurationTarget.Workspace);
            }
            vscode.window.showInformationMessage('Cargo target reset');
            break;
        case "!targetDir":
            if (useProjectSettings) {
                deleteCargoRunnerSetting('cargo', 'targetDir');
            } else {
                await config.update('cargo.targetDir', undefined, vscode.ConfigurationTarget.Workspace);
            }
            vscode.window.showInformationMessage('Cargo target dir reset');
            break;
        case "!env":
            if (useProjectSettings) {
                // Reset to empty object for project settings
                updateCargoRunnerSetting('runnables', 'extraEnv', defaultSettings.runnables.extraEnv);
            } else {
                // Remove completely for workspace settings
                await config.update('runnables.extraEnv', undefined, vscode.ConfigurationTarget.Workspace);
            }
            vscode.window.showInformationMessage('Cargo environment variables reset');
            break;
        case "!#":
            if (useProjectSettings) {
                // Reset to empty array for project settings
                updateCargoRunnerSetting('runnables', 'extraTestBinaryArgs', defaultSettings.runnables.extraTestBinaryArgs);
            } else {
                // Remove completely for workspace settings
                await config.update('runnables.extraTestBinaryArgs', undefined, vscode.ConfigurationTarget.Workspace);
            }
            vscode.window.showInformationMessage('Extra test binary args reset');
            break;
        default:
            if (useProjectSettings) {
                // Reset to empty array for project settings
                updateCargoRunnerSetting('runnables', 'extraArgs', defaultSettings.runnables.extraArgs);
            } else {
                // Remove completely for workspace settings
                await config.update('runnables.extraArgs', undefined, vscode.ConfigurationTarget.Workspace);
            }
            vscode.window.showInformationMessage('Cargo extra args reset');
    }
};