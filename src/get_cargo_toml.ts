import { parse } from "@iarna/toml";
import CargoToml from "./cargo_toml_type";
import * as fs from 'fs';

export default  function getCargoToml(filePath: string): CargoToml | null {
    try {
        const cargoTomlContent = fs.readFileSync(filePath, 'utf-8');
        return  parse(cargoTomlContent) as CargoToml;
    } catch (_) {
      console.log('failed to parse Cargo.toml');
      return null;
    }
}
