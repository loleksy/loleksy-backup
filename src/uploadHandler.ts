import { getTotalSize, getDirectoryFilesPaths } from "./filesystemService";
import { Progress } from "./Progress";
import filesize from "filesize";
import { RawS3Uploader } from "./rawS3Uploader";

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

  for (const sourcePath of getSourcePaths(sourceBasePath)) {
    const destinationPath = getFileDestinationPath(
      sourcePath,
      sourceBasePath,
      destinationBasePath
    );
    progress.totalProgress.fileStarted(sourcePath);

    await s3Uploader.uploadFile(sourcePath, destinationPath);

    progress.totalProgress.fileCompleted();
  }

  progress.complete();
}