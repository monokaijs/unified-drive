import {NextRequest, NextResponse} from "next/server";
import {dbService} from "@/lib/services/db";
import {GoogleDriveService} from "@/lib/services/googleDrive";
import {getServerSession} from "next-auth";

export async function GET(
  req: NextRequest,
  {params}: {params: Promise<{id: string}>}
) {
  try {
    const {id} = await params;
    const session = await getServerSession();

    if (!session?.user?.email) {
      return NextResponse.json({error: "Unauthorized"}, {status: 401});
    }

    await dbService.connect();

    const user = await dbService.user.findOne({username: session.user.email});

    if (!user) {
      return NextResponse.json({error: "User not found"}, {status: 404});
    }

    const credentials = await dbService.googleOAuthCredential.find({
      userId: user._id,
    });

    const credential = credentials.find(c => c.isActive) || credentials[0];

    if (!credential) {
      return NextResponse.json({error: "Google Drive not connected or no active connection"}, {status: 400});
    }

    const systemPreference = await dbService.systemPreference.findOne({});

    if (!systemPreference?.googleOAuthClientId || !systemPreference?.googleOAuthClientSecret) {
      return NextResponse.json({error: "OAuth client not configured"}, {status: 400});
    }

    const driveService = new GoogleDriveService(
      credential,
      systemPreference.googleOAuthClientId,
      systemPreference.googleOAuthClientSecret
    );

    const fileMetadata = await driveService.getFile(id);

    return NextResponse.json({
      downloadUrl: fileMetadata.webContentLink,
      fileName: fileMetadata.name,
      mimeType: fileMetadata.mimeType,
      size: fileMetadata.size,
    });
  } catch (error) {
    return NextResponse.json({error: "Failed to download file"}, {status: 500});
  }
}

