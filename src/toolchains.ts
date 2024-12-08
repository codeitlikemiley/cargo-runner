export const CHANNEL_REGEX = /^(?:stable|beta|nightly|\d+(?:\.\d+){1,2})(?:-\d{4}(?:-\d{2}){2})?(?:-\D[^-]*(?:(?:-(?:[^-]+)){1,3}))?$/;

export function isValidToolchain(toolchain: string): boolean {
    return CHANNEL_REGEX.test(toolchain);
}