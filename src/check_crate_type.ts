import * as fs from 'fs';
import * as path from 'path';
import { findCargoToml } from './find_cargo_toml';
import getCargoToml from './get_cargo_toml';
import findCrateTypeFromModules from './find_crate_type_from_modules';
import { log } from 'console';

async function checkCrateType(filePath: string): Promise<string | null> {
    const parentDir = path.dirname(filePath);
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const mainFunctionRegex = /async\s+fn\s+main\s*\(\s*\)|fn\s+main\s*\(\s*\)/;

    let isOnBinDir = (path.basename(parentDir) === 'bin' && mainFunctionRegex.test(fileContent));
    let isOnMainRs = (path.basename(filePath) === 'main.rs' && mainFunctionRegex.test(fileContent));
    let isOnBuildRs = (path.basename(filePath) === 'build.rs' && mainFunctionRegex.test(fileContent));
    let isOnLibRs = path.basename(filePath) === 'lib.rs';

    if (isOnLibRs) {
        log('Library crate defined on lib.rs');
        return 'lib';
    }

    if (isOnBuildRs) {
        log('Build script crate defined on build.rs');
        return 'build';
    }

    if (isOnBinDir || isOnMainRs) {
        log(`Bin crate defined on ${isOnBinDir ? 'bin Directory' : 'main.rs'}`);
        return 'bin';
    }

    const cargoTomlPath = findCargoToml(filePath);

    if (!cargoTomlPath) {
        console.log('Cargo.toml not found in the workspace root');
        return null;
    }

    const cargo = getCargoToml(cargoTomlPath);

    if (!cargo) {
        console.log('Unable to parse Cargo.toml');
        return null;
    }

    if (cargo.bin) {
        const directBinMatch = cargo.bin.find(bin => bin.path && filePath.endsWith(bin.path));
        if (directBinMatch) {
            return 'bin';
        }

        for (const bin of cargo.bin) {
            if (bin.path && isFilePartOfBinaryCrate(filePath, parentDir, bin)) {
                return 'bin';
            }
        }
    }
    if (cargo.lib) {
        return 'lib';
    }
    return findCrateTypeFromModules(cargoTomlPath, filePath);
}

function isFilePartOfBinaryCrate(filePath: string, parentDir: string, bin: { name: string; path: string; }) {
    const binPath = path.join(parentDir, bin.path);
    const binDir = path.dirname(binPath);
    return filePath.startsWith(binDir);
}

export { checkCrateType };