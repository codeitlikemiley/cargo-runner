import * as path from 'path';
import { findCargoToml } from './find_cargo_toml';
import getCargoToml from './get_cargo_toml';
import { getPackage } from './get_package';


async function getBenchmark(filePath: string): Promise<string | null> {

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
    console.log('cargo: ', cargo);

    // check if the current file is a benchmark from bench entries
    // if the path is null we supply with getDefaultBenchmarkPath
    let package_name = await getPackage(filePath);
    // do simple loop to check if the current file is a benchmark
    // if path is null we supply with getDefaultBenchmarkPath
    if (!cargo.bench) {
        console.log('No benches found in Cargo.toml');
        return null;
    }

    // get the relative path of the current file from the cargo.toml file
    let relativePath = path.relative(path.dirname(cargoTomlPath), filePath);

    // loop over the bench entries and compare the paths
    for (const bench of cargo.bench!) {
        // if the bench path is null, use the default bench path
        let benchPath = bench.path || getDefaultBenchmarkPath(filePath, package_name!, null);
        // if the relative path matches the bench path, return the bench name
        if (relativePath === benchPath) {
            console.log('Benchmark found: ', bench.name);
            return bench.name;
        }
    }

    // if no match is found, return null
    console.log('All checks failed, no benchmark found');
    return null;

}

function getDefaultBenchmarkPath(filePath: string, packageName: string, binName: string | null): string {
    const fileName = path.basename(filePath, '.rs');
    const dirName = path.dirname(filePath);

    let folderName = path.basename(dirName);

    let benchPath = path.join('benches', folderName, `${fileName}.rs`);
    return benchPath;
}



export { getBenchmark };