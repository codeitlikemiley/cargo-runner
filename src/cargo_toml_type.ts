export default interface CargoToml {
    package?: {
        name?: string;
    };
    bin?: Array<{
        name: string;
        path: string;
    }>;
    lib?: {
        name?: string;
        path?: string;
    };
}
