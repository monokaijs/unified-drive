import {dbService} from '@/lib/db/service';
import {User, UserRole} from '@/lib/types/models/user';
import {authService} from '@/lib/services/auth';
import {z} from 'zod';
import {registerSchema} from '@/lib/validations/auth';

class UserService {
  async create(user: z.infer<typeof registerSchema>, password: string) {
    const existingUser = await this.getByUsername(user.username.toLowerCase());
    if (existingUser) throw new Error('Username already taken');
    const totalUsers = await dbService.user.count();
    return await dbService.user.create({
      username: user.username.toLowerCase(),
      password: await authService.hashPassword(password, 10),
      role: totalUsers === 0 ? UserRole.Admin : UserRole.User,
    });
  }

  getById(id: string) {
    return dbService.user.findById(id);
  }

  getByUsername(username: string) {
    return dbService.user.findOne({username});
  }
}

export const userService = new UserService();
