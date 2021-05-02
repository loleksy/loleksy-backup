import {
  S3_ENDPOINT,
  S3_REGION,
  S3_ACCESS_KEY_ID,
  S3_SECRET_ACCESS_KEY,
  S3_BUCKET_NAME,
} from "./config";
import { S3Client, ListObjectsCommand } from "@aws-sdk/client-s3";

import { Upload, Progress as S3Progress } from "@aws-sdk/lib-storage";
import fs from "fs";

const s3 = new S3Client({
  endpoint: S3_ENDPOINT,
  region: S3_REGION,
  credentials: {
    accessKeyId: S3_ACCESS_KEY_ID,
    secretAccessKey: S3_SECRET_ACCESS_KEY,
  },
});

export type S3Paths = {
  directoryPaths: string[];
  filePaths: string[];
};

export async function getPrefixedPaths(prefix: string): Promise<S3Paths> {
  const response = await s3.send(
    new ListObjectsCommand({
      Bucket: S3_BUCKET_NAME,
      Delimiter: "/",
      Prefix: prefix,
    })
  );

  const paths: S3Paths = {
    directoryPaths: [],
    filePaths: [],
  };

  if (response.CommonPrefixes) {
    paths.directoryPaths = response.CommonPrefixes.map((item) => item.Prefix!);
  }

  if (response.Contents) {
    paths.filePaths = response.Contents.map((item) => item.Key!);
  }
  return paths;
}

export async function managedUpload(
  localPath: string,
  remoteKey: string,
  callback: (progress: S3Progress) => void
): Promise<void> {
  const localStream = fs.createReadStream(localPath);
  const upload = new Upload({
    client: s3,
    params: {
      Bucket: S3_BUCKET_NAME,
      Key: remoteKey,
      Body: localStream,
    },
  });
  upload.on("httpUploadProgress", callback);

  await upload.done();
}
