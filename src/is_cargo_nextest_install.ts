import * as fs from 'fs';
import * as path from 'path';

async function isCargoNextestInstalled(): Promise<boolean> {
    const cargoHome = process.env.CARGO_HOME;
    if (!cargoHome) {
        return false;
    }

    const cargoNextestPath = path.join(cargoHome, 'bin', 'cargo-nextest');
    return fs.existsSync(cargoNextestPath);
}

export { isCargoNextestInstalled };