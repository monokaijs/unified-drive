"use client";

import {FileItem, FileType} from "@/lib/types/fileManager";
import {FileIcon} from "./FileIcon";
import {formatFileSize, formatDate} from "@/lib/utils/fileUtils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {Button} from "@/components/ui/button";
import {Checkbox} from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import {Download, Share2, MoreVertical, Upload, FolderPlus, RefreshCw, Edit, Trash} from "lucide-react";
import {cn} from "@/lib/utils/index";

interface FileListViewProps {
  files: FileItem[];
  onNavigate?: (file: FileItem) => void;
  onDownload?: (file: FileItem) => void;
  onShare?: (file: FileItem) => void;
  selectedFiles?: Set<string>;
  onSelectionChange?: (fileId: string, selected: boolean) => void;
  onUpload?: () => void;
  onCreateFolder?: () => void;
  onRefresh?: () => void;
}

export function FileListView({
  files,
  onNavigate,
  onDownload,
  onShare,
  selectedFiles = new Set(),
  onSelectionChange,
  onUpload,
  onCreateFolder,
  onRefresh,
}: FileListViewProps) {
  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <div className="rounded-md border min-h-[200px]">
          <Table>
            <TableHeader>
              <TableRow>
                {onSelectionChange && <TableHead className="w-12"></TableHead>}
                <TableHead>Name</TableHead>
                <TableHead>Size</TableHead>
                <TableHead>Modified</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {files.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={onSelectionChange ? 5 : 4} className="text-center text-muted-foreground h-32">
                    No files found
                  </TableCell>
                </TableRow>
              ) : (
                files.map((file) => {
                  const isFolder = file.type === FileType.Folder;
                  const isSelected = selectedFiles.has(file.id);

                  return (
                    <ContextMenu key={file.id}>
                      <ContextMenuTrigger asChild>
                        <TableRow
                          className={cn(
                            "hover:bg-muted/50",
                            isSelected && "bg-muted/50"
                          )}
                        >
                          {onSelectionChange && (
                            <TableCell>
                              <Checkbox
                                checked={isSelected}
                                onCheckedChange={(checked) => onSelectionChange(file.id, checked as boolean)}
                              />
                            </TableCell>
                          )}
                          <TableCell
                            className="font-medium cursor-pointer"
                            onClick={() => isFolder && onNavigate?.(file)}
                          >
                            <div className="flex items-center gap-2">
                              <FileIcon type={file.type} />
                              <span>{file.name}</span>
                              {file.isShared && (
                                <Share2 className="h-3 w-3 text-blue-500" />
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {formatFileSize(file.size)}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {formatDate(file.modifiedAt)}
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                {!isFolder && (
                                  <>
                                    <DropdownMenuItem onClick={() => onDownload?.(file)}>
                                      <Download className="mr-2 h-4 w-4" />
                                      Download
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                  </>
                                )}
                                <DropdownMenuItem onClick={() => onShare?.(file)}>
                                  <Share2 className="mr-2 h-4 w-4" />
                                  Share
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      </ContextMenuTrigger>
                      <ContextMenuContent>
                        {!isFolder && (
                          <>
                            <ContextMenuItem onClick={() => onDownload?.(file)}>
                              <Download className="h-4 w-4" />
                              Download
                            </ContextMenuItem>
                            <ContextMenuSeparator />
                          </>
                        )}
                        <ContextMenuItem onClick={() => onShare?.(file)}>
                          <Share2 className="h-4 w-4" />
                          Share
                        </ContextMenuItem>
                        <ContextMenuSeparator />
                        <ContextMenuItem>
                          <Edit className="h-4 w-4" />
                          Rename
                        </ContextMenuItem>
                        <ContextMenuItem variant="destructive">
                          <Trash className="h-4 w-4" />
                          Delete
                        </ContextMenuItem>
                      </ContextMenuContent>
                    </ContextMenu>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem onClick={onUpload}>
          <Upload className="h-4 w-4" />
          Upload Files
        </ContextMenuItem>
        <ContextMenuItem onClick={onCreateFolder}>
          <FolderPlus className="h-4 w-4" />
          New Folder
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem onClick={onRefresh}>
          <RefreshCw className="h-4 w-4" />
          Refresh
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}

