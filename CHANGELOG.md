# Change Log

All notable changes to the "cargo-runner" extension will be documented in this file.

Check [Keep a Changelog](http://keepachangelog.com/) for recommendations on how to structure this file.

## 1.6.2
- Added "--features=all" to set `"rust-analyzer.cargo.features": "all",` instead of pushing it to an array

## 1.6.0

### Added
- New `env_handler.ts` module for reliable environment variable handling.
- Task-based execution method for properly passing environment variables to Cargo commands.
- New `useTaskExecution` setting to control environment variable handling method.
- Enhanced `nextest` integration with proper environment variable support.
- Improved debugging information about environment variables in Output Channel.
- Added support for per-project settings via `cargo-runner-settings.json`.
- Added `@` prefix for append mode to merge with existing settings.
- Support for `#` delimiter to separate cargo arguments from test binary arguments.

### Changed
- Consolidated command-line argument handling approach.
  - For project settings, most cargo options now use `runnables.extraArgs`.
  - For workspace settings, both approaches remain supported.
- Updated project settings template to include `useTaskExecution: true` by default.
- Improved error handling for environment variables and command execution.
- Enhanced `nextest` argument handling when using task execution.
- Enhanced settings management to support both per-project and workspace settings.

### Fixed
- Fixed environment variables not being passed to Rust programs.
- Fixed handling of command-line arguments with spaces or special characters.
- Improved error reporting when environment variables can't be set.
- Fixed settings management to support project-specific configurations.
- Fixed append mode (`@`) to properly merge with existing settings.
- Fixed test binary arguments delimited by `#` to be properly passed to test executables.
- Improved toolchain management with `+channel` syntax.

### Documentation
- Updated README with comprehensive environment variable documentation.
- Added detailed configuration options table with project vs. workspace settings.
- Expanded troubleshooting section with environment variable guidance.
- Added examples for environment variable configuration.
- Added comprehensive documentation for per-project settings via `cargo-runner-settings.json`.
- Added documentation for append mode with `@` prefix.
- Added examples for using the `#` delimiter for test binary arguments.
- Improved command-line configuration documentation with clear examples.

## 1.5.6
- Update `rust-analyzer.cargo.target` with `--cargo-target` flag while `--target` would be `rust-analyzer.cargo.extraArgs`
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