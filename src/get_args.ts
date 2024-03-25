import { parse } from "@iarna/toml";
import * as fs from 'fs';
import { CargoRunnerToml } from "./cargo_runner_args_type";

export default async function getArgs(filePath: string | null): Promise<CargoRunnerToml | null> {
    if (filePath === null || filePath === '') {
        return null;
    }
    try {
        const cargoTomlContent = fs.readFileSync(filePath, 'utf-8');
        const cargo = parse(cargoTomlContent) as CargoRunnerToml;
        console.log('Parsed Cargo Runner TOML:', cargo);
        return cargo;
    } catch (error) {
        console.error('Failed to read or parse the Cargo Runner TOML file:', error);
        return null;
    }
};
