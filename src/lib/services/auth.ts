import {userService} from '@/lib/services/user';
import bcrypt from 'bcrypt';
import {User} from '@/lib/types/models/user';
import {encode} from 'next-auth/jwt';

class AuthService {
  async validateLogin(username: string, password: string) {
    const user = await userService.getByUsername(username)
      .select('+password'); // since we explicit set password to not be selected by default
    if (!user) throw new Error('Invalid username or password');
    if (!await this.comparePassword(password, user.password)) {
      throw new Error('Invalid username or password');
    }
    return user;
  }

  generateUserToken(user: User) {
    return encode({
      secret: process.env.NEXTAUTH_SECRET!,
      token: {
        id: user._id,
        username: user.username,
        role: user.role,
      },
    });
  }

  comparePassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(plainPassword, hashedPassword);
  }

  async hashPassword(plainPassword: string, saltRounds: number = 10): Promise<string> {
    const salt = await bcrypt.genSalt(saltRounds);
    return bcrypt.hash(plainPassword, salt);
  }

}

export const authService = new AuthService();
