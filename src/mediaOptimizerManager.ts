import { string } from "yargs";
import { MediaOptimizerInterface } from "./mediaOptimizerInterface";
import { JpgMediaOptimizer } from "./jpgMediaOptimizer";
import { MediaOptimizeProgress } from "./Progress";
import { VideoMediaOptimizer } from "./videoMediaOptimizer";

export enum OptimizeType {
  Jpg = "jpg",
  Mp4 = "mp4",
  Unsupported = "unsupported",
}

const typeMapping: [string, OptimizeType][] = [
  ["jpg", OptimizeType.Jpg],
  ["jpeg", OptimizeType.Jpg],
  ["mkv", OptimizeType.Mp4],
  ["mp4", OptimizeType.Mp4],
  ["mov", OptimizeType.Mp4],
  ["m4v", OptimizeType.Mp4],
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

  public async optimize(sourcePath: string): Promise<string> {
    this.progress.fileStarted();
    const optimizer = this.getOptimizer(sourcePath);
    await optimizer.optimize();
    this.progress.fileCompleted();

    return optimizer.getDestinationPath();
  }

  private getOptimizer(sourcePath: string): MediaOptimizerInterface {
    const type = this.getType(sourcePath);

    switch(type) {
      case OptimizeType.Jpg:
        return new JpgMediaOptimizer(sourcePath);
      case OptimizeType.Mp4:
        return new VideoMediaOptimizer(sourcePath, this.progress.update.bind(this.progress));
      default:
        throw new Error('unsupported type');
    }
  }
}
