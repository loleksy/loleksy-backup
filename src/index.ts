import { processArgs } from "./argsService";
import { pickS3Destination } from "./promptService";
import { handle } from "./uploadHandler";

(async () => {
  try {
    const args = processArgs();
    await handle(
      args.sourcePath,
      args.destinationPath || (await pickS3Destination())
    );
  } catch (e) {
    console.error(e);
  }
})();
