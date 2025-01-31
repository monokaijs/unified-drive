import {User} from '@/lib/types/models/user';

export enum StorageStatus {
  Connected = 'connected',
  Disconnected = 'disconnected',
}

export interface Storage {
  name: string;
  type: 'google'; // support other drives in the future?
  serviceAccountJson: string;
  owner?: User;
  createdAt?: string;
  updatedAt?: string;
  status: StorageStatus;
}
