import {BaseRepository} from "@/lib/services/db/repository";
import dbConnect from "@/lib/services/db/client";
import {Schemas} from "@/lib/services/db/schemas";
import {User} from "@/lib/types/models/user";
import {UserSchema} from "@/lib/services/db/schemas/user";
import {SystemPreference} from "@/lib/types/models/systemPreference";
import {SystemPreferenceSchema} from "@/lib/services/db/schemas/systemPreference";
import {GoogleServiceAccount} from "@/lib/types/models/googleServiceAccount";
import {GoogleServiceAccountSchema} from "@/lib/services/db/schemas/googleServiceAccount";
import {GoogleOAuthCredential} from "@/lib/types/models/googleOAuthCredential";
import {GoogleOAuthCredentialSchema} from "@/lib/services/db/schemas/googleOAuthCredential";


class DBService {
  user: BaseRepository<User>;
  systemPreference: BaseRepository<SystemPreference>;
  googleServiceAccount: BaseRepository<GoogleServiceAccount>;
  googleOAuthCredential: BaseRepository<GoogleOAuthCredential>;

  constructor() {
    this.user = new BaseRepository<User>(Schemas.User, UserSchema);
    this.systemPreference = new BaseRepository<SystemPreference>(Schemas.SystemPreference, SystemPreferenceSchema);
    this.googleServiceAccount = new BaseRepository<GoogleServiceAccount>(Schemas.GoogleServiceAccount, GoogleServiceAccountSchema);
    this.googleOAuthCredential = new BaseRepository<GoogleOAuthCredential>(Schemas.GoogleOAuthCredential, GoogleOAuthCredentialSchema);
  }

  connect() {
    return dbConnect();
  }
}

export const dbService = new DBService();
