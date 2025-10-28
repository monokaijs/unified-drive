"use client";

import * as React from "react";
import {useState, useEffect, useRef} from "react";
import {Tree, NodeRendererProps} from "react-arborist";
import {
  IconFolder, IconFolderPlus, IconUpload, IconSettings, IconLink, IconLogout, IconUserCircle, IconDotsVertical,
  IconHelp, IconEdit, IconTrash, IconFolderOpen
} from "@tabler/icons-react";
import {FileItem, FileType} from "@/lib/types/fileManager";
import {useSession, signOut} from "next-auth/react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {Button} from "@/components/ui/button";
import {ChevronRight, ChevronDown} from "lucide-react";
import {ScrollArea} from "@/components/ui/scroll-area";
import {NavSecondary} from "@/components/nav-secondary";
import {toast} from "sonner";
import {cn} from "@/lib/utils/index";

interface Connection {
  _id: string;
  connectionName: string;
  isActive: boolean;
}

interface FileSidebarProps extends Omit<React.ComponentProps<typeof Sidebar>, 'onSelect'> {
  connections: Connection[];
  connectionFolderTrees: Map<string, FileItem[]>;
  selectedConnectionId: string | null;
  selectedFolderId: string | null;
  onSelect: (connectionId: string, folderName: string, folderId: string | null) => void;
  onConnectDrive: () => void;
  onRefresh?: () => void;
}

interface TreeData {
  id: string;
  name: string;
  children?: TreeData[];
  connectionId: string;
  isConnection?: boolean;
}

interface NodeContext {
  selectedFolderId: string | null;
  selectedConnectionId: string | null;
  onSelect: (connectionId: string, folderName: string, folderId: string | null) => void;
  onRenameFolder: (folderId: string, currentName: string) => void;
  onDeleteFolder: (folderId: string, folderName: string) => void;
  onRenameConnection: (connectionId: string, currentName: string) => void;
  onDeleteConnection: (connectionId: string, connectionName: string) => void;
}

