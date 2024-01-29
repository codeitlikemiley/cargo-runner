import * as vscode from 'vscode';

async function findBenchmarkId() : Promise<string | null | undefined>{
  const editor = vscode.window.activeTextEditor;

  if (editor) {
    const document = editor.document;
    const currentPosition = editor.selection.active;

    // Define a regex pattern to match the entire function call with flexible parameter name
    const pattern = /(\w+)\.bench_function\("([^"]+)"/;

    // Iterate through each line from the current cursor position to the beginning of the document
    for (let lineNum = currentPosition.line; lineNum >= 0; lineNum--) {
      const line = document.lineAt(lineNum).text;

      // Check if the pattern is found in the current line
      const matchResult = line.match(pattern);

      if (matchResult) {
        // Extract the Id
        const idParam = matchResult[2];

        console.log(`Benchmark ID: ${idParam}`);
        
        return idParam;
      }
    }
  }
  console.log('No benchmark function found');
  return null;
}

export { findBenchmarkId };