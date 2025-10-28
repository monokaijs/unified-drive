import {google} from "googleapis";
import {GoogleOAuthCredential} from "@/lib/types/models/googleOAuthCredential";
import {dbService} from "@/lib/services/db";

export class GoogleDriveService {
  private credential: GoogleOAuthCredential;
  private drive: any;
  private oauth2Client: any;
  private clientId: string;
  private clientSecret: string;

  constructor(credential: GoogleOAuthCredential, clientId: string, clientSecret: string) {
    this.credential = credential;
    this.clientId = clientId;
    this.clientSecret = clientSecret;
    this.initializeDrive();
  }

  private initializeDrive() {
    try {
      this.oauth2Client = new google.auth.OAuth2(
        this.clientId,
        this.clientSecret,
        `${process.env.NEXTAUTH_URL}/api/google-oauth/callback`
      );

      this.oauth2Client.setCredentials({
        access_token: this.credential.accessToken,
        refresh_token: this.credential.refreshToken,
        expiry_date: this.credential.expiresAt.getTime(),
      });

      this.oauth2Client.on('tokens', async (tokens: any) => {
        if (tokens.access_token) {
          await this.updateTokens(tokens);
        }
      });

      this.drive = google.drive({version: "v3", auth: this.oauth2Client});
    } catch (error) {
      throw new Error("Failed to initialize Google Drive service");
    }
  }

  private async updateTokens(tokens: any) {
    try {
      const expiresAt = new Date(tokens.expiry_date || Date.now() + 15 * 60 * 1000); // 15 mins

      await dbService.googleOAuthCredential.findOneAndUpdate(
        {_id: this.credential._id},
        {
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token || this.credential.refreshToken,
          expiresAt,
        },
        {new: true}
      );

      this.credential.accessToken = tokens.access_token;
      if (tokens.refresh_token) {
        this.credential.refreshToken = tokens.refresh_token;
      }
      this.credential.expiresAt = expiresAt;
    } catch (error) {
      console.error("Failed to update tokens:", error);
    }
  }

  private async ensureValidToken() {
    const now = new Date();
    const expiresAt = new Date(this.credential.expiresAt);

    if (expiresAt.getTime() - now.getTime() < 5 * 60 * 1000) {
      try {
        const {credentials} = await this.oauth2Client.refreshAccessToken();
        await this.updateTokens(credentials);
        this.oauth2Client.setCredentials({
          access_token: credentials.access_token,
          refresh_token: credentials.refresh_token || this.credential.refreshToken,
          expiry_date: credentials.expiry_date,
        });
      } catch (error: any) {
        console.error("Failed to refresh access token:", error);
        throw new Error(`Failed to refresh access token: ${error.message}`);
      }
    }
  }

  async verifyAccess(): Promise<boolean> {
    try {
      await this.ensureValidToken();
      const response = await this.drive.files.list({
        pageSize: 1,
        fields: "files(id, name)",
      });
      return !!response.data;
    } catch (error: any) {
      console.error("Google Drive access verification failed:", error.message);
      return false;
    }
  }

