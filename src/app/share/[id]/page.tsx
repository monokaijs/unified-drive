"use client";

import {useEffect, useState} from "react";
import {useParams, useRouter} from "next/navigation";
import {FileItem} from "@/lib/types/fileManager";
import {mockFiles} from "@/lib/data/mockFiles";
import {FileIcon} from "@/components/file-manager/FileIcon";
import {formatFileSize, formatDate} from "@/lib/utils/fileUtils";
import {Button} from "@/components/ui/button";
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import {Download, FileX, Loader2, ArrowLeft} from "lucide-react";

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

export default function SharePage() {
  const params = useParams();
  const router = useRouter();
  const [file, setFile] = useState<FileItem | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fileId = params.id as string;
    const foundFile = findFileById(mockFiles, fileId);
    setFile(foundFile);
    setLoading(false);
  }, [params.id]);

  const handleDownload = () => {
    if (!file) return;
    router.push(`/download/${file.id}`);
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
    <div className="min-h-screen bg-muted/10">
      <div className="border-b bg-background">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={() => router.back()}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <div className="flex items-center gap-3">
                <FileIcon type={file.type} className="h-6 w-6" />
                <div>
                  <h1 className="font-semibold">{file.name}</h1>
                  <p className="text-xs text-muted-foreground">
                    Shared file • {formatFileSize(file.size)}
                  </p>
                </div>
              </div>
            </div>
            <Button onClick={handleDownload}>
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>File Preview</CardTitle>
                <CardDescription>
                  Preview is not available for this file type
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-center h-96 bg-muted/50 rounded-lg">
                  <div className="text-center">
                    <FileIcon type={file.type} className="h-24 w-24 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      Preview not available
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Download the file to view its contents
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>File Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Type</p>
                  <p className="font-medium">{file.extension?.toUpperCase() || "Folder"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Size</p>
                  <p className="font-medium">{formatFileSize(file.size)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Modified</p>
                  <p className="font-medium">{formatDate(file.modifiedAt)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Created</p>
                  <p className="font-medium">{formatDate(file.createdAt)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Location</p>
                  <p className="font-medium text-xs break-all">{file.path}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button className="w-full" onClick={handleDownload}>
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
                <p className="text-xs text-center text-muted-foreground pt-2">
                  This file has been shared with you
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

