import * as fs from 'fs';
import readline from 'readline';

export default async function extractModuleNames(filePath: string): Promise<string[]> {
    const moduleNames: string[] = [];

    try {
        const fileStream = fs.createReadStream(filePath);
        const rl = readline.createInterface({
            input: fileStream,
            crlfDelay: Infinity,
        });

        // Process each line in the file
        rl.on('line', (line) => {
            const moduleMatch = line.match(/(pub\s+)?mod\s+([^\s;]+);/);
            if (moduleMatch) {
                moduleNames.push(moduleMatch[2]);
            }
        });

        // Wait for the file to be completely read
        return new Promise<string[]>((resolve) => {
            rl.on('close', () => {
                resolve(moduleNames);
            });
        });
    } catch (error) {
        console.error(`Error reading file ${filePath}: ${error}`);
        return [];
    }
}