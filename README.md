# VSCode Cargo Runner

> **10X Rust Developer Tool to Run, Build, or Test without Mental Overhead**

![cover](https://github.com/codeitlikemiley/cargo-runner/blob/main/images/cover.png?raw=true)

Cargo Runner is a powerful and intuitive tool designed to streamline the development workflow for Rust programmers. It integrates seamlessly into your development environment, allowing you to execute essential tasks like running, building, and testing Rust projects with minimal effort and maximum efficiency.

## Features

- **Context-Aware Commands**: Commands are triggered near your cursor, making the development process more intuitive and less disruptive.
- **Intelligent Cargo.toml Parsing**: Automatically detects and parses Cargo.toml if the current file is of type bin or lib. This feature is essential for build operations and ensures that your project's configuration is always up-to-date.
- **One-Key Compilation & Execution**: Bind Cargo run/build/test commands to a single keymap (CMD + R or CTRL + R), enabling swift project compilation and execution.
- **Makefile Integration**: Offers the ability to override Cargo run or Cargo build commands with a custom `Makefile`, providing more control and flexibility for complex build processes.
- **Enhanced Testing with Cargo-Nextest**: Integrates with `cargo-nextest` (if installed) to offer up to 3x better performance on tests. This feature optimizes test execution, making it faster and more efficient.
- **Real-Time Feedback**: Immediate visual feedback on the status of build and test processes, helping you identify and fix issues more quickly.
- **Customizable Environment**: Tailor Cargo Runner to your workflow with customizable settings and keybindings.

- **Override Arguments** : Quickly Override Command Arguments on different context such as: `run` , `build`, `test`, `doctest` and `bench` 

## Demo Screenshot

### Override Arguments

> Adding Arguments
1. Press <kbd>CMD</kbd>+<kbd>SHIFT</kbd>+<kbd>R</kbd>
2. Choose context from any of the following options:
    - run
    - build
    - test
    - doctest
    - bench
3. Type those parameters you wanna add to override the default 
e.g. 

```sh
--jobs 5 --all-features
```
> Removing Arguments
1. Press <kbd>CMD</kbd>+<kbd>SHIFT</kbd>+<kbd>R</kbd>

2. Choose context from any of the following options:
    - run
    - build
    - test
    - doctest
    - bench
3. Press Enter (dont type anything)

This would remove the parameters `--jobs 5 --all-features` on .`cargo_runner.toml` file


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

![Test](https://github.com/codeitlikemiley/cargo-runner/blob/main/images/nextest.png?raw=true)
---
### Doc Test (Lib crate ONLY)
> Press <kbd>CMD</kbd>+<kbd>R</kbd> on  Cursor Any file on crate Type `lib` that has doc test

1. Multiline Comment Doctest
```rust
/**
    Logout from the service
    ```
    use crate::auth_service::auth::auth_service_server::AuthService;
    use crate::auth_service::auth::{LogoutRequest, LogoutResponse};
    use crate::auth_service::auth_impl::AuthServiceImpl;
    use tonic::Request;

    let service = AuthServiceImpl::default();
    let request = Request::new(LogoutRequest {
        token: "".to_string(),
    });
    let rt = tokio::runtime::Runtime::new();
    let response = rt.unwrap().block_on(service.logout(request)).unwrap();
    assert_eq!(response.into_inner().success, true);
    ```
    */
    async fn logout(
```

2. using Doc Macro Doc Test

```rust
#[doc = r#"Signup to the service
use crate::auth_service::auth::auth_service_server::AuthService;
use crate::auth_service::auth::{SignupRequest, SignupResponse};
use crate::auth_service::auth_impl::AuthServiceImpl;
use tonic::Request;
let service = AuthServiceImpl::default();
let request = Request::new(SignupRequest {
    username: "Tonic".to_string(),
    password: "".to_string(),
});
let rt = tokio::runtime::Runtime::new();
let response = rt.unwrap().block_on(service.signup(request)).unwrap();
assert_eq!(response.into_inner().token, "Hello Tonic!".to_string());
```"#]
```
3. Single Line /// comment Doc Test
```rust
///    Logout from the service
///    ```
///    use crate::auth_service::auth::auth_service_server::AuthService;
///    use crate::auth_service::auth::{LogoutRequest, LogoutResponse};
///    use crate::auth_service::auth_impl::AuthServiceImpl;
///    use tonic::Request;
///
///    let service = AuthServiceImpl::default();
///    let request = Request::new(LogoutRequest {
///        token: "".to_string(),
///    });
///    let rt = tokio::runtime::Runtime::new();
///    let response = rt.unwrap().block_on(service.logout(request)).unwrap();
///    assert_eq!(response.into_inner().success, true);
///    ```
```

![Test](https://github.com/codeitlikemiley/cargo-runner/blob/main/images/doc-test.png?raw=true)

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
