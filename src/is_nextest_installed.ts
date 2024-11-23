import * as fs from 'fs';
import * as path from 'path';
import { cargoHome } from './cargo_home';

export default async function isCargoNextestInstalled(): Promise<boolean> {
	const cargoNextestPath = path.join(cargoHome, 'bin', 'cargo-nextest');
	return fs.existsSync(cargoNextestPath);
}
