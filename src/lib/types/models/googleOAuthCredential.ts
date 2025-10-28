export interface GoogleOAuthCredential {
  _id: string;
  userId: string;
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
  scope: string;
  driveRootFolderId?: string;
  connectionName?: string;
  isActive?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

