import {FileType} from "@/lib/types/fileManager";

export function getFileIcon(type: FileType, extension?: string): string {
  switch (type) {
    case FileType.Folder:
      return "📁";
    case FileType.Document:
      return "📄";
    case FileType.Image:
      return "🖼️";
    case FileType.Video:
      return "🎥";
    case FileType.Audio:
      return "🎵";
    case FileType.Archive:
      return "📦";
    case FileType.Code:
      return "💻";
    case FileType.PDF:
      return "📕";
    case FileType.Spreadsheet:
      return "📊";
    case FileType.Presentation:
      return "📽️";
    case FileType.Text:
      return "📝";
    default:
      return "📄";
  }
}

export function formatFileSize(bytes?: number): string {
  if (!bytes) return "-";
  
  const units = ["B", "KB", "MB", "GB", "TB"];
  let size = bytes;
  let unitIndex = 0;
  
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  
  return `${size.toFixed(2)} ${units[unitIndex]}`;
}

export function formatDate(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  
  if (days === 0) {
    return "Today";
  } else if (days === 1) {
    return "Yesterday";
  } else if (days < 7) {
    return `${days} days ago`;
  } else {
    return date.toLocaleDateString();
  }
}

export function getFileTypeFromExtension(extension: string): FileType {
  const ext = extension.toLowerCase();
  
  const imageExts = ["jpg", "jpeg", "png", "gif", "bmp", "svg", "webp"];
  const videoExts = ["mp4", "avi", "mov", "wmv", "flv", "mkv", "webm"];
  const audioExts = ["mp3", "wav", "ogg", "m4a", "flac", "aac"];
  const archiveExts = ["zip", "rar", "7z", "tar", "gz", "tar.gz"];
  const codeExts = ["js", "ts", "jsx", "tsx", "html", "css", "scss", "json", "xml", "py", "java", "cpp", "c", "php", "rb", "go"];
  const documentExts = ["doc", "docx", "odt"];
  const spreadsheetExts = ["xls", "xlsx", "ods", "csv"];
  const presentationExts = ["ppt", "pptx", "odp"];
  const textExts = ["txt", "md", "log"];
  
  if (ext === "pdf") return FileType.PDF;
  if (imageExts.includes(ext)) return FileType.Image;
  if (videoExts.includes(ext)) return FileType.Video;
  if (audioExts.includes(ext)) return FileType.Audio;
  if (archiveExts.includes(ext)) return FileType.Archive;
  if (codeExts.includes(ext)) return FileType.Code;
  if (documentExts.includes(ext)) return FileType.Document;
  if (spreadsheetExts.includes(ext)) return FileType.Spreadsheet;
  if (presentationExts.includes(ext)) return FileType.Presentation;
  if (textExts.includes(ext)) return FileType.Text;
  
  return FileType.Unknown;
}

