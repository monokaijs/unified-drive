import {User} from '@/lib/types/models/user';
import {BaseRepository} from '@/lib/db/repository';
import {Schemas} from '@/lib/db/types/schemas';
import {UserSchema} from '@/lib/db/models/user';
import dbConnect from '@/lib/db/client';

class DBService {
  user: BaseRepository<User>;

  constructor() {
    this.user = new BaseRepository<User>(Schemas.User, UserSchema);
  }

  connect() {
    return dbConnect();
  }
}

export const dbService = new DBService();
