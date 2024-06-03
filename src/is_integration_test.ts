import * as path from 'path';

function isIntegrationTest(filePath: string) {
    // check if the parent directory of the file is tests
    const parentDir = path.basename(path.dirname(filePath));
    return parentDir === 'tests';
}

export { isIntegrationTest };