# Cargo Runner

> Open VSX | Vscode Marketplace

![Open VSX Downloads](https://img.shields.io/open-vsx/dt/masterustacean/cargo-runner) ![Vscode Marketplace](https://vsmarketplacebadges.dev/downloads-short/masterustacean.cargo-runner.svg)


</br>
</br>

> A Complementary Tool to [rust-analyzer](https://github.com/rust-analyzer/rust-analyzer) to streamline your Rust development and enhance your productivity.

![cover](https://github.com/codeitlikemiley/cargo-runner/blob/v2/images/icon.jpg?raw=true)

> No unicorns or crabs were harmed during the creation of this tool.

## Requirements

- rust-analyzer
- codelldb

**NOTE**: If these are missing, the extension will not load.

## Features

- Run code lens actions with a keyboard shortcut (⌘+R / Ctrl+R)
- Run specific tests, benchmarks, or functions with minimal clicks
- Supports Rust Analyzer integration
- Works with cargo-nextest
- Project-specific settings with cargo-runner-settings.json

## Setup

1. Install this extension from the VSCode marketplace
2. Ensure you have rust-analyzer and CodeLLDB extensions installed
3. You're ready to go!

## Usage

### Running Code

- Place your cursor on a function or test
- Press ⌘+R / Ctrl+R to run the nearest relevant symbol
- The extension will automatically find and execute the appropriate action

### Configuring Settings

You can override Rust Analyzer settings using the Cargo Runner configuration tool:

1. Press ⌘+Shift+R / Ctrl+Shift+R
2. Enter your configuration options
3. Choose where to save settings:
   - Workspace Settings (.vscode/settings.json)
   - Project Settings (cargo-runner-settings.json)

#### Project-Specific Settings

- Each Rust project can have its own `cargo-runner-settings.json` file
- These settings travel with your project and don't rely on VSCode's settings
- Open the command palette (⌘+Shift+P / Ctrl+Shift+P) and run "Cargo Runner: Edit Project Settings" to open a selector that shows all available Cargo projects

#### Settings Priority

Cargo Runner now intelligently handles settings from multiple sources:

- During command execution, project-specific settings from `cargo-runner-settings.json` are temporarily merged with workspace settings
- Project settings take precedence over workspace settings when both define the same property
- After command execution, workspace settings are restored to their original state
- This ensures that environment variables and other settings from your project file are properly used, even if there are already workspace settings defined

### Configuration Options

| Option | Description | Example |
|--------|-------------|---------|
| `--features` | Enable specific features | `--features=my-feature,another-feature` |
| `--no-default-features` | Disable default features | `--no-default-features` |
| `--cargo-target` | Set cargo target (rust-analyzer.cargo.target) | `--cargo-target=wasm32-unknown-unknown` |
| `--target` | Set target in extraArgs | `--target=wasm32-unknown-unknown` |
| `--target-dir` | Use a custom target directory | `--target-dir` |
| `ENV_VAR=value` | Set environment variables | `RUST_LOG=debug` |
| `#` | Delimiter for test binary args | `--release # --nocapture --exact` |
| `+channel` | Set Rust toolchain channel | `+nightly` |
| `@` | Append mode (start command with it) | `@ --release` |
| `!!` | Reset all configurations | `!!` |

### Update Modes

#### Replace Mode (Default)

By default, each configuration command replaces the settings sections that you specify:

```
# Replace cargo arguments with these new values
--release --quiet

# Replace features with these new values
--features=wasm,json
```

#### Append Mode

Use `@` at the beginning of your command to add to existing settings instead of replacing them:

```
# Start with @ to append to existing settings
@ --release --features=wasm
```

In append mode, the extension will:
1. Preserve all existing settings
2. Add any new settings you specify
3. Deduplicate arrays (no duplicates in features, extraArgs, or extraTestBinaryArgs)
4. Update single values where appropriate (like --no-default-features or environment variables)

This is particularly useful when you want to:
- Add a new argument without losing existing ones
- Add a new feature without removing existing ones
- Add a new environment variable while keeping existing ones

### Resetting Options

There are two ways to reset configurations:

1. **Reset Specific Settings** - Use `!` prefix:
   - `!features` - Reset cargo features
   - `!target` - Reset cargo target
   - `!targetDir` - Reset target directory
   - `!env` - Reset environment variables
   - `!#` - Reset test binary args
   - `!channel` - Reset Rust toolchain channel

2. **Reset All Settings** - Use `!!` to reset all configurations at once
   - For project settings, resets to default structure with empty arrays/objects
   - For workspace settings, removes all configuration entries completely

## Multi-Project Support

Cargo Runner automatically detects Rust projects in your workspace:

1. First, it checks the `rust-analyzer.linkedProjects` setting, if available
2. It also scans for `Cargo.toml` files throughout your workspace
3. It parses workspace manifests and detects all workspace members, including glob patterns

When using "Cargo Runner: Edit Project Settings", you'll see a list of all detected projects plus the workspace settings, allowing you to manage settings for any project in your workspace.

## Extension Settings

This extension contributes the following settings:

* `cargoRunner.prioritySymbolKinds`: Symbol kinds to prioritize (default: `["Function", "Enum", "Struct", "Object", "Module"]`)
* `cargoRunner.logLevel`: Set the logging level (default: `"error"`)
* `cargoRunner.cargoHome`: Path to Cargo home directory
* `cargoRunner.nextest.enable`: Enable cargo-nextest integration (default: `false`)

## License

This project is licensed under the MIT License.