  async findOrCreateRootFolder(folderName: string = "Unified Drive"): Promise<string> {
    try {
      await this.ensureValidToken();
      const response = await this.drive.files.list({
        q: `name='${folderName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
        fields: "files(id, name)",
        spaces: "drive",
      });

      if (response.data.files && response.data.files.length > 0) {
        return response.data.files[0].id;
      }

      const folderMetadata = {
        name: folderName,
        mimeType: "application/vnd.google-apps.folder",
      };

      const folder = await this.drive.files.create({
        requestBody: folderMetadata,
        fields: "id",
      });

      return folder.data.id;
    } catch (error) {
      throw new Error("Failed to find or create root folder");
    }
  }

  async listFiles(folderId?: string) {
    try {
      await this.ensureValidToken();
      const rootFolderId = folderId || this.credential.driveRootFolderId;

      if (!rootFolderId) {
        throw new Error("Root folder ID not set");
      }

      const response = await this.drive.files.list({
        q: `'${rootFolderId}' in parents and trashed=false`,
        fields: "files(id, name, mimeType, size, modifiedTime, createdTime, webViewLink, webContentLink)",
        orderBy: "folder,name",
        supportsAllDrives: true,
        includeItemsFromAllDrives: true,
      });

      return response.data.files || [];
    } catch (error) {
      console.error("Failed to list files:", error);
      throw new Error("Failed to list files");
    }
  }

  async getFile(fileId: string) {
    try {
      await this.ensureValidToken();
      const response = await this.drive.files.get({
        fileId,
        fields: "id, name, mimeType, size, modifiedTime, createdTime, webViewLink, webContentLink, parents",
        supportsAllDrives: true,
      });

      return response.data;
    } catch (error) {
      throw new Error("Failed to get file");
    }
  }

  async uploadFile(fileName: string, mimeType: string, fileBuffer: Buffer, parentFolderId?: string) {
    try {
      await this.ensureValidToken();
      const folderId = parentFolderId || this.credential.driveRootFolderId;

      if (!folderId) {
        throw new Error("Parent folder ID not set");
      }

      const fileMetadata = {
        name: fileName,
        parents: [folderId],
      };

      const media = {
        mimeType,
        body: fileBuffer,
      };

      const response = await this.drive.files.create({
        requestBody: fileMetadata,
        media,
        fields: "id, name, mimeType, size, modifiedTime, createdTime",
        supportsAllDrives: true,
      });

      return response.data;
    } catch (error) {
      throw new Error("Failed to upload file");
    }
  }

  async downloadFile(fileId: string): Promise<Buffer> {
    try {
      await this.ensureValidToken();
      const response = await this.drive.files.get(
        {fileId, alt: "media", supportsAllDrives: true},
        {responseType: "arraybuffer"}
      );

      return Buffer.from(response.data);
    } catch (error) {
      throw new Error("Failed to download file");
    }
  }

  async deleteFile(fileId: string) {
    try {
      await this.ensureValidToken();
      await this.drive.files.delete({fileId, supportsAllDrives: true});
      return true;
    } catch (error) {
      throw new Error("Failed to delete file");
    }
  }

  async createFolder(folderName: string, parentFolderId?: string) {
    try {
      await this.ensureValidToken();
      const folderId = parentFolderId || this.credential.driveRootFolderId;

      if (!folderId) {
        throw new Error("Parent folder ID not set");
      }

      const folderMetadata = {
        name: folderName,
        mimeType: "application/vnd.google-apps.folder",
        parents: [folderId],
      };

      const response = await this.drive.files.create({
        requestBody: folderMetadata,
        fields: "id, name, mimeType, modifiedTime, createdTime",
        supportsAllDrives: true,
      });

      return response.data;
    } catch (error) {
      throw new Error("Failed to create folder");
    }
  }

  async renameFile(fileId: string, newName: string) {
    try {
      await this.ensureValidToken();
      const response = await this.drive.files.update({
        fileId,
        requestBody: {name: newName},
        fields: "id, name, mimeType, modifiedTime, createdTime",
        supportsAllDrives: true,
      });

      return response.data;
    } catch (error) {
      throw new Error("Failed to rename file");
    }
  }

  async searchFiles(query: string, folderId?: string) {
    try {
      await this.ensureValidToken();
      const rootFolderId = folderId || this.credential.driveRootFolderId;

      if (!rootFolderId) {
        throw new Error("Root folder ID not set");
      }

      const searchQuery = `'${rootFolderId}' in parents and name contains '${query}' and trashed=false`;

      const response = await this.drive.files.list({
        q: searchQuery,
        fields: "files(id, name, mimeType, size, modifiedTime, createdTime, webViewLink, webContentLink)",
        orderBy: "folder,name",
        supportsAllDrives: true,
        includeItemsFromAllDrives: true,
      });

      return response.data.files || [];
    } catch (error) {
      throw new Error("Failed to search files");
    }
  }

  async getFileMetadata(fileId: string) {
    try {
      await this.ensureValidToken();
      const response = await this.drive.files.get({
        fileId,
        fields: "*",
        supportsAllDrives: true,
      });

      return response.data;
    } catch (error) {
      throw new Error("Failed to get file metadata");
    }
  }

  async generateUploadUrl(fileName: string, mimeType: string, parentFolderId?: string, fileSize?: number) {
    try {
      await this.ensureValidToken();
      const folderId = parentFolderId || this.credential.driveRootFolderId;

      if (!folderId) {
        throw new Error("Parent folder ID not set");
      }

      const accessToken = this.credential.accessToken;

      if (!accessToken) {
        throw new Error("Failed to get access token");
      }

      const SIMPLE_UPLOAD_THRESHOLD = 5 * 1024 * 1024;
      const useSimpleUpload = fileSize !== undefined && fileSize < SIMPLE_UPLOAD_THRESHOLD;

      if (useSimpleUpload) {
        const metadata = {
          name: fileName,
          parents: [folderId],
        };

        return {
          uploadUrl: `https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&supportsAllDrives=true`,
          accessToken: accessToken,
          expiresIn: 3600,
          uploadType: "simple" as const,
          metadata,
        };
      }

      const fileMetadata = {
        name: fileName,
        parents: [folderId],
      };

      const headers: Record<string, string> = {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json; charset=UTF-8",
        "X-Upload-Content-Type": mimeType,
      };

      if (fileSize !== undefined) {
        headers["X-Upload-Content-Length"] = fileSize.toString();
      }

      const initResponse = await fetch(
        "https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable&supportsAllDrives=true",
        {
          method: "POST",
          headers,
          body: JSON.stringify(fileMetadata),
        }
      );

      if (!initResponse.ok) {
        const errorText = await initResponse.text();
        throw new Error(`Failed to initialize upload: ${initResponse.status} ${errorText}`);
      }

      const uploadUrl = initResponse.headers.get("Location");

      if (!uploadUrl) {
        throw new Error("Failed to get upload URL from response");
      }

      return {
        uploadUrl,
        accessToken: accessToken,
        expiresIn: 3600,
        uploadType: "resumable" as const,
      };
    } catch (error: any) {
      throw new Error(`Failed to generate upload URL: ${error.message}`);
    }
  }
}

