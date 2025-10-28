import {NextRequest} from "next/server";
import {withApi} from "@/lib/middlewares/withApi";
import {dbService} from "@/lib/services/db";
import {getServerSession} from "next-auth";
import {UserRole} from "@/lib/types/models/user";

export const POST = withApi(async (req: NextRequest) => {
  const session = await getServerSession();

  if (!session?.user?.email) {
    throw {code: 401, message: "Unauthorized"};
  }

  await dbService.connect();

  const user = await dbService.user.findOne({username: session.user.email});

  if (!user) {
    throw {code: 404, message: "User not found"};
  }

  if (user.role !== UserRole.Admin) {
    throw {code: 403, message: "Only administrators can configure OAuth client"};
  }

  const body = await req.json();
  const {clientId, clientSecret} = body;

  if (!clientId || !clientSecret) {
    throw {code: 400, message: "Client ID and Client Secret are required"};
  }

  const systemPreference = await dbService.systemPreference.findOne({});

  if (!systemPreference) {
    throw {code: 400, message: "System is not set up yet"};
  }

  await dbService.systemPreference.findOneAndUpdate(
    {_id: systemPreference._id},
    {
      googleOAuthClientId: clientId,
      googleOAuthClientSecret: clientSecret,
    },
    {new: true}
  );

  return {
    message: "OAuth client configured successfully",
    clientId,
  };
});

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

  if (user.role !== UserRole.Admin) {
    throw {code: 403, message: "Only administrators can view OAuth client configuration"};
  }

  const systemPreference = await dbService.systemPreference.findOne({});

  if (!systemPreference) {
    throw {code: 400, message: "System is not set up yet"};
  }

  return {
    clientId: systemPreference.googleOAuthClientId || null,
    isConfigured: !!(systemPreference.googleOAuthClientId && systemPreference.googleOAuthClientSecret),
  };
});

export const DELETE = withApi(async (req: NextRequest) => {
  const session = await getServerSession();

  if (!session?.user?.email) {
    throw {code: 401, message: "Unauthorized"};
  }

  await dbService.connect();

  const user = await dbService.user.findOne({username: session.user.email});

  if (!user) {
    throw {code: 404, message: "User not found"};
  }

  if (user.role !== UserRole.Admin) {
    throw {code: 403, message: "Only administrators can delete OAuth client configuration"};
  }

  const systemPreference = await dbService.systemPreference.findOne({});

  if (!systemPreference) {
    throw {code: 400, message: "System is not set up yet"};
  }

  await dbService.systemPreference.findOneAndUpdate(
    {_id: systemPreference._id},
    {
      googleOAuthClientId: undefined,
      googleOAuthClientSecret: undefined,
    },
    {new: true}
  );

  return {
    message: "OAuth client configuration removed successfully",
  };
});

