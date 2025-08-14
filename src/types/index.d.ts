import { BuildOptions } from 'esbuild';

export const baseConfig: BuildOptions;
export function getPlugins(projectType: "ability" | "policy"): any[];
export function ensureDirectoryExistence(filePath: string): boolean;
export function logBuildResults(result: any): void;
export function deployLitAction(options?: {
  pinataJwt?: string;
  outputFile?: string;
  generatedDir?: string;
  projectType?: "ability" | "policy";
}): Promise<string>;
export function buildAbility(): Promise<void>;
export function buildPolicy(): Promise<void>;