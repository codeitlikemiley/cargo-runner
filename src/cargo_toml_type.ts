export default interface CargoToml {
    bench?: Array<{
        name: string;
        path: string;
    }>;
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