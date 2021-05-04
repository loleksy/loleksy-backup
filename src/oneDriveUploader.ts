import { FileUploadProgress } from "./Progress";
import { uploadSession, uploadSimple } from "./oneDriveService";
import { getFileSize } from "./filesystemService";

const simpleUploadLimit = 4 * 1024 * 1024; //4mb

export class OneDriveUploader {
  private progress: FileUploadProgress;

  constructor(progress: FileUploadProgress) {
    this.progress = progress;
  }

  async uploadFile(localPath: string, destinationPath: string): Promise<void> {
    const fileSize = getFileSize(localPath);
    this.progress.fileStarted(fileSize);
    if (fileSize < simpleUploadLimit) {
      await uploadSimple(localPath, destinationPath);
    } else {
      await uploadSession(
        localPath,
        destinationPath,
        this.updateProgress.bind(this)
      );
    }

    this.progress.fileCompleted();
  }

  updateProgress(uploaded: number): void {
    this.progress.update(uploaded || 0);
  }
}
