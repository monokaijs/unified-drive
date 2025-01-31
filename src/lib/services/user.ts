import {dbService} from '@/lib/db/service';

class UserService {
  getById(id: string) {
    return dbService.user.findById(id);
  }
  getByUsername(username: string) {
    return dbService.user.findOne({username});
  }
}

export const userService = new UserService();
