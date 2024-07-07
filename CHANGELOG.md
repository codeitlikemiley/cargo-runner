# Change Log

All notable changes to the "cargo-runner" extension will be documented in this file.

Check [Keep a Changelog](http://keepachangelog.com/) for recommendations on how to structure this file.
## 1.4.5
- support wide variety of test macro

```sh
#[test]
#[tokio::test]
#[test_log::test]
#[test(tokio::test)]
#[bench]
#[test_env_log::test]
#[any_test]
#[test_any]
```
## 1.4.4
- make running command vscode task
## 1.4.2
- add support running test on bin/* folders
## 1.4.1
- drop support for single file script in rust
## 1.4.0
- clean up code use commandArray to filter out empty string on command args
- support test debugger if we have a breakpoint
- fix issue with wrong regex pattern causing rare case not matching a test block
## 1.3.5
- drop support for doctest
- use rust-analyzer as fallback (we can run doctest using this)
- cleanup
## 1.3.4
- fix doc test, if we run test on struct it would run all test, if on impl block it would run the fn
## 1.3.3
- fix examples missing package name
- fix integration test implementation with cargo-nextest
- use commandArray and filter for falsey values to generate final command
- find_modules supports other special cases like examples/

## 1.3.2
- Remove module path , replace with get_module path , now properly resolve and match nested modules, thus returning correct module name
- Set default test args if nothing set to .cargo_runner.toml file test
- Added support to run and test on example files
- added env on cargo_runner.toml to have ability to pass in ENV Variables e.g. `RUSTFLAGS="-Awarnings"`
- .cargo_runner.toml is now per-crate, and if you to use a default for all crates just create one on your workspace root
- fix get_modules on cargo workspace
- fix find_module on cargo workspace
- fix missing crate type for build.rs 
- fix #[test] macro not considered as in test context
## 1.3.0
- [Fix issue on override](https://github.com/codeitlikemiley/cargo-runner/issues/12)
- Add Support for Integration Test under tests folder 
## 1.2.0
- Ability to override arguments with CMD+SHIFT+R
- Add ability to remove override arguments by entering an empty string
- Pressing CMD+R would add the override arguments
- an artifact is created when adding arguments , a file called `.cargo_runner.toml`
## 1.1.9
- [Future proof all kinds of test macro](https://github.com/codeitlikemiley/cargo-runner/pull/6)
- [Add ability to run single file rust script](https://github.com/codeitlikemiley/cargo-runner/pull/7)
- [Add criterion benchmark](https://github.com/codeitlikemiley/cargo-runner/pull/9)
- [On nightly rust add ability to run bench test](https://github.com/codeitlikemiley/cargo-runner/pull/10)
## 1.1.8
- fix nextest commands
## 1.1.7
- remove ability to run test at cursor on #[cfg(test)]
- run all test inside mod test {} scope block
- resolve module path correctly
- Fix mising lib and bin args
- resolve cratetype when we have many bin and 1 lib on same crate
- add fix to run test on same file if you have mod test and individual test defined there
- properly handle recursive modules when resolving module path
## 1.1.6
- Add ability to make test on test not inside mod tests
## 1.1.5
- Running Test now works as expected , covering all edge cases
## 1.1.4
- Remove -- tests on exactCaptureOption
- remove prefix test_* on regex on getting fn name
## 1.1.3
- Added getTestFunctionName
- Fix getBin
- Fix checkCrateType 
## 1.1.2
- Added Instruction on how to use the extension

## 1.1.1
- Fix Issue on non workspace type rust project / simple rust project where package and bin is null
- Fix Issue on files inside bin/ folder not being able to run it

## 1.1.0
- Added Feature to Run Doc Test
- Correctly Parse /// with ```codeblock ```
- Correctly Parse #[doc] and #![doc] with raw string r#" "# for multiline codeblock
- Correctly Parse /** with ``` codeblock ``` */

## 1.0.0
-  Added Keymap to CMD + R
-  Override Cargo Run and Cargo Build with Makefile
-  Faster Test with Cargo Next Test (non doc test)
-  Ability to Parse Correctly Crate Type
-  Ability to Parse Package name , Bin Name
-  Ability to Run and build on simple to complex workspace rust project
