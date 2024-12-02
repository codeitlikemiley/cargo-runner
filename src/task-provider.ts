import * as vscode from 'vscode';
import { CargoRunnerTaskProvider } from './tasks';

export 	const taskProvider = vscode.tasks.registerTaskProvider(
    CargoRunnerTaskProvider.cargoType,
    new CargoRunnerTaskProvider()
);