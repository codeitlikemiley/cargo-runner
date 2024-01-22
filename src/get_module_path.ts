export default function getModulePath(filePath: string, packageName: string): string {
    // Find the position of the package name in the file path
    const packageIndex = filePath.indexOf(`/${packageName}/src/`);

    // If the package name is found in the path
    if (packageIndex !== -1) {
        // Extract the substring after the package name
        const relativePath = filePath.substring(packageIndex + packageName.length + 5);

        // Replace the first slash with an empty string
        const modulePath = relativePath.replace('/', '');

        // Replace slashes with double colons
        const formattedPath = modulePath.replace(/\//g, '::');

        // Remove the file extension (.rs)
        const finalPath = formattedPath.replace('.rs', '');

        return finalPath;
    }

    // If the package name is not found, return the original path
    return filePath;
}