function Node({node, style, dragHandle}: NodeRendererProps<TreeData> & {context: NodeContext}) {
  const context = (node.tree.props as any).context as NodeContext;
  const [isHovered, setIsHovered] = useState(false);
  const isSelected = node.data.isConnection
    ? context.selectedConnectionId === node.data.id && !context.selectedFolderId
    : context.selectedFolderId === node.data.id;
  const isConnection = node.data.isConnection;

  return (
    <div
      ref={dragHandle}
      style={style}
      className={cn(
        "flex items-center gap-2 px-2 py-1.5 cursor-pointer hover:bg-accent rounded-sm",
        isSelected && "bg-accent"
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => {
        if (isConnection) {
          context.onSelect(node.data.connectionId, node.data.name, null);
        } else {
          context.onSelect(node.data.connectionId, node.data.name, node.data.id);
        }
        node.toggle();
      }}
    >
      <div className="flex items-center gap-1 flex-1 min-w-0">
        {node.children && node.children.length > 0 && (
          <div onClick={(e) => {e.stopPropagation(); node.toggle();}} className="flex-shrink-0">
            {node.isOpen ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </div>
        )}
        {!node.children || node.children.length === 0 && <div className="w-4 flex-shrink-0" />}
        {isConnection ? (
          <IconLink className="h-4 w-4 flex-shrink-0" />
        ) : isSelected ? (
          <IconFolderOpen className="h-4 w-4 flex-shrink-0" />
        ) : (
          <IconFolder className="h-4 w-4 flex-shrink-0" />
        )}
        <span className="truncate text-sm">{node.data.name}</span>
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "h-6 w-6 p-0 flex-shrink-0 transition-opacity",
              !isHovered && "opacity-0"
            )}
            onClick={(e) => e.stopPropagation()}
          >
            <IconDotsVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={(e) => {
            e.stopPropagation();
            if (isConnection) {
              context.onRenameConnection(node.data.id, node.data.name);
            } else {
              context.onRenameFolder(node.data.id, node.data.name);
            }
          }}>
            <IconEdit className="h-4 w-4 mr-2" />
            Rename
          </DropdownMenuItem>
          <DropdownMenuItem onClick={(e) => {
            e.stopPropagation();
            if (isConnection) {
              context.onDeleteConnection(node.data.id, node.data.name);
            } else {
              context.onDeleteFolder(node.data.id, node.data.name);
            }
          }}>
            <IconTrash className="h-4 w-4 mr-2" />
            {isConnection ? "Disconnect" : "Delete"}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

export function FileSidebar({
  connections,
  connectionFolderTrees,
  selectedConnectionId,
  selectedFolderId,
  onSelect,
  onConnectDrive,
  onRefresh,
  ...props
}: FileSidebarProps) {
  const {data: session} = useSession();
  const {isMobile} = useSidebar();
  const treeRef = useRef<any>(null);

  const handleRenameConnection = async (connectionId: string, currentName: string) => {
    const newName = prompt("Enter new connection name:", currentName);
    if (!newName || newName === currentName) return;

    try {
      const response = await fetch("/api/google-oauth/connection-name", {
        method: "PUT",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({connectionId, connectionName: newName}),
      });

      const data = await response.json();

      if (data.code === 200) {
        toast.success("Connection renamed successfully");
        onRefresh?.();
      } else {
        toast.error(data.message || "Failed to rename connection");
      }
    } catch (error) {
      toast.error("An error occurred while renaming connection");
    }
  };

  const handleDeleteConnection = async (connectionId: string, connectionName: string) => {
    if (!confirm(`Are you sure you want to delete the connection "${connectionName}"?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/google-oauth/status?connectionId=${connectionId}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (data.code === 200) {
        toast.success("Connection deleted successfully");
        onRefresh?.();
      } else {
        toast.error(data.message || "Failed to delete connection");
      }
    } catch (error) {
      toast.error("An error occurred while deleting connection");
    }
  };

  const handleRenameFolder = async (folderId: string, currentName: string) => {
    const newName = prompt("Enter new folder name:", currentName);
    if (!newName || newName === currentName) return;

    try {
      const response = await fetch("/api/files/rename", {
        method: "PUT",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({fileId: folderId, newName}),
      });

      const data = await response.json();

      if (data.code === 200) {
        toast.success("Folder renamed successfully");
        onRefresh?.();
      } else {
        toast.error(data.message || "Failed to rename folder");
      }
    } catch (error) {
      toast.error("An error occurred while renaming folder");
    }
  };

  const handleDeleteFolder = async (folderId: string, folderName: string) => {
    if (!confirm(`Are you sure you want to delete the folder "${folderName}"?`)) {
      return;
    }

    toast.info("Folder delete functionality coming soon");
  };

  const convertToTreeData = (items: FileItem[], connectionId: string): TreeData[] => {
    return items
      .filter(item => item.type === FileType.Folder)
      .map(item => ({
        id: item.id,
        name: item.name,
        connectionId,
        children: item.children ? convertToTreeData(item.children, connectionId) : undefined,
      }));
  };

  const treeData: TreeData[] = connections.map(conn => ({
    id: conn._id,
    name: conn.connectionName,
    connectionId: conn._id,
    isConnection: true,
    children: convertToTreeData(connectionFolderTrees.get(conn._id) || [], conn._id),
  }));

  const nodeContext: NodeContext = {
    selectedFolderId,
    selectedConnectionId,
    onSelect,
    onRenameFolder: handleRenameFolder,
    onDeleteFolder: handleDeleteFolder,
    onRenameConnection: handleRenameConnection,
    onDeleteConnection: handleDeleteConnection,
  };

  const user = session?.user;
  const userInitials = user?.fullName
    ? user.fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U';

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild className="data-[slot=sidebar-menu-button]:!p-1.5">
              <a href="/">
                <IconFolder className="!size-5" />
                <span className="text-base font-semibold">Unified Drive</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent className="flex flex-col gap-2">
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={onConnectDrive}
                  className="bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground"
                >
                  <IconLink />
                  <span>Connect Drive</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {connections?.length > 0 && (
          <SidebarGroup className="group-data-[collapsible=icon]:hidden flex-1 flex flex-col">
            <SidebarGroupLabel>Folders</SidebarGroupLabel>
            <div className="flex-1 min-h-0">
              {treeData.length > 0 ? (
                <Tree
                  ref={treeRef}
                  data={treeData}
                  openByDefault={true}
                  width="100%"
                  height={600}
                  indent={16}
                  rowHeight={32}
                  overscanCount={8}
                  {...({context: nodeContext} as any)}
                >
                  {Node}
                </Tree>
              ) : (
                <div className="flex items-center justify-center h-32 text-sm text-muted-foreground">
                  No folders found
                </div>
              )}
            </div>
          </SidebarGroup>
        )}

        <NavSecondary items={[
          {
            title: "Settings",
            url: "/settings",
            icon: IconSettings,
          },
          {
            title: "Get Help",
            url: "/help",
            icon: IconHelp,
          },
        ]} className="mt-auto" />
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                >
                  <Avatar className="h-8 w-8 rounded-lg">
                    <AvatarImage src={user?.image || ""} alt={user?.fullName || ""} />
                    <AvatarFallback className="rounded-lg">{userInitials}</AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">{user?.fullName || "User"}</span>
                    <span className="truncate text-xs">{user?.email || ""}</span>
                  </div>
                  <IconDotsVertical className="ml-auto size-4" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
                side={isMobile ? "bottom" : "right"}
                align="end"
                sideOffset={4}
              >
                <DropdownMenuLabel className="p-0 font-normal">
                  <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                    <Avatar className="h-8 w-8 rounded-lg">
                      <AvatarImage src={user?.image || ""} alt={user?.fullName || ""} />
                      <AvatarFallback className="rounded-lg">{userInitials}</AvatarFallback>
                    </Avatar>
                    <div className="grid flex-1 text-left text-sm leading-tight">
                      <span className="truncate font-medium">{user?.fullName || "User"}</span>
                      <span className="truncate text-xs text-muted-foreground">{user?.email || ""}</span>
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {user?.role === "admin" && (
                  <>
                    <DropdownMenuItem asChild>
                      <a href="/settings">
                        <IconSettings />
                        Settings
                      </a>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </>
                )}
                <DropdownMenuItem onClick={() => signOut({callbackUrl: "/login"})}>
                  <IconLogout />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}

