import { FileUploadProgress } from "./Progress";
import { managedUpload } from "./s3Service";
import { getFileSize } from "./filesystemService";
import { Progress as S3Progress } from "@aws-sdk/lib-storage";

export class RawS3Uploader {
  private progress: FileUploadProgress;

  constructor(progress: FileUploadProgress) {
    this.progress = progress;
  }

  async uploadFile(localPath: string, destinationPath: string): Promise<void> {
    const fileSize = getFileSize(localPath);
    this.progress.fileStarted(fileSize);

    await managedUpload(
      localPath,
      destinationPath,
      this.updateProgress.bind(this)
    );

    this.progress.fileCompleted();
  }

  updateProgress(s3Progress: S3Progress): void {
    this.progress.update(s3Progress.loaded || 0);
  }
}
