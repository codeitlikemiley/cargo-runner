import * as toml from '@iarna/toml';
import { CargoManifestNotFound, InvalidToolChain } from './errors';
import fs from 'fs';
import path from 'path';
import { log } from './logger';
import { exec } from 'child_process';
import { findCargoToml } from './cargo_manifest';

interface ToolchainConfig {
    toolchain?: {
        channel?: string;
        components?: string[];
        targets?: string[];
        profile?: string;
    };
}

export function updateChannel(cargoFilePath: string, rustToolchain: string) {
    const toolchainFilePath = path.join(path.dirname(cargoFilePath), 'rust-toolchain.toml');

    const defaultToolchainConfig: ToolchainConfig = {
        toolchain: {
            channel: rustToolchain,
        },
    };

    log(`Looking for rust-toolchain.toml at: ${toolchainFilePath}`, "debug");

    if (fs.existsSync(toolchainFilePath)) {
        log('Found rust-toolchain.toml, reading contents...', "debug");
        const content = fs.readFileSync(toolchainFilePath, 'utf8');
        log('Current rust-toolchain.toml content:', "debug");
        log(content, "debug");

        let toolchainConfig: ToolchainConfig;

        try {
            toolchainConfig = toml.parse(content) as ToolchainConfig;
            log('Parsed configuration:', "debug");
            log(JSON.stringify(toolchainConfig, null, 2), "debug");
        } catch (error) {
            if (error instanceof Error) {
                log('Failed to parse rust-toolchain.toml:', "error");
                log(error.message, "error");
            }
            throw new Error('Invalid TOML file format.');
        }

        // If toolchain section doesn't exist, initialize it
        if (!toolchainConfig.toolchain) {
            toolchainConfig.toolchain = {};
        }

        // If no channel field exists, add it
        if (!toolchainConfig.toolchain.channel) {
            log(`No channel found, adding channel: ${rustToolchain}`, "debug");
            toolchainConfig.toolchain.channel = rustToolchain;
        } else {
            // If channel exists, update it
            log(`Updating channel to: ${rustToolchain}`, "debug");
            toolchainConfig.toolchain.channel = rustToolchain;
        }

        // Convert back to TOML
        try {
            const updatedContent = toml.stringify(toolchainConfig as toml.JsonMap);
            log('Updated TOML content:', "debug");
            log(updatedContent, "debug");

            // Write back to the file
            fs.writeFileSync(toolchainFilePath, updatedContent, 'utf8');
            log('rust-toolchain.toml updated successfully.', "info");
        } catch (error) {
            if (error instanceof Error) {
                log('Failed to stringify configuration:', "error");
                log(error.message, "error");
            }
            throw new Error('Error writing updated configuration to file.');
        }
    } else {
        // If the file doesn't exist, create it with the default config
        log('rust-toolchain.toml not found, creating a new one.', "debug");
        try {
            const newContent = toml.stringify(defaultToolchainConfig as toml.JsonMap);
            log('New TOML content:', "debug");
            log(newContent, "debug");

            // Create and write the default config to the new file
            fs.writeFileSync(toolchainFilePath, newContent, 'utf8');
            log('rust-toolchain.toml created with default channel.', "info");
        } catch (error) {
            if (error instanceof Error) {
                log('Failed to stringify configuration:', "error");
                log(error.message, "error");
            }
            throw new Error('Error writing new configuration to file.');
        }
    }
}

export async function removeChannel() {
    let cargoPath = findCargoToml();
    if (!cargoPath) { throw new CargoManifestNotFound('Cargo.toml file not found'); }
    let filePath = path.join(path.dirname(cargoPath), 'rust-toolchain.toml');
    try {
        const content = await fs.readFileSync(filePath, 'utf-8');

        // Check if the file contains only the channel
        const isOnlyChannel = /\[toolchain\]\s*channel\s*=\s*"[^"]*"\s*$/.test(content);

        if (isOnlyChannel) {
            // Remove entire content if only `channel` exists
            await fs.unlinkSync(filePath);
        } else {
            // Remove only the `channel` line
            const updatedContent = content.replace(/channel\s*=\s*"[^"]*"\s*\n?/, '');
            await fs.writeFileSync(filePath, updatedContent, 'utf-8');
        }
    } catch (error) {
        if (error instanceof Error) {
            log(`Error removing channel from rust-toolchain.toml: ${error.message}`, 'error');
        }
        throw error;
    }
}

export function getActiveToolchain(cargoFilePath: string): Promise<string | null> {
    return new Promise((resolve, reject) => {
        const cargoDir = path.dirname(cargoFilePath);

        exec('rustup show active-toolchain', { cwd: cargoDir }, (error, stdout, stderr) => {
            if (error || stderr) {
                log('Error fetching active toolchain:', 'error');
                log(error?.message || stderr, 'error');
                return reject(error || stderr);
            }

            // Extract the toolchain name from the output (it might be followed by '(default)')
            // e.g.  stable-aarch64-apple-darwin (default)
            const toolchain = stdout.split(' ')[0];

            resolve(toolchain || null);
        });
    });
}

export function rustToolchainExists(cargoFilePath: string): boolean {
    const cargoDir = path.dirname(cargoFilePath);
    const toolchainPath = path.join(cargoDir, 'rust-toolchain.toml');
    return fs.existsSync(toolchainPath);
}

const CHANNEL_REGEX = /^(?:stable|beta|nightly|\d+(?:\.\d+){1,2})(?:-\d{4}(?:-\d{2}){2})?(?:-\D[^-]*(?:(?:-(?:[^-]+)){1,3}))?$/;

export function isValidToolchain(toolchain: string): boolean {
    return CHANNEL_REGEX.test(toolchain);
}