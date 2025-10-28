"use client";

import {Suspense, useEffect, useMemo, useState, DragEvent} from "react";
import {useSearchParams} from "next/navigation";
import {FileItem, FileType} from "@/lib/types/fileManager";
import {FileHeader} from "@/components/file-manager/FileHeader";
import {FileGridView} from "@/components/file-manager/FileGridView";
import {FileListView} from "@/components/file-manager/FileListView";
import {ShareModal} from "@/components/file-manager/ShareModal";
import {FileUpload} from "@/components/file-manager/FileUpload";
import {ConnectDriveModal} from "@/components/file-manager/ConnectDriveModal";
import {CreateFolderModal} from "@/components/file-manager/CreateFolderModal";
import {Alert, AlertDescription} from "@/components/ui/alert";
import {AlertCircle, Loader2} from "lucide-react";
import {IconFolder} from "@tabler/icons-react";
import {convertGoogleDriveFiles} from "@/lib/utils/convertGoogleDriveFiles";
import {useFileManager} from "@/contexts/FileManagerContext";
import {toast} from "sonner";

type ViewMode = "grid" | "list";

interface Connection {
  _id: string;
  connectionName: string;
  isActive: boolean;
}

function HomePage() {
  const searchParams = useSearchParams();
  const {refreshSidebar} = useFileManager();
  const [currentFolderName, setCurrentFolderName] = useState("My Drive");
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [currentConnectionId, setCurrentConnectionId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [shareFile, setShareFile] = useState<FileItem | null>(null);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [createFolderOpen, setCreateFolderOpen] = useState(false);
  const [connectDriveOpen, setConnectDriveOpen] = useState(false);
  const [currentFiles, setCurrentFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [isDragging, setIsDragging] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState<File[]>([]);

  useEffect(() => {
    fetchConnectionInfo();
  }, []);

  const fetchConnectionInfo = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/google-oauth/status");
      const data = await response.json();
      if (data.code === 200 && data.data) {
        const conns = data.data.connections || [];
        setConnections(conns);
      }
    } catch (error) {
      console.error("Failed to fetch connection info:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFiles = async (connectionId: string, folderId: string | null = null) => {
    try {
      setLoading(true);

      const url = folderId
        ? `/api/files?connectionId=${connectionId}&folderId=${folderId}`
        : `/api/files?connectionId=${connectionId}`;
      const response = await fetch(url);
      const data = await response.json();

      if (data.code === 200 && data.data) {
        const convertedFiles = convertGoogleDriveFiles(data.data);
        setCurrentFiles(convertedFiles);
      }
    } catch (error) {
      console.error("Failed to load files:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleNavigate = (file: FileItem) => {
    if (file.type === FileType.Folder && currentConnectionId) {
      setCurrentFolderName(file.name);
      setCurrentFolderId(file.id);
      fetchFiles(currentConnectionId, file.id);
    }
  };

  const handleDownload = async (file: FileItem) => {
    try {
      const response = await fetch(`/api/files/download/${file.id}?connectionId=${currentConnectionId}`);
      if (response.ok) {
        const data = await response.json();
        if (data.downloadUrl) {
          const a = document.createElement("a");
          a.href = data.downloadUrl;
          a.download = data.fileName || file.name;
          a.target = "_blank";
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
        }
      }
    } catch (error) {
      console.error("Download failed:", error);
    }
  };

  const handleShare = (file: FileItem) => {
    setShareFile(file);
  };

  useEffect(() => {
    if (connections.length > 0) {
      const urlConnectionId = searchParams.get("connectionId");
      const urlFolderId = searchParams.get("folderId");

      if (urlConnectionId) {
        const connection = connections.find(c => c._id === urlConnectionId);
        if (connection) {
          setCurrentConnectionId(urlConnectionId);
          setCurrentFolderId(urlFolderId);
          setCurrentFolderName(urlFolderId ? "" : connection.connectionName);
          setSelectedFiles(new Set());
          fetchFiles(urlConnectionId, urlFolderId);
          return;
        }
      }

      if (!currentConnectionId) {
        const activeConnection = connections.find(c => c.isActive) || connections[0];
        setCurrentConnectionId(activeConnection._id);
        setCurrentFolderName(activeConnection.connectionName);
        setCurrentFolderId(null);
        fetchFiles(activeConnection._id, null);
      }
    }
  }, [connections, searchParams]);

  const handleSelectionChange = (fileId: string, selected: boolean) => {
    setSelectedFiles(prev => {
      const newSet = new Set(prev);
      if (selected) {
        newSet.add(fileId);
      } else {
        newSet.delete(fileId);
      }
      return newSet;
    });
  };

  const handleUploadComplete = () => {
    if (currentConnectionId) {
      fetchFiles(currentConnectionId, currentFolderId);
      refreshSidebar();
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = async (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (!currentConnectionId) {
      toast.error("Please select a connection first");
      return;
    }

    const droppedFiles = Array.from(e.dataTransfer.files);
    if (droppedFiles.length === 0) return;

    setUploadingFiles(droppedFiles);
    await uploadFiles(droppedFiles);
  };

  const uploadFiles = async (files: File[]) => {
    for (const file of files) {
      await uploadFile(file);
    }
    setUploadingFiles([]);
    handleUploadComplete();
  };

  const uploadFile = async (file: File) => {
    try {
      const tokenResponse = await fetch("/api/files/upload-token", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({
          fileName: file.name,
          mimeType: file.type,
          parentFolderId: currentFolderId,
          fileSize: file.size,
        }),
      });

      const tokenData = await tokenResponse.json();

      if (tokenData.code !== 200 || !tokenData.data?.uploadUrl) {
        throw new Error("Failed to get upload token");
      }

      const {uploadUrl, accessToken} = tokenData.data;

      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();

        xhr.upload.addEventListener("progress", (e) => {
          if (e.lengthComputable) {
            const progress = (e.loaded / e.total) * 100;
          }
        });

        xhr.addEventListener("load", () => {
          if (xhr.status === 200) {
            resolve();
          } else {
            reject(new Error("Upload failed"));
          }
        });

        xhr.addEventListener("error", () => {
          reject(new Error("Upload failed"));
        });

        if (file.size === 0) {
          const boundary = "-------314159265358979323846";
          const delimiter = "\r\n--" + boundary + "\r\n";
          const closeDelimiter = "\r\n--" + boundary + "--";

          const metadata = {
            name: file.name,
            mimeType: file.type,
            parents: currentFolderId ? [currentFolderId] : undefined,
          };

          const multipartRequestBody =
            delimiter +
            "Content-Type: application/json\r\n\r\n" +
            JSON.stringify(metadata) +
            delimiter +
            "Content-Type: " + file.type + "\r\n\r\n";

          const reader = new FileReader();
          reader.onload = () => {
            const fileContent = reader.result;
            const requestBody = multipartRequestBody + fileContent + closeDelimiter;

            xhr.open("POST", uploadUrl);
            xhr.setRequestHeader("Content-Type", `multipart/related; boundary=${boundary}`);
            xhr.setRequestHeader("Authorization", `Bearer ${accessToken}`);
            xhr.send(requestBody);
          };
          reader.readAsText(file);
        } else {
          xhr.open("PUT", uploadUrl);
          xhr.setRequestHeader("Content-Type", file.type);
          xhr.setRequestHeader("Authorization", `Bearer ${accessToken}`);
          xhr.send(file);
        }
      });

      toast.success(`${file.name} uploaded successfully`);
    } catch (error) {
      toast.error(`Failed to upload ${file.name}`);
    }
  };

  const filteredFiles = useMemo(() => {
    if (!searchQuery) return currentFiles;
    return currentFiles.filter((file) =>
      file.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [currentFiles, searchQuery]);

  return (
    <>
      <FileHeader
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        currentPath={currentFolderName}
        onUpload={() => setUploadOpen(true)}
        onCreateFolder={() => setCreateFolderOpen(true)}
        hasConnection={connections.length > 0}
      />
      <div className="flex flex-1 flex-col">
        <div className="@container/main flex flex-1 flex-col gap-2">
          <div
            className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 px-4 lg:px-6 relative"
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            {isDragging && (
              <div className="absolute inset-0 bg-primary/10 border-2 border-dashed border-primary rounded-lg flex items-center justify-center z-50">
                <div className="text-center">
                  <IconFolder className="h-16 w-16 mx-auto mb-4 text-primary" />
                  <p className="text-lg font-medium">Drop files here to upload</p>
                </div>
              </div>
            )}
            {uploadingFiles.length > 0 && (
              <div className="bg-muted/50 border rounded-lg p-4">
                <p className="text-sm font-medium mb-2">Uploading {uploadingFiles.length} file(s)...</p>
                <div className="space-y-1">
                  {uploadingFiles.map((file, index) => (
                    <div key={index} className="text-xs text-muted-foreground flex items-center gap-2">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      {file.name}
                    </div>
                  ))}
                </div>
              </div>
            )}
            {loading ? (
              <div className="flex items-center justify-center h-96">
                <Loader2 className="h-8 w-8 animate-spin"/>
              </div>
            ) : connections.length === 0 ? (
              <div className="flex items-center justify-center h-96">
                <Alert className="max-w-md">
                  <AlertCircle className="h-4 w-4"/>
                  <AlertDescription>
                    <p className="mb-2">Google Drive not connected.</p>
                    <p className="text-sm text-muted-foreground">
                      Click "Connect Drive" in the sidebar to authorize access to your Google Drive.
                    </p>
                  </AlertDescription>
                </Alert>
              </div>
            ) : filteredFiles.length === 0 && !loading ? (
              <div className="flex items-center justify-center h-96">
                <div className="text-center">
                  <IconFolder className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-lg font-medium mb-2">This folder is empty</p>
                  <p className="text-sm text-muted-foreground">
                    Upload files or create folders to get started
                  </p>
                </div>
              </div>
            ) : viewMode === "grid" ? (
              <FileGridView
                files={filteredFiles}
                onNavigate={handleNavigate}
                onDownload={handleDownload}
                onShare={handleShare}
                selectedFiles={selectedFiles}
                onSelectionChange={handleSelectionChange}
                onUpload={() => setUploadOpen(true)}
                onCreateFolder={() => setCreateFolderOpen(true)}
                onRefresh={handleUploadComplete}
              />
            ) : (
              <FileListView
                files={filteredFiles}
                onNavigate={handleNavigate}
                onDownload={handleDownload}
                onShare={handleShare}
                selectedFiles={selectedFiles}
                onSelectionChange={handleSelectionChange}
                onUpload={() => setUploadOpen(true)}
                onCreateFolder={() => setCreateFolderOpen(true)}
                onRefresh={handleUploadComplete}
              />
            )}
          </div>
        </div>
      </div>

      <ShareModal file={shareFile} open={!!shareFile} onClose={() => setShareFile(null)}/>
      <FileUpload
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        onUploadComplete={handleUploadComplete}
        folderId={currentFolderId || undefined}
      />
      <CreateFolderModal
        open={createFolderOpen}
        onClose={() => setCreateFolderOpen(false)}
        onSuccess={handleUploadComplete}
        parentFolderId={currentFolderId || undefined}
      />
      <ConnectDriveModal
        open={connectDriveOpen}
        onClose={() => setConnectDriveOpen(false)}
        onSuccess={() => {
          fetchConnectionInfo();
        }}
      />
    </>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-96"><Loader2 className="h-8 w-8 animate-spin"/></div>}>
      <HomePage />
    </Suspense>
  );
}
