"use client";

import {Suspense, useEffect, useMemo, useState} from "react";
import {useRouter, usePathname, useSearchParams} from "next/navigation";
import {FileSidebar} from "@/components/file-manager/FileSidebar";
import {SidebarInset, SidebarProvider} from "@/components/ui/sidebar";
import {FileItem, FileType} from "@/lib/types/fileManager";
import {convertGoogleDriveFiles} from "@/lib/utils/convertGoogleDriveFiles";
import {ConnectDriveModal} from "@/components/file-manager/ConnectDriveModal";
import {FileManagerProvider} from "@/contexts/FileManagerContext";

interface Connection {
  _id: string;
  connectionName: string;
  isActive: boolean;
}

function buildFolderTree(allFiles: FileItem[], folderContents: Map<string, FileItem[]>): FileItem[] {
  return allFiles.map(file => {
    if (file.type === FileType.Folder && folderContents.has(file.id)) {
      const children = folderContents.get(file.id) || [];
      return {
        ...file,
        children: buildFolderTree(children, folderContents),
      };
    }
    return file;
  });
}

function FileManagerLayoutContent({children}: {children: React.ReactNode}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [connections, setConnections] = useState<Connection[]>([]);
  const [connectionFiles, setConnectionFiles] = useState<Map<string, FileItem[]>>(new Map());
  const [folderContents, setFolderContents] = useState<Map<string, FileItem[]>>(new Map());
  const [connectDriveOpen, setConnectDriveOpen] = useState(false);

  const selectedConnectionId = pathname === "/" ? searchParams.get("connectionId") : null;
  const selectedFolderId = pathname === "/" ? searchParams.get("folderId") : null;

  useEffect(() => {
    fetchConnectionInfo();
  }, []);

  const fetchConnectionInfo = async () => {
    try {
      const response = await fetch("/api/google-oauth/status");
      const data = await response.json();
      if (data.code === 200 && data.data) {
        const conns = data.data.connections || [];
        setConnections(conns);

        for (const conn of conns) {
          await fetchConnectionFiles(conn._id);
        }
      }
    } catch (error) {
      console.error("Failed to fetch connection info:", error);
    }
  };

  const fetchConnectionFiles = async (connectionId: string) => {
    try {
      const url = `/api/files?connectionId=${connectionId}`;
      const response = await fetch(url);
      const data = await response.json();

      if (data.code === 200 && data.data) {
        const convertedFiles = convertGoogleDriveFiles(data.data);
        setConnectionFiles(prev => {
          const newMap = new Map(prev);
          newMap.set(connectionId, convertedFiles);
          return newMap;
        });
      }
    } catch (error) {
      console.error("Failed to fetch files for connection:", connectionId, error);
    }
  };

  const handleFolderSelect = (connectionId: string, folderName: string, folderId: string | null) => {
    const params = new URLSearchParams();
    params.set("connectionId", connectionId);
    if (folderId) {
      params.set("folderId", folderId);
    }

    if (pathname !== "/") {
      router.push(`/?${params.toString()}`);
    } else {
      router.push(`/?${params.toString()}`);
    }
  };

  const connectionFolderTrees = useMemo(() => {
    const trees = new Map<string, FileItem[]>();
    connectionFiles.forEach((files, connectionId) => {
      trees.set(connectionId, buildFolderTree(files, folderContents));
    });
    return trees;
  }, [connectionFiles, folderContents]);

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <FileSidebar
        variant="inset"
        connections={connections}
        connectionFolderTrees={connectionFolderTrees}
        selectedConnectionId={selectedConnectionId}
        selectedFolderId={selectedFolderId}
        onSelect={handleFolderSelect}
        onConnectDrive={() => setConnectDriveOpen(true)}
        onRefresh={fetchConnectionInfo}
      />
      <SidebarInset>
        <FileManagerProvider value={{refreshSidebar: fetchConnectionInfo}}>
          {children}
        </FileManagerProvider>
      </SidebarInset>
      <ConnectDriveModal
        open={connectDriveOpen}
        onClose={() => setConnectDriveOpen(false)}
        onSuccess={() => {
          fetchConnectionInfo();
          setConnectDriveOpen(false);
        }}
      />
    </SidebarProvider>
  );
}

export default function FileManagerLayout({children}: {children: React.ReactNode}) {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <FileManagerLayoutContent>{children}</FileManagerLayoutContent>
    </Suspense>
  );
}

