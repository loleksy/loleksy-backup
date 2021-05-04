import { getPrefixedPaths, S3Paths } from "./s3Service";
import prompts from "prompts";
import { basename } from "path";

const getS3PathsChoices = (paths: S3Paths): prompts.Choice[] => {
  return ["..", "."]
    .concat(paths.directoryPaths)
    .map((path) => ({
      title: basename(path),
      value: path,
    }))
    .concat(
      paths.filePaths.map((path) => ({
        title: basename(path),
        value: path,
        disabled: true,
      }))
    );
};

export async function pickS3Destination() {
  let pickedPath: string = "";
  let promptResponse: prompts.Answers<string>;
  do {
    const paths = await getPrefixedPaths(pickedPath);

    promptResponse = await prompts({
      type: "select",
      name: "value",
      message: `Pick a destination: (${pickedPath})`,
      choices: getS3PathsChoices(paths),
      initial: 1,
    });
    console.log(promptResponse.value);
    if (promptResponse.value === "..") {
      pickedPath = pickedPath.replace(/\/$/, "");
      pickedPath = pickedPath.substring(0, pickedPath.lastIndexOf("/"));
    } else if (promptResponse.value !== ".") {
      pickedPath = promptResponse.value;
    }
  } while (promptResponse.value !== ".");

  return pickedPath;
}

export async function authorizeOneDrive(url: string): Promise<string> {
  process.stdout.write(
    'Visit following url to authorize app and paste below "code" query: \n'
  );
  console.log(url);

  const response = await prompts({
    type: "text",
    name: "code",
    message: "Code:",
  });

  return response.code;
}
