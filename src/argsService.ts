import yargs from "yargs/yargs";

export type AppArguments = {
  sourcePath: string;
  destinationPath?: string;
};

export function processArgs(): AppArguments {
  return yargs(process.argv.slice(2)).options({
    sourcePath: {
      type: "string",
      demandOption: true,
      description: "Source path of directory/file that needs to be uploaded",
    },
    destinationPath: {
      type: "string",
      demandOption: false,
      description: "Destination path in the Cloud",
    },
  }).argv;
}
