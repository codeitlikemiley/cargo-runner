# Cargo Runner V2

> Streamline your Rust development with Cargo Runner, a powerful tool that simplifies your workflow and enhances your productivity.


![cover](https://github.com/codeitlikemiley/cargo-runner/blob/v2/images/icon.jpg?raw=true)

> No Unicorn and crab was harm during the creation of this tool.


## Requirements 
- rust-analyzer 
- codelldb

**NOTE**: if this are missing then the extension will not be loaded

## Features

- [x] **One Key to rule them all** - press <kbd>CMD</kbd>+<kbd>R</kbd> to run any command

- [x] **Rust Analyzer Integration** - all default commands are derived from rust-analyzer

- [x] **Cargo Toml Integration** - parse useful `Metadata`  from `Cargo.toml`

- [x] **Override $CARGO_HOME**  from vscode settings

- [x] **Rust Crate: `cargo-nextest` Integration** (optional) - faster way to run tests with multiple threads

- [x] **Codelldb Debugger Integration** - to debug your code


## Use cases:


### Run 
1. Run Main
- Go to your `main.rs` file and press <kbd>CMD</kbd>+<kbd>R</kbd>

2. Other Binaries
- Go to any `src/bin/*.rs` file or to any files declared as `[[bin]]` in `Cargo.toml` and press <kbd>CMD</kbd>+<kbd>R</kbd>

3. Examples
- Go to any `examples/*.rs` file and press <kbd>CMD</kbd>+<kbd>R</kbd>



### Test
- Go to any test file or mod tests or test function that has `#[test]` macro and press <kbd>CMD</kbd>+<kbd>R</kbd>


### Doc test
Note:  Doc test only works with a crate-type of `lib`
- Go to any `function` or `module` or `struct` or `Enum` that has a rust code block with or without assertions and press <kbd>CMD</kbd>+<kbd>R</kbd>


### Debugging

1. Binaries 
- Go to any binaries , add breakpoint and press <kbd>CMD</kbd>+<kbd>R</kbd>

2. Test
- Go to any `test fn` or `mod tests`  and press <kbd>CMD</kbd>+<kbd>R</kbd>

Note: This would only work if `codelldb` is installed.

> **REMINDER:** You cannot **debug** any **benchmarks** or **doc-tests** , when you try to debug **benches** it would just run the **cargo bench**

### Bench

1. On Rust `nightly` version

- Go to any tests/*.rs that has #[bench] attribute and press <kbd>CMD</kbd>+<kbd>R</kbd> 


> **FEATURE** Supports `cargo-nextest` to run benchmarks


## [License](./LICENSE)

## [Changelog](./CHANGELOG.md)

### Support me

[![Sponsor on GitHub](https://img.shields.io/badge/Sponsor-💖-pink)](https://github.com/sponsors/codeitlikemiley)

If you think I help you in anyway, and want to help me keep doing what I love, the best way to say thank you is to sponsor me on GitHub.


---
