# VSCode Cargo Runner

> **10X Rust Developer Tool to Run, Build, or Test without Mental Overhead**

![cover](https://github.com/codeitlikemiley/cargo-runner/blob/main/images/cover.png?raw=true)

Cargo Runner is a powerful and intuitive tool designed to streamline the development workflow for Rust programmers. It integrates seamlessly into your development environment, allowing you to execute essential tasks like running, building, and testing Rust projects with minimal effort and maximum efficiency.

## Features

- **Context Aware Command Runner** : Just fire the Keystroke <kbd>CMD + R</kbd> let it do the magic of either doing cargo `run` | `build` | `test` | `bench`.

- **Makefile Integration**: Offers the ability to override Cargo run or Cargo build commands with a custom `Makefile`, providing more control and flexibility for complex build processes.

- **Enhanced Testing with Cargo-Nextest**: well-defined preset and integration to cargo-nextest command if it is installed it will replace the default `cargo test` command, if you need more power you can override arguments.

- **Override Arguments** : Quickly Override Command Arguments on different context such as: `run` , `build`, `test`, `bench`  and `env` using <kbd>CMD + SHIFT +R </kbd>

- **Codelldb Debugger Integration**: Automatically integrates with codelldb debugger for running Rust tests if there is a breakpoint.

- **Rust Analyzer Runnables Fallback**: Uses Rust Analyzer runnables if there is no supported context match, e.g., doc tests.

- **Support Cargo Workspace** : Cargo runner works on simply rust project to complex Cargo workspace.

## Demo Screenshot

### Cargo Run 

1. Go Inside any files that can be run :

    - `src/main.rs`
    - `src/bin/*`
    - `examples/*`
    - any file declare as [[bin]] on Cargo.toml

e.g.

```toml
[[bin]] 
path = "src/example.rs"
name ="example"
```

Note: the file you wanna run must have a `fn main block`

2. Press <kbd>CMD</kbd>+<kbd>R</kbd>


![Run](https://github.com/codeitlikemiley/cargo-runner/blob/main/images/run.png?raw=true)


---
### Cargo Build


1. Go to  Any `build.rs` file that has`fn main block`

2. Press <kbd>CMD</kbd>+<kbd>R</kbd> on Cursor

![Build](https://github.com/codeitlikemiley/cargo-runner/blob/main/images/build.png?raw=true)

---
### Cargo Test or Cargo Nextest (if installed) for specific test

1. Go to any file with `test block` supports  anykind of `test macro` e.g. #[test] or #[tokio::test]

2. Place your cursor inside the `test block` you wanna run test

3. Press <kbd>CMD</kbd>+<kbd>R</kbd> on  Cursor

Note: If `Cargo Nextest` is installed it would use that as default test runner instead of `cargo test`


![Test](https://github.com/codeitlikemiley/cargo-runner/blob/main/images/cargo-nextest.png?raw=true)


### Debug Test 

1. Add a breakpoint to any `test block`

2. Place your cursor inside the `test block` that have that breakpoint

3. Press <kbd>CMD</kbd>+<kbd>R</kbd>

![Run](https://github.com/codeitlikemiley/cargo-runner/blob/main/images/debug.png?raw=true)


### Fallback Runner (using rust-analyzer) for running all test


1. Place your cursor somewhere inside of a `mod test block`

2. Press <kbd>CMD</kbd>+<kbd>R</kbd> 


![fallback](https://github.com/codeitlikemiley/cargo-runner/blob/main/images/fallback.png?raw=true)



### Fallback Runner (using rust-analyzer) for running doc-test

1. Place your cursor somewhere inside a `doc test block`

2. Press <kbd>CMD</kbd>+<kbd>R</kbd> 


![fallback](https://github.com/codeitlikemiley/cargo-runner/blob/main/images/doc-test-fallback.png?raw=true)


### Adding Command Arguments

1. Press <kbd>CMD</kbd>+<kbd>SHIFT</kbd>+<kbd>R</kbd>

2. Choose context from any of the following options:
    - run
    - build
    - test
    - bench
    - env

3. Type those parameters you wanna add to override the default 

e.g. choose:  `env`

4. Type on the user input the args you wanna pass as override argument

e.g.
```sh
RUSTFLAGS="-Awarnings"
```

> Note: `.cargo_runner.toml` would be created per create , you can have multiple `.cargo_runner.toml` on workspace


> Important: You may wanna add this to `.gitignore` file


### Removing Command Arguments

1. Press <kbd>CMD</kbd>+<kbd>SHIFT</kbd>+<kbd>R</kbd>

2. Choose context from any of the following options:
    - run
    - build
    - test
    - bench
    - env

3. Press Enter (dont type anything)

This would remove the parameters `RUSTFLAGS="-Awarnings"` on .`cargo_runner.toml` file


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
