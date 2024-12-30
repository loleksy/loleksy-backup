import { getTotalSize, getDirectoryFilesPaths } from "./filesystemService";
import { Progress } from "./Progress";
import filesize from "filesize";
import { RawS3Uploader } from "./rawS3Uploader";
import { MediaOptimizerManager } from "./mediaOptimizerManager";
import { OneDriveUploader } from "./oneDriveUploader";
import { unlinkSync } from "fs";
import {
  isHandled,
  onFileHandled,
  onFinished,
  onStarted,
} from "./resumeHandler";
import { dirname, basename, join } from "path";

const isSourceBlacklisted = (path: string): boolean => {
  if (path.endsWith("/Icon\r") || path.endsWith(".DS_Store")) {
    return true;
  }

  return false;
};

const getSourcePaths = (source: string): string[] => {
  return getDirectoryFilesPaths(source).filter(
    (path) => !isSourceBlacklisted(path)
  );
};

const getFileDestinationPath = (
  sourceFilePath: string,
  sourceBasePath: string,
  destinationBasePath: string
): string => {
  return sourceFilePath
    .replace(sourceBasePath, destinationBasePath)
    .replace(/^\/+/, "");
};

async function handleOptimized(
  mediaOptimizerManager: MediaOptimizerManager,
  oneDriveUploader: OneDriveUploader,
  sourcePath: string,
  destinationPath: string
): Promise<void> {
  if (!mediaOptimizerManager.isSupported(sourcePath)) {
    return;
  }
  const optimizedPath = await mediaOptimizerManager.optimize(sourcePath);
  const oneDrivePath = join(dirname(destinationPath), basename(optimizedPath));

  await oneDriveUploader.uploadFile(optimizedPath, oneDrivePath);

  unlinkSync(optimizedPath);
}

export async function handle(
  sourceBasePath: string,
  destinationBasePath: string
): Promise<void> {
  console.log("Getting file list...");
  const size = await getTotalSize(sourceBasePath);
  console.log(`Source size: ${filesize(size)}`);
  console.log("Starting...");
  const progress = new Progress(size);
  const s3Uploader = new RawS3Uploader(progress.rawFileUploadProgress);
  const mediaOptimizerManager = new MediaOptimizerManager(
    progress.mediaOptimizeProgress
  );
  const oneDriveUploader = new OneDriveUploader(
    progress.optimizedUploadProgress
  );
  onStarted();
  for (const sourcePath of getSourcePaths(sourceBasePath)) {
    const destinationPath = getFileDestinationPath(
      sourcePath,
      sourceBasePath,
      destinationBasePath
    );
    progress.totalProgress.fileStarted(sourcePath);

    if (isHandled(sourcePath)) {
      progress.totalProgress.fileCompleted();
      continue;
    }

    await Promise.all([
      s3Uploader.uploadFile(sourcePath, destinationPath),
      handleOptimized(
        mediaOptimizerManager,
        oneDriveUploader,
        sourcePath,
        destinationPath
      ),
    ]);

    progress.totalProgress.fileCompleted();
    onFileHandled(sourcePath);
  }

  progress.complete();
  onFinished();
}
