import { BuildOptions } from 'esbuild';

export const baseConfig: BuildOptions;
export function getPlugins(projectType: 'tool' | 'policy'): any[];
export function ensureDirectoryExistence(filePath: string): boolean;
export function logBuildResults(result: any): void;
export function deployLitAction(options?: {
  pinataJwt?: string;
  outputFile?: string;
  generatedDir?: string;
  projectType?: 'tool' | 'policy';
}): Promise<string>;
export function buildTool(): Promise<void>;
export function buildPolicy(): Promise<void>;