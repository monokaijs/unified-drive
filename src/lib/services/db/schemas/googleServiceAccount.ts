import mongoose from "mongoose";
import {GoogleServiceAccount} from "@/lib/types/models/googleServiceAccount";

export const GoogleServiceAccountSchema = new mongoose.Schema<GoogleServiceAccount>({
  userId: {type: String, required: true, index: true},
  serviceAccountEmail: {type: String, required: true},
  serviceAccountJson: {type: String, required: true},
  projectId: {type: String, required: true},
  isVerified: {type: Boolean, required: true, default: false},
  driveRootFolderId: {type: String, required: true},
  lastVerifiedAt: {type: Date},
}, {timestamps: true});

