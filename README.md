# Cargo Runner

> Streamline your Rust development with Cargo Runner, a powerful tool that simplifies your workflow and enhances your productivity.


![cover](images/icon.jpg)

> No Unicorn and crab was harm during the creation of this tool.




## Features

- **Rust Analyzer Integration** 

- **Rust Crate: `cargo-nextest` Integration**

- **Codelldb Debugger Integration**




## Usage:

NOTE: By default it would use the default config for the context you are in, or if no config is present it would fallback to using `rust-analyzer` or `cargo` to run the command.

### Run 
- Go to `main.rs` or any `src/bin/*.rs` files or any `examples/*.rs` and press <kbd>CMD</kbd>+<kbd>R</kbd>

### Test
- Go to any test file or test function and press <kbd>CMD</kbd>+<kbd>R</kbd>


### Doc test
- Go to any `lib.rs` file or any modules used on your library that has a doc block with assertion and press <kbd>CMD</kbd>+<kbd>R</kbd>


### Debugging
- Add any breakpoint and press  press <kbd>CMD</kbd>+<kbd>R</kbd>

### Bench
- Go to `benches` folder or any `benches/*.rs` files and press <kbd>CMD</kbd>+<kbd>R</kbd>


## Advanced Usage:

Sometimes `cargo` or `rust-analyzer` cannot determine the correct command to run. e.g. you want to run `cargo-leptos` or `dx`. In this case you can override the default config specific for the context and crates you are working on.


> Default Config are placed in `$HOME/.cargo-runner/config.toml`
> Per crate Config Override are placed in `.cargo-runner/config.toml`

### Generate CommandConfig
- open comamnd palette and select `Cargo Runner: Generate CommandConfig`
- type the context you want to generated Config
- select the `cargo subcommand` or `any command` found on `$CARGO_HOME/bin/`

### Set Default Config for a Context
- open comamnd palette and select `Cargo Runner: Set Default Config for a Context`
- type the context you want to change the default config
- select from the list of `CommandConfig` you want to set default

### Set Default Config for all Contexts
- open comamnd palette and select `Cargo Runner: Set Default Config for all Contexts`
- select from the list of `CommandConfig` you want to set default


### Override the parameters of the default config
- open comamnd palette and select `Cargo Runner: Override the parameters of the default config`
- type the context you want to override
- type the parameters you want to override

### Download config from a remote url
- open comamnd palette and select `Cargo Runner: Download config from a remote url`
- type the url you want to download the config from





## [License](./LICENSE)

## [Changelog](./CHANGELOG.md)

### Support me

[![Sponsor on GitHub](https://img.shields.io/badge/Sponsor-💖-pink)](https://github.com/sponsors/codeitlikemiley)

If you think I help you in anyway, and want to help me keep doing what I love, the best way to say thank you is to sponsor me on GitHub.

 

---
