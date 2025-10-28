"use client";

import {useState, useEffect} from "react";
import {Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle} from "@/components/ui/dialog";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";
import {Alert, AlertDescription} from "@/components/ui/alert";
import {CheckCircle, Loader2, XCircle} from "lucide-react";

interface ConnectDriveModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function ConnectDriveModal({
  open,
  onClose,
  onSuccess,
}: ConnectDriveModalProps) {
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isOAuthConfigured, setIsOAuthConfigured] = useState(false);
  const [checkingConfig, setCheckingConfig] = useState(true);
  const [connectionName, setConnectionName] = useState("My Drive");

  useEffect(() => {
    if (open) {
      checkOAuthConfig();
    }
  }, [open]);

  const checkOAuthConfig = async () => {
    setCheckingConfig(true);
    try {
      const response = await fetch("/api/google-oauth/status");
      const data = await response.json();
      
      if (data.code === 200) {
        setIsOAuthConfigured(data.data.isOAuthConfigured);
      }
    } catch (error) {
      console.error("Failed to check OAuth configuration:", error);
    } finally {
      setCheckingConfig(false);
    }
  };

  const handleConnect = async () => {
    setError("");
    setSuccess("");
    setConnecting(true);

    try {
      const encodedName = encodeURIComponent(connectionName.trim() || "My Drive");
      window.location.href = `/api/google-oauth/authorize?connectionName=${encodedName}`;
    } catch (error) {
      setError("An error occurred while connecting to Google Drive");
      setConnecting(false);
    }
  };

  const handleClose = () => {
    setError("");
    setSuccess("");
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Connect Google Drive</DialogTitle>
          <DialogDescription>
            Authorize access to your Google Drive to start uploading and managing files
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4"/>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="border-green-500 text-green-700">
              <CheckCircle className="h-4 w-4"/>
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}

          {checkingConfig ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground"/>
            </div>
          ) : !isOAuthConfigured ? (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4"/>
              <AlertDescription>
                OAuth client is not configured. Please contact your administrator to set up Google OAuth credentials.
              </AlertDescription>
            </Alert>
          ) : (
            <>
              <div className="space-y-2">
                <Label htmlFor="connection-name">Connection Name</Label>
                <Input
                  id="connection-name"
                  placeholder="My Drive"
                  value={connectionName}
                  onChange={(e) => setConnectionName(e.target.value)}
                  maxLength={50}
                />
                <p className="text-xs text-muted-foreground">
                  Give your drive connection a custom name (e.g., "Work Drive", "Personal Files")
                </p>
              </div>

              <Alert>
                <AlertDescription className="text-sm">
                  <strong>What happens next:</strong>
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>You'll be redirected to Google to authorize access</li>
                    <li>Grant permission to access your Google Drive</li>
                    <li>A root folder "Unified Drive" will be created automatically</li>
                    <li>You'll be redirected back to continue</li>
                  </ul>
                </AlertDescription>
              </Alert>

              <Button
                onClick={handleConnect}
                disabled={connecting || !connectionName.trim()}
                className="w-full"
              >
                {connecting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin"/>
                    Connecting...
                  </>
                ) : (
                  "Connect to Google Drive"
                )}
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

