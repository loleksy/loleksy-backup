import sharp from "sharp";
import piexif from "piexifjs";
import fs from "fs";
import { MediaOptimizerInterface } from "./mediaOptimizerInterface";
import { getOptimizerTmpFilePath } from "./filesystemService";

export class JpgMediaOptimizer implements MediaOptimizerInterface {
  private sourcePath: string;

  constructor(sourcePath: string) {
    this.sourcePath = sourcePath;
  }

  public async optimize(): Promise<void> {
    const image = await sharp(this.sourcePath);
    const metadata = await image.metadata();

    await sharp(this.sourcePath)
      .resize(1280)
      .rotate() //autodetect based on exif
      .jpeg({ mozjpeg: true, quality: 70 })
      .toFile(this.getDestinationPath());

    await this.setOptimizedMetadata(this.getDestinationPath(), metadata);
  }

  public getDestinationPath(): string
  {
    return getOptimizerTmpFilePath(this.sourcePath, 'jpg');
  }

  private async setOptimizedMetadata(
    destinationPath: string,
    metadata: sharp.Metadata
  ): Promise<void> {
    if (!metadata.exif) {
      return;
    }

    const exifData = piexif.load(metadata.exif.toString("binary"));
    if (!exifData.GPS) {
      return;
    }

    const coords = {
      "1": exifData.GPS["1"],
      "2": exifData.GPS["2"],
      "3": exifData.GPS["3"],
      "4": exifData.GPS["4"],
    };

    if (!coords["1"] || !coords["2"] || !coords["3"] || !coords["4"]) {
      return;
    }

    const optimizedExif = {
      "0th": {},
      Exif: {},
      GPS: coords,
    };

    var imageData = fs.readFileSync(destinationPath).toString("binary");
    const exifbytes = piexif.dump(optimizedExif);
    const updatedImageData = piexif.insert(exifbytes, imageData);
    fs.writeFileSync(destinationPath, Buffer.from(updatedImageData, "binary"));
  }
}
