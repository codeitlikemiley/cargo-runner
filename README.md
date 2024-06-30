# VSCode Cargo Runner

> **10X Rust Developer Tool to Run, Build, or Test without Mental Overhead**

![cover](https://github.com/codeitlikemiley/cargo-runner/blob/main/images/cover.png?raw=true)

Cargo Runner is a powerful and intuitive tool designed to streamline the development workflow for Rust programmers. It integrates seamlessly into your development environment, allowing you to execute essential tasks like running, building, and testing Rust projects with minimal effort and maximum efficiency.

## Features

- **Context Aware Commands** : Just fire the Keystroke <kbd>CMD + R</kbd> let it do the magic of either doing cargo `run` | `build` | `test` | `bench`.

- **Makefile Integration**: Offers the ability to override Cargo run or Cargo build commands with a custom `Makefile`, providing more control and flexibility for complex build processes.

- **Enhanced Testing with Cargo-Nextest**: well-defined preset and integration to cargo-nextest command if it is installed it will replace the default `cargo test` command, if you need more power you can override arguments.

- **Override Arguments** : Quickly Override Command Arguments on different context such as: `run` , `build`, `test`, `bench`  and `env` using <kbd>CMD + SHIFT +R </kbd>

- **Codelldb Debugger Integration**: Automatically integrates with codelldb debugger for running Rust tests if there is a breakpoint.

- **Rust Analyzer Runnables Fallback**: Uses Rust Analyzer runnables if there is no supported context match, e.g., doc tests.

## Demo Screenshot

### Debug Test 

1. Add a breakpoint to any test
2. Press <kbd>CMD</kbd>+<kbd>R</kbd> on Cursor

![Run](https://github.com/codeitlikemiley/cargo-runner/blob/main/images/debug.png?raw=true)

### Cargo Run 

> Press <kbd>CMD</kbd>+<kbd>R</kbd> on Cursor

1. Simple Rust project with `src/main.rs`
2. Any Rust file that has main function located at `/bin/*` folder (Implicit not declared on Cargo.toml)
3. any file declared as [[bin]] on Cargo.toml e.g.

```toml
[[bin]] 
path = "src/example.rs"
name ="example"
```
4. Workspace Crates

![Run](https://github.com/codeitlikemiley/cargo-runner/blob/main/images/run.png?raw=true)

Note: Since version `1.3.2` , you can also `run` or `test` files on `examples/` folder

---
### Cargo Build

> Press <kbd>CMD</kbd>+<kbd>R</kbd> on Cursor
1. Any build.rs file that has main() fn

![Build](https://github.com/codeitlikemiley/cargo-runner/blob/main/images/build.png?raw=true)
---
### Cargo Test or Cargo Nextest (if installed)
> Press <kbd>CMD</kbd>+<kbd>R</kbd> on  Cursor
1. Any file on lib.rs or main.rs or file declared as [[bin]] that has the macro : #[test] and #[tokio::test]

Note: If you press inside the context of function test then it would run that single test, if you run it outside any function test which is inside any mod test it would run the whole test

![Test](https://github.com/codeitlikemiley/cargo-runner/blob/main/images/cargo-nextest.png?raw=true)

### Fallback Runner (using rust-analyzer)
1. Press <kbd>CMD</kbd>+<kbd>R</kbd> 

> where mouse context is outside of supported context by cargo runner 

e.g. `mod test code block` it would use `rust-analyzer` as fallback runner

![fallback](https://github.com/codeitlikemiley/cargo-runner/blob/main/images/fallback.png?raw=true)

### Running Doc test (using rust-analyzer)
1. Press <kbd>CMD</kbd>+<kbd>R</kbd> 

> where mouse context is outside of supported context by cargo runner 

e.g. `doc block` it would use `rust-analyzer` as fallback runner

![fallback](https://github.com/codeitlikemiley/cargo-runner/blob/main/images/doc-test-fallback.png?raw=true)

### Override Arguments

> Adding Arguments
1. Press <kbd>CMD</kbd>+<kbd>SHIFT</kbd>+<kbd>R</kbd>
2. Choose context from any of the following options:
    - run
    - build
    - test
    - bench
    - env
3. Type those parameters you wanna add to override the default 
e.g.  `env`

```sh
RUSTFLAGS="-Awarnings"
```

> Removing Arguments
1. Press <kbd>CMD</kbd>+<kbd>SHIFT</kbd>+<kbd>R</kbd>

2. Choose context from any of the following options:
    - run
    - build
    - test
    - bench
    - env

3. Press Enter (dont type anything)

This would remove the parameters `RUSTFLAGS="-Awarnings"` on .`cargo_runner.toml` file

NOTE: On Cargo workspace each crate can have their own `.cargo_runnner.toml` or set one at Workspace root as default to all crates.

---

## Advanced Features

<details>
<summary> Custom Build Scripts with Makefile.</summary>

Create a Makefile on Rust project, you can have multiple Makefile if your working with Cargo Workspace
The choice is yours

![Makefile](https://github.com/codeitlikemiley/cargo-runner/blob/main/images/makefile.png?raw=true)

below is example makefile , you can add to you project to test 

```
# Makefile for a Rust project using cargo-leptos and cargo-nextest

# Default target
.PHONY: all
all: build

# Build target
.PHONY: build
build:
	cargo build --package REPLACE_WITH_YOUR_PACKAGE_NAME

.PHONY: run
run:
	cargo run --package REPLACE_WITH_YOUR_PACKAGE_NAME --bin REPLACE_WITH_YOUR_BIN_NAME

# Test target
.PHONY: test
test:
	cargo test

# Clean up
.PHONY: clean
clean:
	cargo clean
```
</details>



## [License](./LICENSE)

## [Changelog](./CHANGELOG.md)

---

By providing a comprehensive and user-friendly tool, Cargo Runner aims to significantly enhance the productivity and efficiency of Rust developers. 
