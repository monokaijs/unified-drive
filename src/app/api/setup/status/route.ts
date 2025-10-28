import {NextRequest} from "next/server";
import {withApi} from "@/lib/middlewares/withApi";
import {dbService} from "@/lib/services/db";

async function handler(request: NextRequest) {
  const systemPreference = await dbService.systemPreference.findOne({});
  const userCount = await dbService.user.count({});

  return {
    isSetupComplete: !!systemPreference && userCount > 0,
    systemPreference: systemPreference ? {
      systemName: systemPreference.systemName,
      allowRegistration: systemPreference.allowRegistration,
    } : null,
  };
}

export const GET = withApi(handler);

