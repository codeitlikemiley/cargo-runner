import * as path from 'path';
import * as fs from 'fs';
import extractModuleNames from './extract_module_names';

export default async function findCrateTypeFromModules(cargoTomlPath: string, filePath: string): Promise<string | null> {
    const cargoTomlDir = path.dirname(cargoTomlPath);
    const mainRsPath = path.join(cargoTomlDir, 'src', 'main.rs');
    const libRsPath = path.join(cargoTomlDir, 'src', 'lib.rs');

    const hasMainRs = fs.existsSync(mainRsPath);
    const hasLibRs = fs.existsSync(libRsPath);

    if (!hasMainRs && !hasLibRs) {
        console.error('Error: No [[bin]] or [[lib]] section found, and no main.rs or lib.rs file present.');
        console.error('Please define at least one of [[bin]], [[lib]], main.rs, or lib.rs in Cargo.toml.');
        return null;
    }

    const mainRsModules = hasMainRs ? await extractModuleNames(mainRsPath) : [];
    const libRsModules = hasLibRs ? await extractModuleNames(libRsPath) : [];

    const isBin = hasMainRs && mainRsModules.some(module => filePath.includes(module));
    const isLib = hasLibRs && libRsModules.some(module => filePath.includes(module));

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
