import oneDriveAPI from "onedrive-api";
import {
  ONEDRIVE_OAUTH_CLIENT_ID,
  ONEDRIVE_OAUTH_CLIENT_SECRET,
  ONEDRIVE_ROOT_DIR,
  ONEDRIVE_OATH_REDIRECT_URI,
} from "./config";
import fs from "fs";
import { AuthorizationCode } from "simple-oauth2";
import { authorizeOneDrive } from "./promptService";

const oneDriveTokenPath = "./.onedrive_auth";

const authClient = new AuthorizationCode({
  client: {
    id: ONEDRIVE_OAUTH_CLIENT_ID,
    secret: ONEDRIVE_OAUTH_CLIENT_SECRET,
  },
  auth: {
    tokenHost: "https://login.microsoftonline.com",
    authorizePath: "/common/oauth2/v2.0/authorize",
    tokenPath: "/common/oauth2/v2.0/token",
  },
});

export async function authorizeApp() {
  const authorizationUri = authClient.authorizeURL({
    redirect_uri: ONEDRIVE_OATH_REDIRECT_URI,
    scope: "User.Read User.ReadBasic.All Files.ReadWrite offline_access",
  });

  const code = await authorizeOneDrive(authorizationUri);

  const tokenParams = {
    code,
    redirect_uri: ONEDRIVE_OATH_REDIRECT_URI,
  };
  const accessToken = await authClient.getToken(tokenParams);
  fs.writeFileSync(oneDriveTokenPath, JSON.stringify(accessToken));

  console.log(`Token saved to ${oneDriveTokenPath}`);
}

async function getAccessToken(): Promise<string> {
  if (!fs.existsSync(oneDriveTokenPath)) {
    throw new Error(
      "Onedrive not authorized. Run with --authorizeOneDrive first"
    );
  }

  const tokenJson = fs.readFileSync(oneDriveTokenPath).toString();
  let accessToken = authClient.createToken(JSON.parse(tokenJson));

  if (accessToken.expired(30 * 60)) {
    accessToken = await accessToken.refresh();
    fs.writeFileSync(oneDriveTokenPath, JSON.stringify(accessToken));
  }

  return accessToken.token.access_token;
}

export async function uploadSimple(
  localPath: string,
  targetPath: string
): Promise<void> {
  const uploadParams = await getUploadParams(localPath, targetPath);
  await oneDriveAPI.items.uploadSimple(uploadParams);
}

export async function uploadSession(
  localPath: string,
  targetPath: string,
  progress: (uploaded: number) => void
): Promise<any> {
  const uploadParams = await getUploadParams(localPath, targetPath);
  await oneDriveAPI.items.uploadSession(uploadParams, progress);
}

async function getUploadParams(
  localPath: string,
  targetPath: string
): Promise<object> {
  const readableStream = fs.createReadStream(localPath);
  const pathSegments = targetPath.split("/");
  const filename = pathSegments.pop();
  const parentPath = `${ONEDRIVE_ROOT_DIR}/${pathSegments.join("/")}`;
  const accessToken = await getAccessToken();

  return {
    accessToken,
    parentPath,
    filename,
    readableStream,
  };
}
