# Change Log

All notable changes to the "cargo-runner" extension will be documented in this file.

Check [Keep a Changelog](http://keepachangelog.com/) for recommendations on how to structure this file.

## 1.5.5
- Auto-update `rust-analyzer.server.extraEnv` if your cargo crates have multiple `rust-toolchain.toml`
- add note on read me on known issues and how to fix it on `rust-analyzer.server.extraEnv`
- update overrideCargo on codelens structure to make use of `active-toolchain` ,eg.`cargo +stable-aarch64-apple-darwin`
- Added support for `rust-toolchain.toml` file to add `channel` by typing `+beta` , `+nightly` or `+stable` when Overriding Config.
- Use Rust Analyzer Config and Cargo.toml to override args
- Better Documentation and examples on how to use the extension
- Better Check for missing extensions prior to loading the extension
- Removed `.cargo_runner.toml` and ability to override args
- Removed `Makefile` integration to override commands
- Removed `build` runner 
- Removed support for `criterion`
- Remove Runnables as it just makes your workflow slower , when picking options
- Use Rust Analyzer Codelens to Run , Test, Debug and Bench your Rust Project.
- Added fallback in cases no codelens. e.g. Running the whole file either as a `test` or `bench` or `run`
- Supports `cargo-nextest` integration tests
- Support `cargo-nextest` benchmark integration on `nightly` version
- Uses `codelldb` debugger integration for debugging
- Add ability to override $CARGO_HOME from vscode settings
- Add ability to change log level from vscode settings
- Add ability to change priority symbol kinds from vscode settings (You wouldnt want to change it though as the default is already well tested)
- Add nextest enable/disable from vscode settings
- Add Cargo Runner: Override Config Command and Keyboard Shortcut
- Support Rust Analyzer Config.
- Add Ability to Add one or more rust-analyzer config.
- Add Ability to Remove one or more rust-analyzer config.