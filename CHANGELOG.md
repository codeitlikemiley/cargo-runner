# Change Log

All notable changes to the "cargo-runner" extension will be documented in this file.

Check [Keep a Changelog](http://keepachangelog.com/) for recommendations on how to structure this file.

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