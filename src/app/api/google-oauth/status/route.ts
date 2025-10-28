import {NextRequest} from "next/server";
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

  const credentials = await dbService.googleOAuthCredential.find({
    userId: user._id,
  });

  const activeCredential = credentials.find(c => c.isActive) || credentials[0];

  const systemPreference = await dbService.systemPreference.findOne({});
  const isOAuthConfigured = !!(systemPreference?.googleOAuthClientId && systemPreference?.googleOAuthClientSecret);

  return {
    isConnected: credentials.length > 0,
    isOAuthConfigured,
    driveRootFolderId: activeCredential?.driveRootFolderId || null,
    connectionName: activeCredential?.connectionName || "My Drive",
    connections: credentials.map(c => ({
      _id: c._id,
      connectionName: c.connectionName || "My Drive",
      isActive: c.isActive || false,
      driveRootFolderId: c.driveRootFolderId,
    })),
  };
});

export const DELETE = withApi(async (req: NextRequest) => {
  const session = await getServerSession();

  if (!session?.user?.email) {
    throw {code: 401, message: "Unauthorized"};
  }

  const user = await dbService.user.findOne({username: session.user.email});

  if (!user) {
    throw {code: 404, message: "User not found"};
  }

  const searchParams = req.nextUrl.searchParams;
  const connectionId = searchParams.get("connectionId");

  if (connectionId) {
    const credential = await dbService.googleOAuthCredential.findOne({
      _id: connectionId,
      userId: user._id,
    });

    if (!credential) {
      throw {code: 404, message: "Connection not found"};
    }

    await dbService.googleOAuthCredential.deleteOne(connectionId);

    if (credential.isActive) {
      const remainingCredentials = await dbService.googleOAuthCredential.find({
        userId: user._id,
      });

      if (remainingCredentials.length > 0) {
        await dbService.googleOAuthCredential.findOneAndUpdate(
          {_id: remainingCredentials[0]._id},
          {isActive: true},
          {new: true}
        );
      }
    }

    return {
      message: "Connection deleted successfully",
    };
  } else {
    await dbService.googleOAuthCredential._model.deleteMany({
      userId: user._id,
    });

    return {
      message: "All connections deleted successfully",
    };
  }
});

