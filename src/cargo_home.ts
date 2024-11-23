import * as path from 'path';
import * as os from 'os';
import workspaceConfig from './workspace_config';

export const cargoHome = workspaceConfig().cargoHome || process.env.CARGO_HOME || path.resolve(os.homedir(), '.cargo');