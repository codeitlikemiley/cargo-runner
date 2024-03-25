export default function parseUserInput(input: string): Array<{name: string, type: "string" | "int" | "boolean", value: any}> {
    // First, split the input string into segments that are either standalone flags or key-value pairs.
    const segments = input.match(/--?\w+(-\w+)*=?[^-\s"]*|"[^"]*"|\S+/g) || [];

    // Initialize an array to hold the parsed arguments.
    const args = [];

    for (let i = 0; i < segments.length; i++) {
        let segment = segments[i];
        let name, value;

        if (segment.startsWith('--')) {
            // Handle long arguments.
            [name, value] = segment.split('=', 2);

            if (value === undefined && segments[i + 1] && !segments[i + 1].startsWith('-')) {
                // Look ahead for the next segment as the value if it's not another argument.
                value = segments[++i];
            }
        } else if (segment.startsWith('-')) {
            // Handle short arguments.
            name = segment;
            if (segments[i + 1] && !segments[i + 1].startsWith('-')) {
                value = segments[++i];
            }
        }

        // Normalize argument names by removing leading dashes.
        name = name!.replace(/^--?/, '');

        // Determine the type and value.
        if (value === undefined) {
            args.push({ name, type: "boolean", value: true });
        } else if (!isNaN(Number(value))) {
            args.push({ name, type: "int", value: Number(value) });
        } else {
            // Remove surrounding quotes from string values, if any.
            value = value.replace(/^"|"$/g, '');
            args.push({ name, type: "string", value });
        }
    }

    return args as Array<{ name: string, type: "string" | "boolean" | "int", value: any }>;
}
