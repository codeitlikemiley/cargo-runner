import * as path from 'path';

function isInsideExamples(filePath: string) {
    // check if the parent directory of the file is tests
    const parentDir = path.basename(path.dirname(filePath));
    return parentDir === 'examples';
}

export { isInsideExamples };