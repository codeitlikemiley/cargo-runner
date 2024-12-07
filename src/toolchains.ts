export const VALID_TOOLCHAINS = ['nightly', 'stable', 'beta'] as const;
export type Toolchain = (typeof VALID_TOOLCHAINS)[number];

export const isValidToolchain = (input: string): input is Toolchain => {
    return VALID_TOOLCHAINS.includes(input as Toolchain);
};