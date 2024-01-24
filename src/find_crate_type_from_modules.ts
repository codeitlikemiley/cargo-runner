import * as path from 'path';
import * as fs from 'fs';
import extractModuleNames from './extract_module_names';

export default async function findCrateTypeFromModules(cargoTomlPath: string, filePath: string): Promise<string | null> {
    const cargoTomlDir = path.dirname(cargoTomlPath);
    const mainRsPath = path.join(cargoTomlDir, 'src', 'main.rs');
    const libRsPath = path.join(cargoTomlDir, 'src', 'lib.rs');

    const isBin = fs.existsSync(mainRsPath) && (await extractModuleNames(mainRsPath)).some(module => filePath.includes(module));
    const isLib = fs.existsSync(libRsPath) && (await extractModuleNames(libRsPath)).some(module => filePath.includes(module));

    if (isBin) {
        console.log('Found main.rs file with module declarations');
        return 'bin';
    }

    if (isLib) {
        console.log('Found lib.rs file with module declarations');
        return 'lib';
    }

    return null;
}
