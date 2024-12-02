# Cargo Runner

> Streamline your Rust development with Cargo Runner, a powerful tool that simplifies your workflow and enhances your productivity.

![cover](https://github.com/codeitlikemiley/cargo-runner/blob/v2/images/icon.jpg?raw=true)

> No unicorns or crabs were harmed during the creation of this tool.

## Requirements

- rust-analyzer
- codelldb

**NOTE**: If these are missing, the extension will not load.

## Features

- [x] **Command Runner** - press <kbd>CMD</kbd>+<kbd>R</kbd> to run any command on your current cursor position.

- [x] **Override Rust Analyzer Config** - press <kbd>CMD</kbd>+<kbd>SHIFT</kbd>+<kbd>R</kbd> to override any rust-analyzer command.

- [x] **Cargo Toml Integration** - parse useful `Metadata`  from `Cargo.toml`

- [x] **Codelldb Debugger Integration** - add breakpoints to debug your code.

- [x] **Rust Analyzer Integration** - Override `rust-analyzer` config from vscode settings

- [x] **Cargo Nextest Integration** - Enable / Disable `cargo-nextest` from vscode settings

- [x] **Override $CARGO_HOME**  from vscode settings (used by `cargo-nextest`)

## Use cases

### Run

[read more about cargo run](https://doc.rust-lang.org/cargo/commands/cargo-run.html)

1. Run Main

- Go to your `main.rs` file and press <kbd>CMD</kbd>+<kbd>R</kbd>

2. Other Binaries

- Go to any `src/bin/*.rs` file or to any files declared as `[[bin]]` in `Cargo.toml` and press <kbd>CMD</kbd>+<kbd>R</kbd>

3. Examples

- Go to any `examples/*.rs` file and press <kbd>CMD</kbd>+<kbd>R</kbd>

> **NOTE**: **main() fn** would be the **fallback** scope on any file , if **main() fn** exists on that file, considering it as the parent module to run cargo commands on.

> Even if your are in **main.rs** and you **don't have**  **main() fn** , it will not execute any cargo commands in that file.

### Test

[read more about cargo test](https://doc.rust-lang.org/cargo/commands/cargo-test.html)

1. Create a test 

```rust
#[cfg(test)]
mod tests {
    #[test]
    fn it_works() {
        assert_eq!(2 + 2, 4);
    }

    #[test]
    fn it_works_too() {
        assert_eq!(2 + 2, 4);
    }
}
```

NOTE: The scope varies , if your cursor is on a **scope outside** any **fn test** , it will go up to its parent module and run all the tests in that module.

> To Enable `cargo-nextest` set `cargoRunner.enableNextest` to `true` in your `settings.json`

2.  Press <kbd>CMD</kbd>+<kbd>R</kbd> on any code block you want to run tests on

### Doc test

**WARNING**:  Doc test only works with a crate-type of `lib`

1. Add doc-test on a function e.g. `lib.rs`

```rust
///
/// ```rust
/// use common::add;
/// assert_eq!(add(1, 2), 3);
/// ```
pub fn add(left: usize, right: usize) -> usize {
    left + right
}
```

> doc-test works on any **function** or **method**, **Struct** , **Enum** and **Union** that has doc-block and code block of `rust`

NOTE: The scope varies , if you put your cursor on the **Struct** definition and that **Struct** has many doc-test on its **impl block** then it will run all of them. Same goes for **Enum** and **Union** .


2. Press <kbd>CMD</kbd>+<kbd>R</kbd> to run `doc-tests`


### Debugging

1. Add breakpoint on a rust file e.g. `main.rs` or any other rust file

```rust
fn main() {
    println!("Hello, world!"); // add break point here
}
```


2. Press <kbd>CMD</kbd>+<kbd>R</kbd> to debug the program

Note: This would only work if `codelldb` is installed.

> **REMINDER:** You cannot **debug** any **benchmarks** or **doc-tests** , when you try to debug **benches** it would just run the **cargo bench**

### Bench

1. set version of rust to `nightly`

```sh
rustup override set nightly
```

2. Add to the root of the module (e.g. `main.rs`)

Root module means

```rust
#![feature(test)]
extern crate test;
```

3. create a new bench fn

```rust
#[cfg(test)]
mod tests {
    use std::time::Duration;

    use test::Bencher;
    use tokio::{runtime::Runtime, time::sleep};

    #[bench]
    fn bench_async_example(b: &mut Bencher) {
        let runtime = Runtime::new().unwrap();

        b.iter(|| {
            runtime.block_on(async {
                sleep(Duration::from_millis(5000)).await;
                let x: u32 = (1..100).sum();
                x
            });
        });
    }
}
```

> **FEATURE** Supports `cargo-nextest` to run benchmarks



### Overriding/Configuring Rust Analyzer Settings

#### Rules:

**Rule 1**: You can either add or remove configurations, but not both at the same time.

**Rule 2**: You can combine one or more keywords when adding or removing configurations.

**Rule 3**: Order does not matter when typing keywords to add or remove configurations. However, when marking the start of test binary arguments with --, everything typed afterward will be saved as test binary arguments.

**Rule 4**: Removing configurations is marked with `!`  for more info head to [Removing Configuration](#removing-configuration)

#### Usage:

- Press <kbd>CMD</kbd>+<kbd>SHIFT</kbd>+<kbd>R</kbd> or bind it to a key you like.

- type the params , env, features, target, test binary args you want to add or remove.


#### Adding configuration

1. Adding Cargo Arguments

type: e.g. `--release --profile=default`

It would be saved on your `settings.json`  as follows

<details>
<summary>settings.json</summary>

```json
"rust-analyzer.runnables.extraArgs": [
        "--release",
        "profile=default"
],
```

Example command output:

```sh
cargo run --package codec --bin codec --release --profile=default
```

</details>

2. Adding Test Binary Args

**IMPORTANT**: The `--` should be added to mark the start of adding test binary args.

type: e.g. `-- --quiet --show-output --color=always --nocapture`

It would be saved on your `settings.json`  as follows

<details>
<summary>settings.json</summary>

```json
"rust-analyzer.runnables.extraTestBinaryArgs": [
        "--quiet",
        "--show-output",
        "--color=always",
        "--nocapture",
],
```

This would be used for both `cargo test` and `cargo-nextest` when generating the command to run.

example command output:
```sh
cargo test --package codec --bin codec -- tests::it_works --exact --quiet --show-output --color=always --nocapture
```

</details>

</br>

> **NOTE**: To check the allowed args for `cargo test` run **cargo test -- --help** in your terminal.

</br>

> **NOTE** To check the allowed args for `cargo-nextest` run **cargo nextest run --help** in your terminal.

</br>

3. Adding ENV vars

type e.g. `RUST_BACKTRACE=full RUST_LOG=debug`

it would be saved on your `settings.json`  as follows

<details>
<summary>settings.json</summary>

```json
"rust-analyzer.runnables.extraEnv": {
        "RUST_BACKTRACE": "full",
        "RUST_LOG": "debug"
}
```

</details>

4. Adding Features

[list all features on crates](https://doc.rust-lang.org/cargo/reference/features.html#inspecting-resolved-features)

[Resolver version 2 command-line flags](https://doc.rust-lang.org/cargo/reference/features.html#resolver-version-2-command-line-flags)

type e.g. `--features=example,default --no-default-features`

it would be saved on your `settings.json`  as follows

<details>
<summary>settings.json</summary>

```json
"rust-analyzer.cargo.noDefaultFeatures": true,
"rust-analyzer.cargo.features": [
        "example",
        "default"
],
```

example command output:

```sh
cargo run --package codec --bin codec --features example --features default --no-default-features
```

</details>


**NOTE** : This is not recommended for workspaces setup as any features define here would also be applied to all crates in the workspace.

For better control over features , check [Bonus](#bonus) section.


5. Add Target

type e.g. `--target=wasm32-unknown-unknown`

It would be saved on your `settings.json`  as follows

<details>

<summary>settings.json</summary>

```json
{
    "rust-analyzer.cargo.target": "wasm32-unknown-unknown",
}
```

</details>

6. Add rust-analyzer specific target directory 

type `--cargo-target-dir`

It would be saved on your `settings.json`  as follows

<details>
<summary>settings.json</summary>

```json
{
"rust-analyzer.cargo.targetDir": true,
}
```

</details>

> This prevents rust-analyzer's cargo check and initial build-script and proc-macro building from locking the Cargo.lock at the expense of duplicating build artifacts.


#### Removing Configuration

1. Remove Extra Args : type `!args` or just `!` for shortcut

2. Removing Test Binary Args : type `!--` 

3. Removing ENV vars : type `!env`

4. Removing Features : type `!features`

5. Removing Target : type `!target`

6. Removing Cargo Target Dir: type `!targetDir`


---

### Bonus

Note: This is not part of the plugin but is a Cargo-related feature that helps manage your workspace.

<details>
<summary>
1. Using Required features **(Recommended)**
</summary>

[required-features field](https://doc.rust-lang.org/cargo/reference/cargo-targets.html#the-required-features-field)

 This is only relevant for the [[bin]], [[bench]], [[test]], and [[example]] sections, it has no effect on [lib].


 ```toml
 [lib]
name = "foo"           # The name of the target.
path = "src/lib.rs"    # The source file of the target.
test = true            # Is tested by default.
doctest = true         # Documentation examples are tested by default.
bench = true           # Is benchmarked by default.
doc = true             # Is documented by default.
proc-macro = false     # Set to `true` for a proc-macro library.
harness = true         # Use libtest harness.
edition = "2015"       # The edition of the target.
crate-type = ["lib"]   # The crate types to generate.
required-features = [] # Features required to build this target (N/A for lib).
```

 [target auto discovery](https://doc.rust-lang.org/cargo/reference/cargo-targets.html#target-auto-discovery)


Note: The list of targets can be configured in the Cargo.toml manifest, often inferred automatically by the directory layout of the source files.

This is the default directory layout for any cargo project.

```sh
 .
├── Cargo.lock
├── Cargo.toml
├── src/
│   ├── lib.rs
│   ├── main.rs
│   └── bin/
│       ├── named-executable.rs
│       ├── another-executable.rs
│       └── multi-file-executable/
│           ├── main.rs
│           └── some_module.rs
├── benches/
│   ├── large-input.rs
│   └── multi-file-bench/
│       ├── main.rs
│       └── bench_module.rs
├── examples/
│   ├── simple.rs
│   └── multi-file-example/
│       ├── main.rs
│       └── ex_module.rs
└── tests/
    ├── some-integration-tests.rs
    └── multi-file-test/
        ├── main.rs
        └── test_module.rs
```

Note: This would only work if you already defined your features on `Cargo.toml`



Example:

`Cargo.toml`

```toml
[[bin]]
name = "codec"
path = "src/main.rs"
required-features = ["example"]

[features]
default = ["example"]
example = []
```

The **required-features** field allows fine-grained control over specific binaries or libraries, unlike overriding **rust-analyzer.cargo.features**, which applies on workspace level.

**path** field can be **inferred** from the **directory layout** of the source files.

The path field specifies where the source for the crate is located, relative to the Cargo.toml file.

If not specified, the inferred path is used based on the target name.

</details>

## Issues
If you find any issues please open an issue on the [github repo](https://github.com/codeitlikemiley/cargo-runner/issues/new).

Note: You can set the `Cargo Runner: Log Level` to **debug** on vscode settings to get more info on what is happening.

## [License](./LICENSE)

## [Changelog](./CHANGELOG.md)

### Support me

[![Sponsor on GitHub](https://img.shields.io/badge/Sponsor-💖-pink)](https://github.com/sponsors/codeitlikemiley)

If you think I help you in anyway, and want to help me keep doing what I love, the best way to say thank you is to sponsor me on GitHub.

---
