# Change Log

All notable changes to the "cargo-runner" extension will be documented in this file.

Check [Keep a Changelog](http://keepachangelog.com/) for recommendations on how to structure this file.
## 1.16
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
