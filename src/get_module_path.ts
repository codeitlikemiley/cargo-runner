export default function getModulePath(filePath: string, packageName: string, binName: string|null): string {
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
        let finalPath = formattedPath.replace('.rs', '');

        // if our final path has ::mod on the end, remove it
        if (finalPath.endsWith('::mod')) {
            finalPath =  finalPath.slice(0, -5);
        }
        // remove the bin name from the path, can remove multiple element that matches the bin name
        console.log(`get_module_path - Final path: ${finalPath}`);
        if (finalPath) {
            const pathSegments = finalPath.split('::');
            const filteredSegments = pathSegments.filter(segment => segment !== binName);
            finalPath = filteredSegments.join('::');
        }
        

        return finalPath;
    }

    // If the package name is not found, return the original path
    return filePath;
}