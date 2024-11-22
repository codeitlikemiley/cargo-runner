# Cargo Runner V2

> Streamline your Rust development with Cargo Runner, a powerful tool that simplifies your workflow and enhances your productivity.


![cover](images/icon.jpg)

> No Unicorn and crab was harm during the creation of this tool.




## Features

- **Rust Analyzer Integration** - all default commands are derived from rust-analyzer

- **Rust Crate: `cargo-nextest` Integration** (optional) - faster way to run tests with multiple threads

- **Codelldb Debugger Integration** - to debug your code

- **Custom CommandConfig** to override command on different context

- **One Key to rule them all** - press <kbd>CMD</kbd>+<kbd>R</kbd> to run any command

- **Generate Blueprint from a Command** - Parse the command `--help` to generate an entry in the `config.toml` for specific context
- **Change Default Config for a Context** e.g. if you wanna override `cargo run` and replace it with `cargo leptos watch`
- **On Demand Overriding of Params , Options and Env** - used for quick prototyping and testing of different features 
- **Per Crate Override** - For simple overriding of params, options and env on `Cargo Workspace` level




## Use cases:


### Run 
1. Run Main
- Go to your `main.rs` file and press <kbd>CMD</kbd>+<kbd>R</kbd>

2. Other Binaries
- Go to any `src/bin/*.rs` file or to any files declared as `[[bin]]` in `Cargo.toml` and press <kbd>CMD</kbd>+<kbd>R</kbd>

3. Examples
- Go to any `examples/*.rs` file and press <kbd>CMD</kbd>+<kbd>R</kbd>



### Test
- Go to any test file or test function that has `#[test]` macro and press <kbd>CMD</kbd>+<kbd>R</kbd>


### Doc test
Note:  Doc test only works with a crate-type of `lib`
- Go to any `function` or `module` or `struct` that has a rust code block with or without assertions and press <kbd>CMD</kbd>+<kbd>R</kbd>


### Debugging

1. Binaries 
- Go to any binaries , add breakpoint and press <kbd>CMD</kbd>+<kbd>R</kbd>

2. Test
- Go to any `test fn` or `mod tests`  and press <kbd>CMD</kbd>+<kbd>R</kbd>

Note: This would only work if `codelldb` is installed.

### Bench

1. With Criterion Crate
- Go to `benches` folder or any `benches/*.rs` files and press <kbd>CMD</kbd>+<kbd>R</kbd> , if you press it inside a bench function it will ony run that bench, but if you press it outside any bench function it will run all benches of that currently opened file.

2. On Rust `nightly` version

- Go to any tests/*.rs that has #[bench] attribute and press <kbd>CMD</kbd>+<kbd>R</kbd> 



## Cargo Runner Blueprint

> Default Config are placed in `$HOME/.cargo-runner/config.toml`
> Per crate Config Override are placed in `.cargo-runner/config.toml`

### Example Config

NOTE: If for some reason you want to use other `cargo subcomand` or `other commands` on specific context. The CommandBuilder would use the default config to override the command.

See example below using `cargo-leptos` to replace `run` , `build` and `test`

<details>
<summary>config.toml</summary>

```toml
[test]
default = "leptos"

[[test.config]]
name = "default"
command_type = "cargo"
command = "cargo"
sub_command = "test"
allowed_subcommands = []

[test.config.env]

[[test.config]]
name = "leptos"
command_type = "subcommand"
command = "leptos"
sub_command = "test"
allowed_subcommands = []

[test.config.env]

[bench]
default = "default"

[[bench.config]]
name = "default"
command_type = "cargo"
command = "cargo"
sub_command = "bench"
allowed_subcommands = []

[bench.config.env]

[run]
default = "leptos"

[[run.config]]
name = "default"
command_type = "cargo"
command = "cargo"
sub_command = "run"
allowed_subcommands = []

[run.config.env]

[[run.config]]
name = "leptos"
command_type = "subcommand"
command = "leptos"
sub_command = "watch"
allowed_subcommands = []

[run.config.env]

[build]
default = "leptos"

[[build.config]]
name = "default"
command_type = "cargo"
command = "cargo"
sub_command = "build"
allowed_subcommands = []

[build.config.env]

[[build.config]]
name = "leptos"
command_type = "subcommand"
command = "leptos"
sub_command = "build"
allowed_subcommands = []

[build.config.env]
```

</details>

</br>



### Usage:

#### 1. Generate Blueprint from a command
- open command palette and select `Cargo Runner: Generate Blueprint`
- type the context you want to generated a `Blueprint`
- select the `cargo subcommand` or `any command` found on `$CARGO_HOME/bin/`

NOTE: This would auto generate the `allowed_subcommands` and `allowed_options` that is useful for `Command Validation` which prevents the user from running a command that is not valid.

#### 2. Set Default Config for a Context
- open command palette and select `Cargo Runner: Set Default Config for a Context`
- type the context you want to change the default config
- select from the list of `Blueprint` you want to set default

#### 3. Override params
- open command palette and select `Cargo Runner: Override params`
- type the context you want to override e.g. `run`
- type the parameters

Note: to remove all params/args, when prompted to enter the params, just press `enter` and it will remove all params/args

#### 4. Override options
- open command palette and select `Cargo Runner: Override options`
- type the context you want to override e.g. `run`
- type the options

Note: to remove all options, when prompted to enter the options, just press `enter` and it will remove all options

#### 5. Add Env
- open command palette and select `Cargo Runner: Add env`
- type the context you want to add env e.g. `run`
- type the env e.g. `RUST_BACKTRACE=1`

#### 6. Remove Env
- open command palette and select `Cargo Runner: Remove env`
- type the context you want to remove env e.g. `run`
- type the env key e.g. `RUST_BACKTRACE` ,or select from the list of env keys

NOTE: This gets add or remove from `.cargo-runner/config.toml` and is used to override the one define on `.cargo/config.toml`

<details>
<summary>config.toml</summary>

```toml
[env]
RUST_BACKTRACE = "1"
```

</details>

#### 5. Download config from a remote url
- open comamnd palette and select `Cargo Runner: Download config from a remote url`
- type the url you want to download the config from
- specify path to save the config

NOTE: All downloaded config by default gets merged with the existing config in `.cargo-runner/config.toml`



## [License](./LICENSE)

## [Changelog](./CHANGELOG.md)

### Support me

[![Sponsor on GitHub](https://img.shields.io/badge/Sponsor-💖-pink)](https://github.com/sponsors/codeitlikemiley)

If you think I help you in anyway, and want to help me keep doing what I love, the best way to say thank you is to sponsor me on GitHub.

 

---
