import {NextRequest, NextResponse} from "next/server";
import {withApi} from "@/lib/middlewares/withApi";
import {dbService} from "@/lib/services/db";
import {google} from "googleapis";

export const GET = withApi(async (req: NextRequest) => {
  const searchParams = req.nextUrl.searchParams;
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  if (error) {
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/?error=oauth_denied`);
  }

  if (!code || !state) {
    throw {code: 400, message: "Missing authorization code or state"};
  }

  const [userId, encodedConnectionName] = state.split("|");
  const connectionName = encodedConnectionName ? decodeURIComponent(encodedConnectionName) : "My Drive";
  const user = await dbService.user.findById(userId);

  if (!user) {
    throw {code: 404, message: "User not found"};
  }

  const systemPreference = await dbService.systemPreference.findOne({});

  if (!systemPreference?.googleOAuthClientId || !systemPreference?.googleOAuthClientSecret) {
    throw {code: 400, message: "OAuth client not configured"};
  }

  const oauth2Client = new google.auth.OAuth2(
    systemPreference.googleOAuthClientId,
    systemPreference.googleOAuthClientSecret,
    `${process.env.NEXTAUTH_URL}/api/google-oauth/callback`
  );

  try {
    const {tokens} = await oauth2Client.getToken(code);

    if (!tokens.access_token || !tokens.refresh_token) {
      throw new Error("Failed to obtain tokens");
    }

    const expiresAt = new Date(Date.now() + (tokens.expiry_date || 3600 * 1000));

    oauth2Client.setCredentials(tokens);
    const drive = google.drive({version: "v3", auth: oauth2Client});

    let rootFolderId: string | undefined;
    try {
      const folderName = "Unified Drive";
      const searchResponse = await drive.files.list({
        q: `name='${folderName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
        fields: "files(id, name)",
        spaces: "drive",
      });

      if (searchResponse.data.files && searchResponse.data.files.length > 0) {
        rootFolderId = searchResponse.data.files[0].id!;
      } else {
        const folderMetadata = {
          name: folderName,
          mimeType: "application/vnd.google-apps.folder",
        };

        const folder = await drive.files.create({
          requestBody: folderMetadata,
          fields: "id",
        });

        rootFolderId = folder.data.id!;
      }
    } catch (error) {
      console.error("Failed to create/find root folder:", error);
    }

    const existingCredential = await dbService.googleOAuthCredential.findOne({
      userId: user._id,
      connectionName,
    });

    const allUserCredentials = await dbService.googleOAuthCredential.find({
      userId: user._id,
    });

    const isFirstConnection = allUserCredentials.length === 0;

    if (existingCredential) {
      await dbService.googleOAuthCredential.findOneAndUpdate(
        {userId: user._id, connectionName},
        {
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token,
          expiresAt,
          scope: tokens.scope || "https://www.googleapis.com/auth/drive",
          driveRootFolderId: rootFolderId || existingCredential.driveRootFolderId,
        },
        {new: true}
      );
    } else {
      if (isFirstConnection) {
        await dbService.googleOAuthCredential.create({
          userId: user._id,
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token,
          expiresAt,
          scope: tokens.scope || "https://www.googleapis.com/auth/drive",
          driveRootFolderId: rootFolderId,
          connectionName,
          isActive: true,
        });
      } else {
        await dbService.googleOAuthCredential.create({
          userId: user._id,
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token,
          expiresAt,
          scope: tokens.scope || "https://www.googleapis.com/auth/drive",
          driveRootFolderId: rootFolderId,
          connectionName,
          isActive: false,
        });
      }
    }

    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/?oauth_success=true`);
  } catch (error: any) {
    console.error("OAuth callback error:", error);
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/?error=oauth_failed`);
  }
});

