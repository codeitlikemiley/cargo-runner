import * as fs from 'fs';
import readline from 'readline';

async function* readLines(filePath: string): AsyncGenerator<string> {
    const fileStream = fs.createReadStream(filePath);
    const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity,
    });

    for await (const line of rl) {
        yield line;
    }
}

export default async function extractModuleNames(filePath: string): Promise<string[]> {
    const moduleNames: string[] = [];

    try {
        for await (const line of readLines(filePath)) {
            const moduleMatch = line.match(/(pub\s+)?mod\s+([^\s;]+);/);
            if (moduleMatch) {
                moduleNames.push(moduleMatch[2]);
            }
        }
    } catch (error) {
        console.error(`Error reading file ${filePath}: ${error}`);
    }

    return moduleNames;
}