export enum FileType {
  Folder = 'folder',
  Document = 'document',
  Image = 'image',
  Video = 'video',
  Audio = 'audio',
  Archive = 'archive',
  Code = 'code',
  PDF = 'pdf',
  Spreadsheet = 'spreadsheet',
  Presentation = 'presentation',
  Text = 'text',
  Unknown = 'unknown',
}

export interface FileItem {
  id: string;
  name: string;
  type: FileType;
  size?: number;
  modifiedAt: Date;
  createdAt: Date;
  path: string;
  extension?: string;
  children?: FileItem[];
  isShared?: boolean;
  shareLink?: string;
  downloadLink?: string;
}

export interface ShareLinkData {
  fileId: string;
  shareLink: string;
  downloadLink: string;
  expiresAt?: Date;
  password?: string;
}

