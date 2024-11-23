import { parse } from '@iarna/toml';
import CargoToml from './cargo_toml_type';
import * as fs from 'fs';
import { log } from './logger';

export default  function getCargoToml(filePath: string): CargoToml | null {
    try {
        const cargoTomlContent = fs.readFileSync(filePath, 'utf-8');
        return  parse(cargoTomlContent) as CargoToml;
    } catch (_) {
      log('failed to read Cargo.toml', 'debug');
      return null;
    }
}