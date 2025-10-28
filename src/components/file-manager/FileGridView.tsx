"use client";

import {useState} from "react";
import {FileItem, FileType} from "@/lib/types/fileManager";
import {FileIcon} from "./FileIcon";
import {formatFileSize} from "@/lib/utils/fileUtils";
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
import {Button} from "@/components/ui/button";
import {Checkbox} from "@/components/ui/checkbox";
import {Download, Share2, MoreVertical, Upload, FolderPlus, RefreshCw, Edit, Trash} from "lucide-react";
import {cn} from "@/lib/utils/index";

interface FileGridViewProps {
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

export function FileGridView({
  files,
  onNavigate,
  onDownload,
  onShare,
  selectedFiles = new Set(),
  onSelectionChange,
  onUpload,
  onCreateFolder,
  onRefresh,
}: FileGridViewProps) {
  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 min-h-[200px]">
          {files.map((file) => {
            const isFolder = file.type === FileType.Folder;
            const isSelected = selectedFiles.has(file.id);

            return (
              <ContextMenu key={file.id}>
                <ContextMenuTrigger asChild>
                  <div
                    className={cn(
                      "group relative border rounded-lg overflow-hidden transition-colors",
                      isSelected && "ring-2 ring-primary bg-muted/50"
                    )}
                  >
                    <div className="aspect-square flex flex-col">
                      <div className="flex-1 flex flex-col items-center justify-center p-4">
                        <div
                          className="cursor-pointer flex flex-col items-center gap-2 w-full"
                          onClick={() => isFolder && onNavigate?.(file)}
                        >
                          <div className="w-16 h-16 flex items-center justify-center">
                            <FileIcon type={file.type} className="h-12 w-12" />
                          </div>
                          <div className="w-full text-center">
                            <p className="text-sm font-medium truncate" title={file.name}>
                              {file.name}
                            </p>
                            {!isFolder && (
                              <p className="text-xs text-muted-foreground">
                                {formatFileSize(file.size)}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {onSelectionChange && (
                      <div className="absolute top-2 left-2">
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={(checked) => onSelectionChange(file.id, checked as boolean)}
                          className="bg-background"
                        />
                      </div>
                    )}

                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 bg-background">
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
                    </div>

                    {file.isShared && !onSelectionChange && (
                      <div className="absolute top-2 left-2">
                        <Share2 className="h-3 w-3 text-blue-500" />
                      </div>
                    )}
                  </div>
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
          })}
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

