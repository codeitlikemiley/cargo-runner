
export interface CommandArg {
    name: string;
    type: "string" | "int" | "boolean";
    value: string | number | boolean;
}

export interface CargoRunnerToml {
    run?: Array<CommandArg>;
    test?: Array<CommandArg>;
    build?: Array<CommandArg>;
    doctest?: Array<CommandArg>;
    bench?: Array<CommandArg>;
}

    

