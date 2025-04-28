# Cargo Runner

> Open VSX | Vscode Marketplace

![Open VSX Downloads](https://img.shields.io/open-vsx/dt/masterustacean/cargo-runner) ![Vscode Marketplace](https://vsmarketplacebadges.dev/downloads-short/masterustacean.cargo-runner.svg)


</br>
</br>

> A Complementary Tool to [rust-analyzer](https://github.com/rust-analyzer/rust-analyzer) to streamline your Rust development and enhance your productivity.

![cover](https://github.com/codeitlikemiley/cargo-runner/blob/v2/images/icon.jpg?raw=true)

> No unicorns or crabs were harmed during the creation of this tool.

## Requirements

- [rust-analyzer](https://marketplace.visualstudio.com/items?itemName=rust-lang.rust-analyzer)
- [codelldb](https://marketplace.visualstudio.com/items?itemName=vadimcn.vscode-lldb)

## Usage

1. Open a Rust file in VS Code
2. Position your cursor within a function, struct, module, or other symbols
3. Click on the CodeLens buttons that appear above the symbol (▶︎ Run, Debug, ▶︎ Run Test, etc.)
4. Use `Ctrl+R` (`Cmd+R` on macOS) to quickly run the code at the cursor position

## Configuration

You can configure the extension using the command palette:

### Override Configuration Syntax

Use the override syntax for quick configuration changes:
- Press `Ctrl+Shift+R` (`Cmd+Shift+R` on macOS).
- Or, use `Ctrl+Shift+P` (`Cmd+Shift+P` on macOS) and type **`Cargo Runner: Override Config`**.

### Edit Project Settings File

Directly edit project-specific settings:
- Use `Ctrl+Shift+P` (`Cmd+Shift+P` on macOS) and type **`Cargo Runner: Edit Project Settings`** to access a dropdown list of settings files (`cargo-runner-settings.json` or `.vscode/settings.json`) you can manually edit.


## Configuration Options (Override Syntax)

The following options can be used with the **`Cargo Runner: Override Config`** command:

| Option | Description | Project Setting | VSCode Setting | Example |
|--------|-------------|----------------|---------------|---------|
| `--features` | Enable specific features | `runnables.extraArgs` | `rust-analyzer.cargo.features` | `--features=my-feature,another-feature` |
| `--no-default-features` | Disable default features | `runnables.extraArgs` | `rust-analyzer.cargo.noDefaultFeatures` | `--no-default-features` |
| `--cargo-target` | Set cargo target | `runnables.extraArgs` | `rust-analyzer.cargo.target` | `--cargo-target=wasm32-unknown-unknown` |
| `--target` | Set target in extraArgs | `runnables.extraArgs` | `rust-analyzer.runnables.extraArgs` | `--target=wasm32-unknown-unknown` |
| `--target-dir` | Use custom target directory | `runnables.extraArgs` | `rust-analyzer.cargo.targetDir` | `--target-dir` |
| `ENV_VAR=value` | Set environment variables | `runnables.extraEnv` | `rust-analyzer.runnables.extraEnv` | `RUST_LOG=debug` |
| `#` | Delimiter for test binary args | `runnables.extraTestBinaryArgs` | `rust-analyzer.runnables.extraTestBinaryArgs` | `--release # --nocapture --exact` |
| `+channel` | Set Rust toolchain channel | Creates `rust-toolchain.toml` | Creates `rust-toolchain.toml` | `+nightly` |
| `@` | Append mode (start with it) | Appends to existing settings | Appends to existing settings | `@ --release` |
| `!!` | Reset all configurations | Resets all options | Resets all options | `!!` |
| `!features` | Reset features | Resets `cargo.features` | Resets `rust-analyzer.cargo.features` | `!features` |
| `!target` | Reset cargo target | Deletes `cargo.target` | Resets `rust-analyzer.cargo.target` | `!target` |
| `!targetDir` | Reset target directory | Deletes `cargo.targetDir` | Resets `rust-analyzer.cargo.targetDir` | `!targetDir` |
| `!channel` | Reset Rust toolchain | Removes `rust-toolchain.toml` | Removes `rust-toolchain.toml` | `!channel` |
| `!env` | Reset environment variables | Resets `runnables.extraEnv` | Resets `rust-analyzer.runnables.extraEnv` | `!env` |
| `!#` | Reset test binary args | Resets `runnables.extraTestBinaryArgs` | Resets `rust-analyzer.runnables.extraTestBinaryArgs` | `!#` |
| `!` | Reset extra args | Resets `runnables.extraArgs` | Resets `rust-analyzer.runnables.extraArgs` | `!` |

### Override Syntax Examples
```
--features my-feature,another-feature
```

```
--no-default-features --release
```

```
DATABASE_URL=postgres://localhost/mydb DEBUG=true
```

```
@ --features my-feature
```
(Append mode - adds to existing settings)

## Extension Settings

* `cargoRunner.prioritySymbolKinds`: Symbol kinds to prioritize for CodeLens actions
* `cargoRunner.logLevel`: Set the logging level for Cargo Runner
* `cargoRunner.cargoHome`: Path to Cargo home directory
* `cargoRunner.nextest.enable`: Enable cargo-nextest integration

## Contributing

We welcome contributions! Please feel free to submit pull requests or open issues on our [GitHub repository](https://github.com/codeitlikemiley/cargo-runner).

## License

This extension is licensed under the MIT License.