import { processArgs } from "./argsService";
import { pickS3Destination } from "./promptService";
import { handle } from "./uploadHandler";
import { authorizeApp } from "./oneDriveService";

(async () => {
  try {
    const args = processArgs();

    if (args.authorizeOneDrive) {
      await authorizeApp();
    }

    await handle(
      args.sourcePath,
      args.destinationPath || (await pickS3Destination())
    );
  } catch (e) {
    console.error(e);
  }
})();
