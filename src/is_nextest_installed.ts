import * as fs from 'fs';
import * as path from 'path';
import { cargoHome, isCargoNextestEnabled } from './cargo_home';

export  async function isCargoNextestInstalled(): Promise<boolean> {
	if (!isCargoNextestEnabled()) {
		return false;
	}
	const cargoNextestPath = path.join(cargoHome(), 'bin', 'cargo-nextest');
	return fs.existsSync(cargoNextestPath);
}
