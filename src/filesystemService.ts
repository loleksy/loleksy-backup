import getFolderSize from "get-folder-size";
import fs from "fs";
import path from "path";
import { promisify } from "util";

export async function getTotalSize(path: string): Promise<number> {
  return promisify(getFolderSize)(path) as Promise<number>;
}

export function getFileSize(path: string): number {
  return fs.lstatSync(path).size;
}

export function getDirectoryFilesPaths(directory: string): string[] {
  const paths: string[] = [];

  fs.readdirSync(directory).forEach((file: any) => {
    const absolutePath = path.join(directory, file);
    if (fs.statSync(absolutePath).isDirectory()) {
      getDirectoryFilesPaths(absolutePath).forEach((path: string) => {
        paths.push(path);
      });
    } else paths.push(absolutePath);
  });

  return paths;
}
