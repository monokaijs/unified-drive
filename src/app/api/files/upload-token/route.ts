import {NextRequest} from "next/server";
import {withApi} from "@/lib/middlewares/withApi";
import {dbService} from "@/lib/services/db";
import {GoogleDriveService} from "@/lib/services/googleDrive";
import {getServerSession} from "next-auth";

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

  const body = await req.json();
  const {fileName, mimeType, parentFolderId, fileSize} = body;

  if (!fileName || !mimeType) {
    return {success: false, error: "File name and mime type are required", status: 400};
  }

  const driveService = new GoogleDriveService(
    credential,
    systemPreference.googleOAuthClientId,
    systemPreference.googleOAuthClientSecret
  );
  const uploadUrl = await driveService.generateUploadUrl(
    fileName,
    mimeType,
    parentFolderId || undefined,
    fileSize
  );

  return {success: true, data: uploadUrl};
});

