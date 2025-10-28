import mongoose from "mongoose";
import {GoogleOAuthCredential} from "@/lib/types/models/googleOAuthCredential";

export const GoogleOAuthCredentialSchema = new mongoose.Schema<GoogleOAuthCredential>({
  userId: {type: String, required: true, index: true},
  accessToken: {type: String, required: true},
  refreshToken: {type: String, required: true},
  expiresAt: {type: Date, required: true},
  scope: {type: String, required: true},
  driveRootFolderId: {type: String, required: false},
  connectionName: {type: String, required: false, default: "My Drive"},
  isActive: {type: Boolean, required: false, default: false},
}, {timestamps: true});

GoogleOAuthCredentialSchema.index({userId: 1, connectionName: 1}, {unique: true});

