import cliProgress, { MultiBar, SingleBar } from "cli-progress";
import pad from "pad";
import filesize from "filesize";
import { getFileSize } from "./filesystemService";
import { basename } from "path";

abstract class AbstractProgress {
  protected label: string = "";
  protected progress: SingleBar;

  constructor(progress: SingleBar, label: string) {
    this.progress = progress;
    this.label = label;
  }
}

export class TotalProgress extends AbstractProgress {
  private currentFileSize: number = 0;
  private currentFileName: string = "";

  public fileStarted(filePath: string): void {
    this.currentFileSize = getFileSize(filePath);
    this.currentFileName = basename(filePath);

    this.incrementProgress(0);
  }

  public fileCompleted() {
    this.incrementProgress(this.currentFileSize);
  }

  private incrementProgress(increment: number) {
    this.progress.increment(increment, {
      label: this.label,
      desc: this.currentFileName,
    });
  }

  public done() {
    this.progress.setTotal(1); //to avoid 99% due to size estimations
  }
}

export class FileUploadProgress extends AbstractProgress {
  private uploadedSize: number = 0;
  private totalSize: number = 0;

  public fileStarted(fileSize: number): void {
    this.uploadedSize = 0;
    this.totalSize = fileSize;
    this.progress.setTotal(fileSize);
    this.updateProgress();
  }

  public update(uploaded: number): void {
    this.uploadedSize = uploaded;
    this.updateProgress();
  }

  public fileCompleted() {
    this.uploadedSize = this.totalSize;
    this.updateProgress();
  }

  private updateProgress() {
    const uploadedLabel =
      this.uploadedSize === 0 ? "? B" : filesize(this.uploadedSize);
    this.progress.update(this.uploadedSize, {
      label: this.label,
      desc: `${uploadedLabel}/${filesize(this.totalSize)}`,
    });
  }
}

export class MediaOptimizeProgress extends AbstractProgress {
  private percentage: number = 0;

  public fileStarted(): void {
    this.percentage = 0;
    this.updateProgress();
  }

  public update(percentage: number): void {
    this.percentage = percentage;
    this.updateProgress();
  }

  public fileCompleted() {
    this.percentage = 100;
    this.updateProgress();
  }

  private updateProgress() {
    this.progress.update(this.percentage, {
      label: this.label,
      desc: `...`,
    });
  }
}

export class Progress {
  public totalProgress: TotalProgress;
  public rawFileUploadProgress: FileUploadProgress;
  public mediaOptimizeProgress: MediaOptimizeProgress;
  public optimizedUploadProgress: FileUploadProgress;

  private multibar: MultiBar;

  private readonly totalLabel = pad("Total:", 20);
  private readonly rawLabel = pad("Upload (raw):", 20);
  private readonly mediaOptimizeLabel = pad("Optimize:", 20);
  private readonly optimizedLabel = pad("Upload (optimized):", 20);

  constructor(totalSize: number) {
    this.multibar = new cliProgress.MultiBar({
      format: "{label} {bar} {percentage}% ({desc})",
    });
    this.totalProgress = new TotalProgress(
      this.buildProgressBar(this.totalLabel, totalSize),
      this.totalLabel
    );
    this.rawFileUploadProgress = new FileUploadProgress(
      this.buildProgressBar(this.rawLabel, 1),
      this.rawLabel
    );
    this.mediaOptimizeProgress = new MediaOptimizeProgress(
      this.buildProgressBar(this.mediaOptimizeLabel, 100),
      this.mediaOptimizeLabel
    );
    this.optimizedUploadProgress = new FileUploadProgress(
      this.buildProgressBar(this.optimizedLabel, 1),
      this.optimizedLabel
    );
  }

  public complete(): void {
    this.totalProgress.done();
    this.multibar.stop();
  }

  private buildProgressBar(label: string, total: number): SingleBar {
    return this.multibar.create(total, 0, {
      label,
      desc: "...",
    });
  }
}
