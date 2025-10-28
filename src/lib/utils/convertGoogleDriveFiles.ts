import {FileItem, FileType} from "@/lib/types/fileManager";

export function convertGoogleDriveFiles(driveFiles: any[]): FileItem[] {
  return driveFiles.map((file) => ({
    id: file.id,
    name: file.name,
    type: file.mimeType === "application/vnd.google-apps.folder" ? FileType.Folder : FileType.Unknown,
    size: file.size ? parseInt(file.size) : 0,
    createdAt: new Date(file.createdTime || file.modifiedTime),
    modifiedAt: new Date(file.modifiedTime),
    path: file.name,
    children: [],
  }));
}
