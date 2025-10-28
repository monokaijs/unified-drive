import mongoose from 'mongoose';
import {SystemPreference} from "@/lib/types/models/systemPreference";

export const SystemPreferenceSchema = new mongoose.Schema<SystemPreference>({
  systemName: {
    type: String,
    required: true,
  },
  allowRegistration: {
    type: Boolean,
    required: true,
    default: false,
  },
  googleOAuthClientId: {
    type: String,
    required: false,
  },
  googleOAuthClientSecret: {
    type: String,
    required: false,
  },
}, {
  timestamps: true,
});

