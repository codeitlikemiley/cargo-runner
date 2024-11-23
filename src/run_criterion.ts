import { getFilePath } from "./editor";
import { findBenchmarkId } from "./find_benchmark_id";
import { getPackage } from "./get_package";
import { log } from "./logger";
import { createAndExecuteTask } from "./tasks";

// TODO: unused
export default async function run_criterion(name: string) {

	const id = await findBenchmarkId();
	const packageName = await getPackage(getFilePath());
	let cargoCmd = "bench";
	let benchArg = `--bench ${name}`;
	let idArg = id ? `-- ${JSON.stringify(id)}` : '';
	let pkgArg = packageName ? `--package ${packageName}` : '';

	//TODO: pass here the additional args from config

	let commandArray = [];

	commandArray = [
		cargoCmd,
		pkgArg,
		benchArg,
		idArg,
		// additionalArgs,
	];
	log(`running command cargo: ${commandArray.join(' ')}`, 'debug');

	createAndExecuteTask("cargo", commandArray);
}
