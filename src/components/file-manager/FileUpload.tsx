"use client";

import {useState, useRef, DragEvent} from "react";
import {Button} from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {Upload, X, CheckCircle, Loader2, AlertCircle} from "lucide-react";
import {Progress} from "@/components/ui/progress";

interface FileUploadProps {
  open: boolean;
  onClose: () => void;
  onUploadComplete?: () => void;
  folderId?: string;
}

interface UploadingFile {
  file: File;
  status: "pending" | "uploading" | "success" | "error";
  progress: number;
  error?: string;
}

export function FileUpload({open, onClose, onUploadComplete, folderId}: FileUploadProps) {
  const [files, setFiles] = useState<UploadingFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);

    const droppedFiles = Array.from(e.dataTransfer.files);
    addFiles(droppedFiles);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      addFiles(selectedFiles);
    }
  };

  const addFiles = (newFiles: File[]) => {
    const uploadingFiles: UploadingFile[] = newFiles.map((file) => ({
      file,
      status: "pending",
      progress: 0,
    }));

    setFiles((prev) => [...prev, ...uploadingFiles]);
    uploadFiles(uploadingFiles);
  };

  const uploadFiles = async (filesToUpload: UploadingFile[]) => {
    for (const uploadingFile of filesToUpload) {
      await uploadFile(uploadingFile);
    }

    if (onUploadComplete) {
      onUploadComplete();
    }
  };

  const uploadFile = async (uploadingFile: UploadingFile) => {
    setFiles((prev) =>
      prev.map((f) =>
        f.file === uploadingFile.file
          ? {...f, status: "uploading", progress: 0}
          : f
      )
    );

    try {
      const tokenResponse = await fetch("/api/files/upload-token", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({
          fileName: uploadingFile.file.name,
          mimeType: uploadingFile.file.type,
          parentFolderId: folderId,
          fileSize: uploadingFile.file.size,
        }),
      });

      const tokenData = await tokenResponse.json();

      if (tokenData.code !== 200 || !tokenData.data?.uploadUrl) {
        throw new Error("Failed to get upload token");
      }

      const {uploadUrl, accessToken, uploadType, metadata} = tokenData.data;

      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener("progress", (e) => {
        if (e.lengthComputable) {
          const progress = Math.round((e.loaded / e.total) * 100);
          setFiles((prev) =>
            prev.map((f) =>
              f.file === uploadingFile.file ? {...f, progress} : f
            )
          );
        }
      });

      xhr.addEventListener("load", () => {
        if (xhr.status === 200 || xhr.status === 201) {
          setFiles((prev) =>
            prev.map((f) =>
              f.file === uploadingFile.file
                ? {...f, status: "success", progress: 100}
                : f
            )
          );
        } else {
          setFiles((prev) =>
            prev.map((f) =>
              f.file === uploadingFile.file
                ? {...f, status: "error", error: `Upload failed: ${xhr.statusText}`}
                : f
            )
          );
        }
      });

      xhr.addEventListener("error", () => {
        setFiles((prev) =>
          prev.map((f) =>
            f.file === uploadingFile.file
              ? {...f, status: "error", error: "Network error"}
              : f
          )
        );
      });

      if (uploadType === "simple") {
        const boundary = "-------314159265358979323846";
        const delimiter = "\r\n--" + boundary + "\r\n";
        const closeDelimiter = "\r\n--" + boundary + "--";

        const metadataStr = JSON.stringify(metadata);
        const multipartRequestBody =
          delimiter +
          "Content-Type: application/json; charset=UTF-8\r\n\r\n" +
          metadataStr +
          delimiter +
          "Content-Type: " + uploadingFile.file.type + "\r\n\r\n";

        const reader = new FileReader();
        reader.onload = () => {
          const fileContent = reader.result;
          const requestBody = multipartRequestBody + fileContent + closeDelimiter;

          xhr.open("POST", uploadUrl);
          xhr.setRequestHeader("Content-Type", `multipart/related; boundary=${boundary}`);
          xhr.setRequestHeader("Authorization", `Bearer ${accessToken}`);
          xhr.send(requestBody);
        };
        reader.readAsText(uploadingFile.file);
      } else {
        xhr.open("PUT", uploadUrl);
        xhr.setRequestHeader("Content-Type", uploadingFile.file.type);
        xhr.setRequestHeader("Authorization", `Bearer ${accessToken}`);
        xhr.send(uploadingFile.file);
      }
    } catch (error) {
      setFiles((prev) =>
        prev.map((f) =>
          f.file === uploadingFile.file
            ? {...f, status: "error", error: "Upload failed"}
            : f
        )
      );
    }
  };

  const removeFile = (file: File) => {
    setFiles((prev) => prev.filter((f) => f.file !== file));
  };

  const handleClose = () => {
    setFiles([]);
    onClose();
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i];
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Upload Files</DialogTitle>
          <DialogDescription>
            Drag and drop files or click to select files to upload
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              isDragging
                ? "border-primary bg-primary/5"
                : "border-muted-foreground/25"
            }`}
          >
            <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-sm font-medium mb-2">
              Drag and drop files here
            </p>
            <p className="text-xs text-muted-foreground mb-4">or</p>
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
            >
              Select Files
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={handleFileSelect}
            />
          </div>

          {files.length > 0 && (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {files.map((uploadingFile, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 p-3 border rounded-lg"
                >
                  <div className="flex-shrink-0">
                    {uploadingFile.status === "success" && (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    )}
                    {uploadingFile.status === "error" && (
                      <AlertCircle className="h-5 w-5 text-red-500" />
                    )}
                    {uploadingFile.status === "uploading" && (
                      <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
                    )}
                    {uploadingFile.status === "pending" && (
                      <Upload className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {uploadingFile.file.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(uploadingFile.file.size)}
                    </p>
                    {uploadingFile.status === "uploading" && (
                      <Progress value={uploadingFile.progress} className="mt-1" />
                    )}
                    {uploadingFile.status === "error" && (
                      <p className="text-xs text-red-500 mt-1">
                        {uploadingFile.error}
                      </p>
                    )}
                  </div>

                  {uploadingFile.status !== "uploading" && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(uploadingFile.file)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

