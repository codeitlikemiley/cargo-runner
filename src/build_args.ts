import { CommandArg } from "./cargo_runner_args_type";

export default function buildArgs(contextArgs: Array<CommandArg>): string {
    return contextArgs.map(arg => {
        if (arg.type === "boolean" && arg.value === true) {
            // For boolean type args, if the value is true, just add the name (flag style)
            return `--${arg.name}`;
        } else {
            // For int and string types, add name=value
            return `--${arg.name}=${arg.value}`;
        }
    }).join(' ');
}