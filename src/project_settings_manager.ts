import * as vscode from 'vscode';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as glob from 'glob';
import { log } from './logger';

interface ProjectInfo {
    label: string;
    cargoTomlPath: string;
    settingsPath: string;
    description: string;
    exists: boolean;
}

/**
 * Finds all Cargo.toml files in the workspace
 */
async function findAllCargoTomlFiles(): Promise<string[]> {
    const cargoTomlPaths: string[] = [];
    
    // First, check if there are any workspace folders
    if (!vscode.workspace.workspaceFolders || vscode.workspace.workspaceFolders.length === 0) {
        return [];
    }
    
    // Check for rust-analyzer.linkedProjects setting
    const config = vscode.workspace.getConfiguration('rust-analyzer');
    const linkedProjects = config.get<string[]>('linkedProjects') || [];
    
    if (linkedProjects.length > 0) {
        log(`Found ${linkedProjects.length} linked projects in rust-analyzer.linkedProjects`, 'debug');
        
        // Resolve linked projects paths relative to workspace root
        const workspaceRoot = vscode.workspace.workspaceFolders[0].uri.fsPath;
        
        for (const linkedProject of linkedProjects) {
            // Handle glob patterns
            if (linkedProject.includes('*')) {
                try {
                    const matches = glob.sync(linkedProject, { cwd: workspaceRoot });
                    for (const match of matches) {
                        cargoTomlPaths.push(path.resolve(workspaceRoot, match));
                    }
                } catch (error) {
                    log(`Error resolving glob pattern ${linkedProject}: ${error}`, 'error');
                }
            } else {
                // Regular path
                const resolvedPath = path.resolve(workspaceRoot, linkedProject);
                cargoTomlPaths.push(resolvedPath);
            }
        }
    } else {
        // If no linkedProjects, search for all Cargo.toml files
        log('No linked projects found, searching for all Cargo.toml files', 'debug');
        
        for (const folder of vscode.workspace.workspaceFolders) {
            try {
                const matches = glob.sync('**/Cargo.toml', { 
                    cwd: folder.uri.fsPath,
                    ignore: ['**/target/**', '**/node_modules/**'] 
                });
                
                for (const match of matches) {
                    cargoTomlPaths.push(path.join(folder.uri.fsPath, match));
                }
            } catch (error) {
                log(`Error searching for Cargo.toml in ${folder.uri.fsPath}: ${error}`, 'error');
            }
        }
        
        // Check for Cargo workspace
        for (const folder of vscode.workspace.workspaceFolders) {
            const rootCargoToml = path.join(folder.uri.fsPath, 'Cargo.toml');
            
            if (fs.existsSync(rootCargoToml)) {
                try {
                    const content = fs.readFileSync(rootCargoToml, 'utf8');
                    if (content.includes('[workspace]')) {
                        log('Found Cargo workspace manifest', 'debug');
                        
                        // Parse workspace members
                        const memberMatches = content.match(/members\s*=\s*\[(.*?)\]/s);
                        if (memberMatches?.[1]) {
                            const membersStr = memberMatches[1].replace(/"/g, '').replace(/'/g, '');
                            const members = membersStr.split(',').map(m => m.trim()).filter(Boolean);
                            
                            for (const member of members) {
                                // Handle glob patterns in workspace members
                                if (member.includes('*')) {
                                    try {
                                        const memberMatches = glob.sync(member, { cwd: folder.uri.fsPath });
                                        for (const match of memberMatches) {
                                            const memberPath = path.join(folder.uri.fsPath, match, 'Cargo.toml');
                                            if (fs.existsSync(memberPath) && !cargoTomlPaths.includes(memberPath)) {
                                                cargoTomlPaths.push(memberPath);
                                            }
                                        }
                                    } catch (error) {
                                        log(`Error resolving workspace glob pattern ${member}: ${error}`, 'error');
                                    }
                                } else {
                                    const memberPath = path.join(folder.uri.fsPath, member, 'Cargo.toml');
                                    if (fs.existsSync(memberPath) && !cargoTomlPaths.includes(memberPath)) {
                                        cargoTomlPaths.push(memberPath);
                                    }
                                }
                            }
                        }
                    }
                } catch (error) {
                    log(`Error parsing workspace manifest ${rootCargoToml}: ${error}`, 'error');
                }
            }
        }
    }
    
    // Add workspace settings
    log(`Found ${cargoTomlPaths.length} Cargo.toml files`, 'debug');
    return cargoTomlPaths;
}

/**
 * Gets project name from Cargo.toml
 */
function getProjectName(cargoTomlPath: string): string {
    try {
        const content = fs.readFileSync(cargoTomlPath, 'utf8');
        const packageMatch = content.match(/^\s*\[package\]\s*$([\s\S]*?)(?:^\s*\[|$)/m);
        
        if (packageMatch) {
            const packageSection = packageMatch[1];
            const nameMatch = packageSection.match(/^\s*name\s*=\s*["'](.+?)["']/m);
            
            if (nameMatch?.[1]) {
                return nameMatch[1];
            }
        }
        
        // Fallback if no name found
        return path.basename(path.dirname(cargoTomlPath));
    } catch (error) {
        log(`Error reading Cargo.toml at ${cargoTomlPath}: ${error}`, 'error');
        return path.basename(path.dirname(cargoTomlPath));
    }
}

/**
 * Shows a quickpick to select a project settings file to edit
 */
export async function showProjectSettingsSelector(): Promise<void> {
    // First, add workspace settings option
    const projects: ProjectInfo[] = [];
    
    if (vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 0) {
        const workspaceRoot = vscode.workspace.workspaceFolders[0].uri.fsPath;
        const workspaceSettingsPath = path.join(workspaceRoot, '.vscode', 'settings.json');
        const workspaceSettingsExists = fs.existsSync(workspaceSettingsPath);
        
        projects.push({
            label: 'VSCode Workspace Settings',
            cargoTomlPath: '',
            settingsPath: workspaceSettingsPath,
            description: '.vscode/settings.json',
            exists: workspaceSettingsExists
        });
    }
    
    // Find all Cargo.toml files
    const cargoTomlPaths = await findAllCargoTomlFiles();
    
    // Create project info for each Cargo.toml
    for (const cargoTomlPath of cargoTomlPaths) {
        const projectDir = path.dirname(cargoTomlPath);
        const projectName = getProjectName(cargoTomlPath);
        const settingsPath = path.join(projectDir, 'cargo-runner-settings.json');
        const settingsExists = fs.existsSync(settingsPath);
        
        projects.push({
            label: projectName,
            cargoTomlPath,
            settingsPath,
            description: vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 0
                ? path.relative(vscode.workspace.workspaceFolders[0].uri.fsPath, projectDir)
                : '',
            exists: settingsExists
        });
    }
    
    // Show quickpick
    const selectedProject = await vscode.window.showQuickPick(projects, {
        placeHolder: 'Select project to edit settings',
        ignoreFocusOut: true,
        matchOnDescription: true
    });
    
    if (!selectedProject) {
        return; // User cancelled
    }
    
    // If settings don't exist, create them
    if (!selectedProject.exists) {
        if (selectedProject.label === 'VSCode Workspace Settings') {
            // For workspace settings, we need to ensure the .vscode directory exists
            const vscodeDir = path.dirname(selectedProject.settingsPath);
            if (!fs.existsSync(vscodeDir)) {
                fs.mkdirSync(vscodeDir, { recursive: true });
            }
            
            if (!fs.existsSync(selectedProject.settingsPath)) {
                fs.writeFileSync(selectedProject.settingsPath, '{}', 'utf8');
            }
        } else {
            // For project settings
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
            
            fs.writeFileSync(
                selectedProject.settingsPath, 
                JSON.stringify(defaultSettings, null, 4), 
                'utf8'
            );
            
            vscode.window.showInformationMessage(`Created new settings file for ${selectedProject.label}`);
        }
    }
    
    // Open the settings file
    const document = await vscode.workspace.openTextDocument(selectedProject.settingsPath);
    await vscode.window.showTextDocument(document);
}