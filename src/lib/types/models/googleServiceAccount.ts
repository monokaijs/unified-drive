export interface GoogleServiceAccount {
  _id: string;
  userId: string;
  serviceAccountEmail: string;
  serviceAccountJson: string;
  projectId: string;
  isVerified: boolean;
  driveRootFolderId: string;
  lastVerifiedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

