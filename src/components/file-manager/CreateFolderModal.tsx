"use client";

import {useState} from "react";
import {Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle} from "@/components/ui/dialog";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";
import {Alert, AlertDescription} from "@/components/ui/alert";
import {Loader2, FolderPlus, AlertCircle} from "lucide-react";

interface CreateFolderModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  parentFolderId?: string;
}

export function CreateFolderModal({
  open,
  onClose,
  onSuccess,
  parentFolderId,
}: CreateFolderModalProps) {
  const [folderName, setFolderName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!folderName.trim()) {
      setError("Folder name is required");
      return;
    }

    setError("");
    setSubmitting(true);

    try {
      const response = await fetch("/api/files/folders", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({
          folderName: folderName.trim(),
          parentFolderId,
        }),
      });

      const data = await response.json();

      if (data.code === 200) {
        setFolderName("");
        onSuccess?.();
        onClose();
      } else {
        setError(data.message || "Failed to create folder");
      }
    } catch (error) {
      setError("An error occurred while creating folder");
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setFolderName("");
    setError("");
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FolderPlus className="h-5 w-5" />
            Create New Folder
          </DialogTitle>
          <DialogDescription>
            Enter a name for the new folder
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4"/>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="folder-name">Folder Name</Label>
            <Input
              id="folder-name"
              placeholder="Enter folder name"
              value={folderName}
              onChange={(e) => setFolderName(e.target.value)}
              disabled={submitting}
              autoFocus
            />
          </div>

          <div className="flex gap-2 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitting || !folderName.trim()}
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin"/>
                  Creating...
                </>
              ) : (
                "Create Folder"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

