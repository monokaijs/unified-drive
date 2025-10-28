import {NextRequest} from "next/server";
import {withApi} from "@/lib/middlewares/withApi";
import {dbService} from "@/lib/services/db";
import {UserRole} from "@/lib/types/models/user";
import bcrypt from "bcryptjs";

async function handler(request: NextRequest) {
  const existingPreference = await dbService.systemPreference.findOne({});
  if (existingPreference) {
    throw {code: 400, message: "System is already set up"};
  }

  const body = await request.json();
  const {systemName, allowRegistration, adminUsername, adminPassword, adminFullName} = body;

  if (!systemName || typeof systemName !== 'string') {
    throw {code: 400, message: "System name is required"};
  }

  if (typeof allowRegistration !== 'boolean') {
    throw {code: 400, message: "Allow registration must be a boolean"};
  }

  if (!adminUsername || typeof adminUsername !== 'string') {
    throw {code: 400, message: "Admin username is required"};
  }

  if (!adminPassword || typeof adminPassword !== 'string') {
    throw {code: 400, message: "Admin password is required"};
  }

  if (!adminFullName || typeof adminFullName !== 'string') {
    throw {code: 400, message: "Admin full name is required"};
  }

  const existingUser = await dbService.user.findOne({username: adminUsername});
  if (existingUser) {
    throw {code: 400, message: "Username already exists"};
  }

  const hashedPassword = await bcrypt.hash(adminPassword, 10);

  const systemPreference = await dbService.systemPreference.create({
    systemName,
    allowRegistration,
  });

  const adminUser = await dbService.user.create({
    username: adminUsername,
    password: hashedPassword,
    fullName: adminFullName,
    role: UserRole.Admin,
  });

  return {
    message: "System setup completed successfully",
    systemPreference: {
      systemName: systemPreference.systemName,
      allowRegistration: systemPreference.allowRegistration,
    },
    adminUser: {
      username: adminUser.username,
      fullName: adminUser.fullName,
      role: adminUser.role,
    },
  };
}

export const POST = withApi(handler);

