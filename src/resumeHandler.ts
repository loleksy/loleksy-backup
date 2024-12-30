import fs from "fs";

const stateFilePath = "./.files_handled";

let filesHandled: string[] = [];

export function onStarted(): void {
  if (fs.existsSync(stateFilePath)) {
    filesHandled = JSON.parse(fs.readFileSync(stateFilePath, "utf-8"));
  }
}

export function onFileHandled(sourcePath: string): void {
  filesHandled.push(sourcePath);
  fs.writeFileSync(stateFilePath, JSON.stringify(filesHandled));
}

export function isHandled(sourcePath: string): boolean {
  return filesHandled.includes(sourcePath);
}

export function onFinished(): void {
  fs.unlinkSync(stateFilePath);
}
