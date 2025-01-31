import mongoose from 'mongoose';
import mongoosePaginate from 'mongoose-paginate-v2';
import {Storage, StorageStatus} from '@/lib/types/models/storage';
import {Schemas} from '@/lib/db/types/schemas';

export const StorageSchema = new mongoose.Schema<Storage>({
  name: String,
  type: String,
  serviceAccountJson: {
    type: String,
    required: true,
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: Schemas.User,
  },
  status: {
    type: String,
    enum: Object.values(StorageStatus),
    default: StorageStatus.Connected,
  }
}, {
  timestamps: true,
});

StorageSchema.plugin(mongoosePaginate);
