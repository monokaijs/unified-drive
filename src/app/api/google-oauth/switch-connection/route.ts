import {NextRequest} from "next/server";
import {withApi} from "@/lib/middlewares/withApi";
import {dbService} from "@/lib/services/db";
import {getServerSession} from "next-auth";

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

  const body = await req.json();
  const {connectionId} = body;

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

  await dbService.googleOAuthCredential._model.updateMany(
    {userId: user._id},
    {isActive: false}
  );

  await dbService.googleOAuthCredential.findOneAndUpdate(
    {_id: connectionId},
    {isActive: true},
    {new: true}
  );

  return {
    message: "Active connection switched successfully",
    connectionId,
  };
});

