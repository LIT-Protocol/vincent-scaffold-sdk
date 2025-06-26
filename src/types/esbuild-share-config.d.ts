import { BuildOptions } from 'esbuild';

export const baseConfig: BuildOptions;
export function getPlugins(projectType: 'tool' | 'policy'): any[];
export function ensureDirectoryExistence(filePath: string): boolean;
export function logBuildResults(result: any): void;