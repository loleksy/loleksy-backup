import sharp from "sharp";
import fs from "fs";
import decodeHeic from "heic-decode";
import { MediaOptimizerInterface } from "./mediaOptimizerInterface";
import { getOptimizerTmpFilePath } from "./filesystemService";
import ExifReader from 'exifreader';
import piexif from "piexifjs"; //todo switch to exifreader completely


export class HeicMediaOptimizer implements MediaOptimizerInterface {
  private sourcePath: string;

  constructor(sourcePath: string) {
    this.sourcePath = sourcePath;
  }

  public async optimize(): Promise<void> {
    const decodedImage = await decodeHeic({
      buffer: fs.readFileSync(this.sourcePath),
    });

    const decodedImageBuffer = Buffer.from(decodedImage.data);

    const image = await sharp(
      decodedImageBuffer,
      {
        raw: {
          width: decodedImage.width,
          height: decodedImage.height,
          channels: 4,
        },
      }
    );

    await image
      .resize(1280)
      .rotate() //autodetect based on exif
      .jpeg({ mozjpeg: true, quality: 75 })
      .toFile(this.getDestinationPath());

    await this.setOptimizedMetadata(this.getDestinationPath());
  }

  public getDestinationPath(): string
  {
    return getOptimizerTmpFilePath(this.sourcePath, 'jpg');
  }

  private async setOptimizedMetadata(
    destinationPath: string,
  ): Promise<void> {
    const tags = await ExifReader.load(this.sourcePath);
    
    const coords = {
      "1": tags.GPSLatitudeRef?.value,
      "2": tags.GPSLatitude?.value,
      "3": tags.GPSLongitudeRef?.value,
      "4": tags.GPSLongitude?.value,
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
