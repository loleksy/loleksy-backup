import { string } from "yargs";
import { JpgMediaOptimizer } from "./jpgMediaOptimizer";
import { MediaOptimizeProgress } from "./Progress";

export enum OptimizeType {
  Jpg = "jpg",
  Mp4 = "mp4",
  Unsupported = "unsupported",
}

const typeMapping: [string, OptimizeType][] = [
  ["jpg", OptimizeType.Jpg],
  ["jpeg", OptimizeType.Jpg],
];

export class MediaOptimizerManager {
  private progress: MediaOptimizeProgress;

  constructor(progress: MediaOptimizeProgress) {
    this.progress = progress;
  }

  public getType(sourcePath: string): OptimizeType {
    const lowerPath = sourcePath.toLowerCase();
    const found = typeMapping.find(([ext, _type]) => lowerPath.endsWith(ext));
    return found ? found[1] : OptimizeType.Unsupported;
  }

  public isSupported(sourcePath: string): boolean {
    return this.getType(sourcePath) !== OptimizeType.Unsupported;
  }

  public async optimize(sourcePath: string, tmpPath: string): Promise<void> {
    this.progress.fileStarted();
    const optimizer = new JpgMediaOptimizer(sourcePath);
    await optimizer.optimize(tmpPath);
    this.progress.fileCompleted();
  }
}
