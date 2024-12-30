export interface MediaOptimizerInterface {
  optimize(): Promise<void>;
  getDestinationPath(): string;
}
