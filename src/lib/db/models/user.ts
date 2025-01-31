import mongoose from 'mongoose';
import mongoosePaginate from 'mongoose-paginate-v2';
import {User, UserRole} from '@/lib/types/models/user';

export const UserSchema = new mongoose.Schema<User>({
  username: String,
  password: {
    type: String,
    select: false,
  },
  role: {
    type: String,
    enum: Object.values(UserRole),
    default: UserRole.User,
  },
});

UserSchema.plugin(mongoosePaginate);
