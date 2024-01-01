# VSCode Cargo Runner

> **10X Rust Developer Tool to Run, Build, or Test without Mental Overhead**

![cover](./images/cover.png)

Cargo Runner is a powerful and intuitive tool designed to streamline the development workflow for Rust programmers. It integrates seamlessly into your development environment, allowing you to execute essential tasks like running, building, and testing Rust projects with minimal effort and maximum efficiency.

## Features

- **Context-Aware Commands**: Commands are triggered near your cursor, making the development process more intuitive and less disruptive.
- **Intelligent Cargo.toml Parsing**: Automatically detects and parses Cargo.toml if the current file is of type bin or lib. This feature is essential for build operations and ensures that your project's configuration is always up-to-date.
- **One-Key Compilation & Execution**: Bind Cargo run/build/test commands to a single keymap (CMD + R or CTRL + R), enabling swift project compilation and execution.
- **Makefile Integration**: Offers the ability to override Cargo run or Cargo build commands with a custom `Makefile`, providing more control and flexibility for complex build processes.
- **Enhanced Testing with Cargo-Nextest**: Integrates with `cargo-nextest` (if installed) to offer up to 3x better performance on tests. This feature optimizes test execution, making it faster and more efficient.
- **Real-Time Feedback**: Immediate visual feedback on the status of build and test processes, helping you identify and fix issues more quickly.
- **Customizable Environment**: Tailor Cargo Runner to your workflow with customizable settings and keybindings.

## Demo Screenshot

![Run](./images/run.png)
---
![Build](./images/build.png)
---
![Test](./images/nextest.png)

## Advanced Features

<details>
<summary> Custom Build Scripts with Makefile.</summary>

Create a Makefile on Rust project, you can have multiple Makefile if your working with Cargo Workspace
The choice is yours

![Makefile](./images/makefile.png)

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

---

By providing a comprehensive and user-friendly tool, Cargo Runner aims to significantly enhance the productivity and efficiency of Rust developers. 
