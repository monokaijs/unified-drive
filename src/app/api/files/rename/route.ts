import {NextRequest} from "next/server";
import {withApi} from "@/lib/middlewares/withApi";
import {dbService} from "@/lib/services/db";
import {GoogleDriveService} from "@/lib/services/googleDrive";
import {getServerSession} from "next-auth";

export const PUT = withApi(async (req: NextRequest) => {
  const session = await getServerSession();

  if (!session?.user?.email) {
    return {success: false, error: "Unauthorized", status: 401};
  }

  await dbService.connect();

  const user = await dbService.user.findOne({username: session.user.email});

  if (!user) {
    return {success: false, error: "User not found", status: 404};
  }

  const body = await req.json();
  const {fileId, newName, connectionId} = body;

  if (!fileId || !newName) {
    return {success: false, error: "File ID and new name are required", status: 400};
  }

  const credentials = await dbService.googleOAuthCredential.find({
    userId: user._id,
  });

  let credential;
  if (connectionId) {
    credential = credentials.find(c => c._id.toString() === connectionId);
  } else {
    credential = credentials.find(c => c.isActive) || credentials[0];
  }

  if (!credential) {
    return {success: false, error: "Google Drive not connected", status: 400};
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

  const file = await driveService.renameFile(fileId, newName);

  return {success: true, data: file};
});

