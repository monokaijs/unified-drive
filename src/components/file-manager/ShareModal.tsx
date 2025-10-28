"use client";

import {useState} from "react";
import {FileItem} from "@/lib/types/fileManager";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";
import {Separator} from "@/components/ui/separator";
import {Copy, Check, Link, Download} from "lucide-react";

interface ShareModalProps {
  file: FileItem | null;
  open: boolean;
  onClose: () => void;
}

export function ShareModal({file, open, onClose}: ShareModalProps) {
  const [copiedShare, setCopiedShare] = useState(false);
  const [copiedDownload, setCopiedDownload] = useState(false);

  if (!file) return null;

  const shareLink = `${window.location.origin}/share/${file.id}`;
  const downloadLink = `${window.location.origin}/download/${file.id}`;

  const copyToClipboard = async (text: string, type: "share" | "download") => {
    try {
      await navigator.clipboard.writeText(text);
      if (type === "share") {
        setCopiedShare(true);
        setTimeout(() => setCopiedShare(false), 2000);
      } else {
        setCopiedDownload(true);
        setTimeout(() => setCopiedDownload(false), 2000);
      }
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share "{file.name}"</DialogTitle>
          <DialogDescription>
            Create shareable links for this file
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="share-link" className="flex items-center gap-2">
              <Link className="h-4 w-4" />
              Share Link
            </Label>
            <div className="flex gap-2">
              <Input
                id="share-link"
                value={shareLink}
                readOnly
                className="flex-1"
              />
              <Button
                size="sm"
                variant="outline"
                onClick={() => copyToClipboard(shareLink, "share")}
              >
                {copiedShare ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Anyone with this link can view the file
            </p>
          </div>

          <Separator />

          <div className="space-y-2">
            <Label htmlFor="download-link" className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Download Link
            </Label>
            <div className="flex gap-2">
              <Input
                id="download-link"
                value={downloadLink}
                readOnly
                className="flex-1"
              />
              <Button
                size="sm"
                variant="outline"
                onClick={() => copyToClipboard(downloadLink, "download")}
              >
                {copiedDownload ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Anyone with this link can download the file
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

