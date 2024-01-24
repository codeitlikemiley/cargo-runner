import * as fs from 'fs';

export default function extractModuleNames(filePath: string): string[] {
    try {
        const fileContent = fs.readFileSync(filePath, 'utf-8');
        const moduleRegex = /(pub\s+)?mod\s+([^\s;]+);/gm;
        const matches = [...fileContent.matchAll(moduleRegex)];
        return matches.map(match => match[2]);
    } catch (error) {
        return [];
    }
}