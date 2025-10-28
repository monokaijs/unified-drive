import {NextRequest, NextResponse} from "next/server";
import {withApi} from "@/lib/middlewares/withApi";
import {dbService} from "@/lib/services/db";
import {getServerSession} from "next-auth";

export const GET = withApi(async (req: NextRequest) => {
  const session = await getServerSession();

  if (!session?.user?.email) {
    throw {code: 401, message: "Unauthorized"};
  }

  await dbService.connect();

  const user = await dbService.user.findOne({username: session.user.email});

  if (!user) {
    throw {code: 404, message: "User not found"};
  }

  const systemPreference = await dbService.systemPreference.findOne({});

  if (!systemPreference?.googleOAuthClientId || !systemPreference?.googleOAuthClientSecret) {
    throw {code: 400, message: "OAuth client not configured. Please contact your administrator."};
  }

  const searchParams = req.nextUrl.searchParams;
  const connectionName = searchParams.get("connectionName") || "My Drive";

  const redirectUri = `${process.env.NEXTAUTH_URL}/api/google-oauth/callback`;

  const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  authUrl.searchParams.append("client_id", systemPreference.googleOAuthClientId);
  authUrl.searchParams.append("redirect_uri", redirectUri);
  authUrl.searchParams.append("response_type", "code");
  authUrl.searchParams.append("scope", "https://www.googleapis.com/auth/drive");
  authUrl.searchParams.append("access_type", "offline");
  authUrl.searchParams.append("prompt", "consent");
  authUrl.searchParams.append("state", `${user._id.toString()}|${encodeURIComponent(connectionName)}`);

  return NextResponse.redirect(authUrl.toString());
});

