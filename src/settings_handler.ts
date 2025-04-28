import * as fs from 'node:fs';
import * as path from 'node:path';
import * as vscode from 'vscode';
import { log } from './logger';
import { findCargoToml } from './cargo_manifest';

/**
 * Interface for cargo-runner-settings.json file structure
 * This should mirror the relevant rust-analyzer settings
 */
export interface CargoRunnerSettings {
    cargo?: {
        features?: string[];
        noDefaultFeatures?: boolean;
        target?: string;
        targetDir?: boolean | string;
    };
    runnables?: {
        extraArgs?: string[];
        extraEnv?: Record<string, string>;
        extraTestBinaryArgs?: string[];
    };
    server?: {
        extraEnv?: Record<string, string>;
    };
}

// Type for allowed section keys
export type SectionKey = keyof CargoRunnerSettings;

// Define types for section properties
export interface CargoSectionProps {
    features: string[];
    noDefaultFeatures: boolean;
    target: string;
    targetDir: boolean | string;
}

export interface RunnablesSectionProps {
    extraArgs: string[];
    extraEnv: Record<string, string>;
    extraTestBinaryArgs: string[];
}

export interface ServerSectionProps {
    extraEnv: Record<string, string>;
}

// Type map to enforce type safety for each section
export type SectionPropsMap = {
    cargo: CargoSectionProps;
    runnables: RunnablesSectionProps;
    server: ServerSectionProps;
};

// Utility type to get property type of a specific section
export type PropType<S extends SectionKey, K extends keyof SectionPropsMap[S]> = SectionPropsMap[S][K];

/**
 * Finds the cargo-runner-settings.json file in the same directory as Cargo.toml
 * @returns The path to the settings file if found, null otherwise
 */
export function findCargoRunnerSettings(): string | null {
    const cargoTomlPath = findCargoToml();
    if (!cargoTomlPath) {
        log('No Cargo.toml found, cannot locate cargo-runner-settings.json', 'debug');
        return null;
    }

    const settingsPath = path.join(path.dirname(cargoTomlPath), 'cargo-runner-settings.json');
    if (!fs.existsSync(settingsPath)) {
        log(`No cargo-runner-settings.json found at ${settingsPath}`, 'debug');
        return null;
    }

    log(`Found cargo-runner-settings.json at ${settingsPath}`, 'debug');
    return settingsPath;
}

/**
 * Reads and parses the cargo-runner-settings.json file
 * @returns Parsed settings object or null if not found or invalid
 */
export function readCargoRunnerSettings(): CargoRunnerSettings | null {
    const settingsPath = findCargoRunnerSettings();
    if (!settingsPath) {
        return null;
    }

    try {
        const content = fs.readFileSync(settingsPath, 'utf-8');
        const settings = JSON.parse(content) as CargoRunnerSettings;
        log(`Parsed cargo-runner-settings.json: ${JSON.stringify(settings)}`, 'debug');
        return settings;
    } catch (error) {
        if (error instanceof Error) {
            log(`Error reading cargo-runner-settings.json: ${error.message}`, 'error');
        }
        return null;
    }
}

/**
 * Writes settings to the cargo-runner-settings.json file
 * Creates the file if it doesn't exist
 * @param settings The settings to write
 * @returns True if successful, false otherwise
 */
export function writeCargoRunnerSettings(settings: CargoRunnerSettings): boolean {
    const cargoTomlPath = findCargoToml();
    if (!cargoTomlPath) {
        log('No Cargo.toml found, cannot write cargo-runner-settings.json', 'error');
        return false;
    }

    const settingsPath = path.join(path.dirname(cargoTomlPath), 'cargo-runner-settings.json');
    try {
        fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 4), 'utf-8');
        log(`Successfully wrote cargo-runner-settings.json to ${settingsPath}`, 'debug');
        return true;
    } catch (error) {
        if (error instanceof Error) {
            log(`Error writing cargo-runner-settings.json: ${error.message}`, 'error');
        }
        return false;
    }
}

/**
 * Gets merged configuration combining VS Code settings and project-specific settings
 * Project settings take precedence over VS Code settings
 * @returns The merged configuration
 */
export function getMergedRustAnalyzerConfig(): vscode.WorkspaceConfiguration {
    // Get VS Code's rust-analyzer config
    const vsCodeConfig = vscode.workspace.getConfiguration('rust-analyzer');
    
    // Get project-specific settings
    const projectSettings = readCargoRunnerSettings();
    if (!projectSettings) {
        return vsCodeConfig;
    }

    // Create a proxy to intercept property access
    const proxy = new Proxy(vsCodeConfig, {
        get(target: vscode.WorkspaceConfiguration, prop: string | symbol): unknown {
            if (typeof prop !== 'string') {
                return Reflect.get(target, prop);
            }

            // Handle nested properties like 'cargo.features'
            if (prop.includes('.')) {
                const [section, key] = prop.split('.') as [SectionKey, string];
                
                // Safely check if the property exists in project settings
                if (
                    projectSettings[section]?.[key as keyof typeof projectSettings[typeof section]] !== undefined
                ) {
                    return projectSettings[section]?.[key as keyof typeof projectSettings[typeof section]];
                }
            } 
            // Handle direct properties
            else if (projectSettings[prop as keyof CargoRunnerSettings] !== undefined) {
                return projectSettings[prop as keyof CargoRunnerSettings];
            }

            // Fall back to VS Code config
            return Reflect.get(target, prop);
        }
    });

    return proxy as vscode.WorkspaceConfiguration;
}

/**
 * Updates a setting in the cargo-runner-settings.json file
 * @param section The section of the setting (cargo, runnables, server)
 * @param key The key of the setting
 * @param value The value to set
 * @returns True if successful, false otherwise
 */
export function updateCargoRunnerSetting<
    S extends SectionKey, 
    K extends keyof SectionPropsMap[S]
>(section: S, key: K & string, value: PropType<S, K>): boolean {
    let settings = readCargoRunnerSettings() || {};
    
    // Ensure the section exists
    if (!settings[section]) {
        settings = { ...settings, [section]: {} };
    }
    
    // Update the setting using type-safe approach
    if (!settings[section]) {
        settings[section] = {};
    }
    
    // We need to use this method to appease TypeScript
    const sectionObj = settings[section] as Record<string, unknown>;
    sectionObj[key] = value;
    
    return writeCargoRunnerSettings(settings);
}

/**
 * Deletes a setting from the cargo-runner-settings.json file
 * @param section The section of the setting (cargo, runnables, server)
 * @param key The key of the setting to delete
 * @returns True if successful, false otherwise
 */
export function deleteCargoRunnerSetting<
    S extends SectionKey, 
    K extends keyof SectionPropsMap[S]
>(section: S, key: K & string): boolean {
    const settings = readCargoRunnerSettings();
    if (!settings || !settings[section]) {
        return false;
    }
    
    // Delete the setting using type-safe approach
    const sectionObj = settings[section] as Record<string, unknown>;
    delete sectionObj[key];
    
    // Remove empty sections
    if (Object.keys(sectionObj).length === 0) {
        delete settings[section];
    }
    
    return writeCargoRunnerSettings(settings);
}