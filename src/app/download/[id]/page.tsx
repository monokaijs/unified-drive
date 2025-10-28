"use client";

import {useEffect, useState} from "react";
import {useParams} from "next/navigation";
import {FileItem} from "@/lib/types/fileManager";
import {mockFiles} from "@/lib/data/mockFiles";
import {FileIcon} from "@/components/file-manager/FileIcon";
import {formatFileSize, formatDate} from "@/lib/utils/fileUtils";
import {Button} from "@/components/ui/button";
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import {Download, FileX, Loader2} from "lucide-react";

function findFileById(files: FileItem[], id: string): FileItem | null {
  for (const file of files) {
    if (file.id === id) {
      return file;
    }
    if (file.children) {
      const found = findFileById(file.children, id);
      if (found) return found;
    }
  }
  return null;
}

export default function DownloadPage() {
  const params = useParams();
  const [file, setFile] = useState<FileItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    const fileId = params.id as string;
    const foundFile = findFileById(mockFiles, fileId);
    setFile(foundFile);
    setLoading(false);
  }, [params.id]);

  const handleDownload = async () => {
    if (!file) return;

    setDownloading(true);

    try {
      const response = await fetch(`/api/files/download/${file.id}`);
      if (response.ok) {
        const data = await response.json();
        if (data.downloadUrl) {
          const link = document.createElement("a");
          link.href = data.downloadUrl;
          link.download = data.fileName || file.name;
          link.target = "_blank";
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }
      }
    } catch (error) {
      console.error("Download failed:", error);
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/10">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!file) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/10 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <FileX className="h-16 w-16 text-muted-foreground" />
            </div>
            <CardTitle>File Not Found</CardTitle>
            <CardDescription>
              The file you're looking for doesn't exist or has been removed.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/10 p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="w-24 h-24 flex items-center justify-center bg-muted rounded-lg">
              <FileIcon type={file.type} className="h-16 w-16" />
            </div>
          </div>
          <CardTitle className="text-2xl">{file.name}</CardTitle>
          <CardDescription>
            Ready to download
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
            <div>
              <p className="text-sm text-muted-foreground">File Size</p>
              <p className="font-medium">{formatFileSize(file.size)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Modified</p>
              <p className="font-medium">{formatDate(file.modifiedAt)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Type</p>
              <p className="font-medium">{file.extension?.toUpperCase() || "Folder"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Created</p>
              <p className="font-medium">{formatDate(file.createdAt)}</p>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <Button
              size="lg"
              className="w-full"
              onClick={handleDownload}
              disabled={downloading}
            >
              {downloading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Preparing Download...
                </>
              ) : (
                <>
                  <Download className="mr-2 h-5 w-5" />
                  Download File
                </>
              )}
            </Button>
            
            <p className="text-xs text-center text-muted-foreground">
              This file was shared with you. Click the button above to download it.
            </p>
          </div>

          <div className="pt-4 border-t">
            <div className="flex items-start gap-2 text-sm text-muted-foreground">
              <div className="mt-0.5">ℹ️</div>
              <div>
                <p className="font-medium text-foreground mb-1">Download Information</p>
                <ul className="space-y-1 text-xs">
                  <li>• The download will start automatically</li>
                  <li>• Make sure you have enough storage space</li>
                  <li>• Scan the file with antivirus software before opening</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

