export interface DeployOptions {
  pinataJwt?: string;
  outputFile?: string;
  generatedDir?: string;
  projectType?: 'tool' | 'policy';
}

declare function deployLitAction(options?: DeployOptions): Promise<string>;

export default deployLitAction;