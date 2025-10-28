import {NextRequest} from "next/server";
import {withApi} from "@/lib/middlewares/withApi";
import {dbService} from "@/lib/services/db";
import {getServerSession} from "next-auth";

export const PUT = withApi(async (req: NextRequest) => {
  const session = await getServerSession();

  if (!session?.user?.email) {
    throw {code: 401, message: "Unauthorized"};
  }

  const user = await dbService.user.findOne({username: session.user.email});

  if (!user) {
    throw {code: 404, message: "User not found"};
  }

  const body = await req.json();
  const {connectionName, connectionId} = body;

  if (!connectionName || typeof connectionName !== "string") {
    throw {code: 400, message: "Connection name is required"};
  }

  if (connectionName.trim().length === 0 || connectionName.length > 50) {
    throw {code: 400, message: "Connection name must be between 1 and 50 characters"};
  }

  if (!connectionId) {
    throw {code: 400, message: "Connection ID is required"};
  }

  const credential = await dbService.googleOAuthCredential.findOne({
    _id: connectionId,
    userId: user._id,
  });

  if (!credential) {
    throw {code: 404, message: "Connection not found"};
  }

  const existingWithSameName = await dbService.googleOAuthCredential.findOne({
    userId: user._id,
    connectionName: connectionName.trim(),
    _id: {$ne: connectionId},
  });

  if (existingWithSameName) {
    throw {code: 400, message: "A connection with this name already exists"};
  }

  await dbService.googleOAuthCredential.findOneAndUpdate(
    {_id: connectionId},
    {connectionName: connectionName.trim()},
    {new: true}
  );

  return {
    message: "Connection name updated successfully",
    connectionName: connectionName.trim(),
  };
});

