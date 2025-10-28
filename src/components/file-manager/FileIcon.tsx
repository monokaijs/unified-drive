import {FileType} from "@/lib/types/fileManager";
import {
  File,
  Folder,
  FileText,
  Image,
  Video,
  Music,
  Archive,
  Code,
  FileSpreadsheet,
  Presentation,
} from "lucide-react";

interface FileIconProps {
  type: FileType;
  className?: string;
}

export function FileIcon({type, className = "h-5 w-5"}: FileIconProps) {
  switch (type) {
    case FileType.Folder:
      return <Folder className={className} />;
    case FileType.Document:
      return <FileText className={className} />;
    case FileType.Image:
      return <Image className={className} />;
    case FileType.Video:
      return <Video className={className} />;
    case FileType.Audio:
      return <Music className={className} />;
    case FileType.Archive:
      return <Archive className={className} />;
    case FileType.Code:
      return <Code className={className} />;
    case FileType.PDF:
      return <FileText className={`${className} text-red-500`} />;
    case FileType.Spreadsheet:
      return <FileSpreadsheet className={className} />;
    case FileType.Presentation:
      return <Presentation className={className} />;
    case FileType.Text:
      return <FileText className={className} />;
    default:
      return <File className={className} />;
  }
}

