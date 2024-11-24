# Cargo Runner

> Streamline your Rust development with Cargo Runner, a powerful tool that simplifies your workflow and enhances your productivity.

![cover](https://github.com/codeitlikemiley/cargo-runner/blob/v2/images/icon.jpg?raw=true)

> No Unicorn and crab was harm during the creation of this tool.

## Requirements

- rust-analyzer
- codelldb

**NOTE**: if this are missing then the extension will not be loaded

## Features

- [x] **One Key to rule them all** - press <kbd>CMD</kbd>+<kbd>R</kbd> to run any command. (can be re-mapped in keyboard shortcuts)

- [x] **Rust Analyzer Integration** - all default commands are derived from rust-analyzer

- [x] **Cargo Toml Integration** - parse useful `Metadata`  from `Cargo.toml`

- [x] **Override $CARGO_HOME**  from vscode settings

- [x] **Rust Crate: `cargo-nextest` Integration** (optional) - faster way to run tests with multiple threads

- [x] **Codelldb Debugger Integration** - to debug your code

## Use cases

### Run

1. Run Main

- Go to your `main.rs` file and press <kbd>CMD</kbd>+<kbd>R</kbd>

2. Other Binaries

- Go to any `src/bin/*.rs` file or to any files declared as `[[bin]]` in `Cargo.toml` and press <kbd>CMD</kbd>+<kbd>R</kbd>

3. Examples

- Go to any `examples/*.rs` file and press <kbd>CMD</kbd>+<kbd>R</kbd>

> **NOTE**: **main() fn** would be the **fallback** scope on any file , if **main() fn** exists on that file, considering it as the parent module to run cargo commands on.

> Even if your are on **main.rs** and you **don't have**  **main() fn** , it would'nt run any cargo commands on that file.

This gives us the ability to run **cargo build** on any build.rs file even if `rust-analyzer` doesn't support it.

### Test

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

NOTE: The scope varies , if your cursor is on the **scope outside** any **fn test** , it would then go up its **parent module** and run all the tests in that module. In the example above it would run all test on **mod tests** as its parent module.

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
    println!("Hello, world!"); <!-- add break point here
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

2. Add to the root of the module e.g. `main.rs` 

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

## [License](./LICENSE)

## [Changelog](./CHANGELOG.md)

### Support me

[![Sponsor on GitHub](https://img.shields.io/badge/Sponsor-💖-pink)](https://github.com/sponsors/codeitlikemiley)

If you think I help you in anyway, and want to help me keep doing what I love, the best way to say thank you is to sponsor me on GitHub.

---
