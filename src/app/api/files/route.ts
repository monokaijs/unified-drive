import {NextRequest} from "next/server";
import {withApi} from "@/lib/middlewares/withApi";
import {dbService} from "@/lib/services/db";
import {GoogleDriveService} from "@/lib/services/googleDrive";
import {getServerSession} from "next-auth";

export const GET = withApi(async (req: NextRequest) => {
  const session = await getServerSession();

  if (!session?.user?.email) {
    return {success: false, error: "Unauthorized", status: 401};
  }

  await dbService.connect();

  const user = await dbService.user.findOne({username: session.user.email});

  if (!user) {
    return {success: false, error: "User not found", status: 404};
  }

  const {searchParams} = new URL(req.url);
  const connectionId = searchParams.get("connectionId");
  const folderId = searchParams.get("folderId");

  let credential;
  if (connectionId) {
    credential = await dbService.googleOAuthCredential.findOne({
      _id: connectionId,
      userId: user._id,
    });
  } else {
    const credentials = await dbService.googleOAuthCredential.find({
      userId: user._id,
    });
    credential = credentials.find(c => c.isActive) || credentials[0];
  }

  if (!credential) {
    return {success: false, error: "Google Drive not connected or no active connection", status: 400};
  }

  const systemPreference = await dbService.systemPreference.findOne({});

  if (!systemPreference?.googleOAuthClientId || !systemPreference?.googleOAuthClientSecret) {
    return {success: false, error: "OAuth client not configured", status: 400};
  }

  const driveService = new GoogleDriveService(
    credential,
    systemPreference.googleOAuthClientId,
    systemPreference.googleOAuthClientSecret
  );
  const files = await driveService.listFiles(folderId || undefined);

  return {success: true, data: files};
});

export const POST = withApi(async (req: NextRequest) => {
  const session = await getServerSession();

  if (!session?.user?.email) {
    return {success: false, error: "Unauthorized", status: 401};
  }

  await dbService.connect();

  const user = await dbService.user.findOne({username: session.user.email});

  if (!user) {
    return {success: false, error: "User not found", status: 404};
  }

  const credentials = await dbService.googleOAuthCredential.find({
    userId: user._id,
  });

  const credential = credentials.find(c => c.isActive) || credentials[0];

  if (!credential) {
    return {success: false, error: "Google Drive not connected or no active connection", status: 400};
  }

  const systemPreference = await dbService.systemPreference.findOne({});

  if (!systemPreference?.googleOAuthClientId || !systemPreference?.googleOAuthClientSecret) {
    return {success: false, error: "OAuth client not configured", status: 400};
  }

  const formData = await req.formData();
  const file = formData.get("file") as File;
  const parentFolderId = formData.get("parentFolderId") as string;

  if (!file) {
    return {success: false, error: "File is required", status: 400};
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  const driveService = new GoogleDriveService(
    credential,
    systemPreference.googleOAuthClientId,
    systemPreference.googleOAuthClientSecret
  );
  const uploadedFile = await driveService.uploadFile(
    file.name,
    file.type,
    buffer,
    parentFolderId || undefined
  );

  return {success: true, data: uploadedFile};
});

