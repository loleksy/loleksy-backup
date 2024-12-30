import { getOptimizerTmpFilePath } from "./filesystemService";
import { MediaOptimizerInterface } from "./mediaOptimizerInterface";
import hbjs from "handbrake-js";

export class VideoMediaOptimizer implements MediaOptimizerInterface {
  private sourcePath: string;
  private progressCallback: (uploaded: number) => void;

  constructor(
    sourcePath: string,
    progressCallback: (uploaded: number) => void
  ) {
    this.sourcePath = sourcePath;
    this.progressCallback = progressCallback;
  }

  public async optimize(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      hbjs
        .spawn({
          input: this.sourcePath,
          output: this.getDestinationPath(),
          format: "av_mp4",
          encoder: "x264",
          // video
          encopts:
            "x264 Unparse: level=3.1:ref=5:direct=auto:subme=8:trellis=2:vbv-bufsize=17500:vbv-maxrate=17500:rc-lookahead=50",
          vb: 800,
          "two-pass": true,
          "no-turbo": true,
          // picture
          height: 480,
          "keep-display-aspect": true,
          //audio
          aencoder: "ca_aac",
          ab: "96",
        })
        .on("error", (err) => {
          reject(err);
        })
        .on("progress", (progress) => {
          const completed =
            (((progress as any).taskNumber - 1) * 100 +
              progress.percentComplete) /
            (progress.taskCount * 100);
          this.progressCallback(completed * 100);
        })
        .on("complete", () => {
          resolve();
        });
    });
  }

  public getDestinationPath(): string {
    return getOptimizerTmpFilePath(this.sourcePath, "mp4");
  }
}
