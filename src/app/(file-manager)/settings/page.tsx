"use client";

import {useEffect, useState} from "react";
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";
import {Alert, AlertDescription} from "@/components/ui/alert";
import {Loader2, CheckCircle, XCircle, Trash2, Link as LinkIcon, ArrowLeft} from "lucide-react";
import {useSession} from "next-auth/react";
import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/components/ui/tabs";
import {useRouter} from "next/navigation";

interface ConnectionInfo {
  _id: string;
  connectionName: string;
  isActive: boolean;
  driveRootFolderId?: string | null;
}

interface OAuthConnectionData {
  isConnected: boolean;
  isOAuthConfigured: boolean;
  driveRootFolderId: string | null;
  connectionName?: string;
  connections: ConnectionInfo[];
}

interface OAuthClientData {
  isConfigured: boolean;
  clientId?: string;
}

export default function SettingsPage() {
  const {data: session} = useSession();
  const router = useRouter();
  const isAdmin = session?.user?.role === "admin";

  const [oauthConnection, setOauthConnection] = useState<OAuthConnectionData | null>(null);
  const [oauthClient, setOauthClient] = useState<OAuthClientData | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [clientId, setClientId] = useState("");
  const [clientSecret, setClientSecret] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    fetchOAuthStatus();
    if (isAdmin) {
      fetchOAuthClient();
    }
  }, [isAdmin]);

  const fetchOAuthStatus = async () => {
    try {
      const response = await fetch("/api/google-oauth/status");
      const data = await response.json();

      if (data.code === 200 && data.data) {
        setOauthConnection(data.data);
      }
    } catch (error) {
      console.error("Failed to fetch OAuth status:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchOAuthClient = async () => {
    try {
      const response = await fetch("/api/google-oauth-client");
      const data = await response.json();

      if (data.code === 200 && data.data) {
        setOauthClient(data.data);
      }
    } catch (error) {
      console.error("Failed to fetch OAuth client:", error);
    }
  };

  const handleConfigureOAuth = async () => {
    setError("");
    setSuccess("");
    setSubmitting(true);

    try {
      const response = await fetch("/api/google-oauth-client", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({
          clientId: clientId.trim(),
          clientSecret: clientSecret.trim(),
        }),
      });

      const data = await response.json();

      if (data.code === 200) {
        setSuccess("OAuth client configured successfully!");
        setClientId("");
        setClientSecret("");
        fetchOAuthClient();
        fetchOAuthStatus();
      } else {
        setError(data.message || "Failed to configure OAuth client");
      }
    } catch (error) {
      setError("An error occurred while configuring OAuth client");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteOAuthClient = async () => {
    if (!confirm("Are you sure you want to remove OAuth client configuration? This will disconnect all users.")) {
      return;
    }

    setDeleting(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/google-oauth-client", {
        method: "DELETE",
      });

      const data = await response.json();

      if (data.code === 200) {
        setSuccess("OAuth client removed successfully!");
        setOauthClient(null);
        fetchOAuthStatus();
      } else {
        setError(data.message || "Failed to remove OAuth client");
      }
    } catch (error) {
      setError("An error occurred while removing OAuth client");
    } finally {
      setDeleting(false);
    }
  };

  const handleConnectDrive = () => {
    window.location.href = "/api/google-oauth/authorize";
  };

  const handleDisconnectDrive = async () => {
    if (!confirm("Are you sure you want to disconnect all your Google Drive connections?")) {
      return;
    }

    setDeleting(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/google-oauth/status", {
        method: "DELETE",
      });

      const data = await response.json();

      if (data.code === 200) {
        setSuccess("All Google Drive connections disconnected successfully!");
        fetchOAuthStatus();
      } else {
        setError(data.message || "Failed to disconnect Google Drive");
      }
    } catch (error) {
      setError("An error occurred while disconnecting Google Drive");
    } finally {
      setDeleting(false);
    }
  };

  const handleSwitchConnection = async (connectionId: string) => {
    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/google-oauth/switch-connection", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({connectionId}),
      });

      const data = await response.json();

      if (data.code === 200) {
        setSuccess("Active connection switched successfully!");
        fetchOAuthStatus();
        setTimeout(() => {
          window.location.href = "/";
        }, 1000);
      } else {
        setError(data.message || "Failed to switch connection");
      }
    } catch (error) {
      setError("An error occurred while switching connection");
    }
  };

  const handleDeleteConnection = async (connectionId: string, connectionName: string) => {
    if (!confirm(`Are you sure you want to delete the connection "${connectionName}"?`)) {
      return;
    }

    setError("");
    setSuccess("");

    try {
      const response = await fetch(`/api/google-oauth/status?connectionId=${connectionId}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (data.code === 200) {
        setSuccess("Connection deleted successfully!");
        fetchOAuthStatus();
      } else {
        setError(data.message || "Failed to delete connection");
      }
    } catch (error) {
      setError("An error occurred while deleting connection");
    }
  };



  const renderUserConnection = () => {
    if (!oauthConnection?.isOAuthConfigured) {
      return (
        <Card>
          <CardHeader>
            <CardTitle>Google Drive Connection</CardTitle>
            <CardDescription>
              OAuth client is not configured
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertDescription>
                OAuth client is not configured. {isAdmin ? "Please configure OAuth client in the OAuth Configuration tab." : "Please contact your administrator to set up Google OAuth credentials."}
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      );
    }

    if (oauthConnection?.isConnected) {
      return (
        <Card>
          <CardHeader>
            <CardTitle>Google Drive Connections</CardTitle>
            <CardDescription>
              Manage your connected Google Drive accounts
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {oauthConnection.connections.map((connection) => (
              <div key={connection._id} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {connection.isActive ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <div className="h-5 w-5" />
                    )}
                    <div>
                      <p className="font-medium">{connection.connectionName}</p>
                      {connection.isActive && (
                        <p className="text-xs text-green-600">Active Connection</p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDeleteConnection(connection._id, connection.connectionName)}
                      disabled={oauthConnection.connections.length === 1}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
                {connection.driveRootFolderId && (
                  <div>
                    <Label className="text-xs text-muted-foreground">Root Folder</Label>
                    <p className="text-sm">Unified Drive</p>
                  </div>
                )}
              </div>
            ))}

            <Alert>
              <AlertDescription className="text-sm">
                Your files are being stored in the "Unified Drive" folder in your Google Drive.
              </AlertDescription>
            </Alert>

            <div className="pt-4 border-t space-y-2">
              {oauthConnection.connections.length > 0 && (
                <Button
                  variant="destructive"
                  onClick={handleDisconnectDrive}
                  disabled={deleting}
                  className="w-full"
                >
                  {deleting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Disconnecting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="mr-2 h-4 w-4" />
                      Disconnect All Drives
                    </>
                  )}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      );
    }

    return (
      <Card>
        <CardHeader>
          <CardTitle>Connect Google Drive</CardTitle>
          <CardDescription>
            Authorize access to your Google Drive to start uploading and managing files
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertDescription className="text-sm">
              <strong>What happens when you connect:</strong>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>You'll be redirected to Google to authorize access</li>
                <li>Grant permission to access your Google Drive</li>
                <li>A root folder "Unified Drive" will be created automatically</li>
                <li>You'll be redirected back to continue</li>
              </ul>
            </AlertDescription>
          </Alert>

          <Button
            onClick={handleConnectDrive}
            className="w-full"
          >
            <LinkIcon className="mr-2 h-4 w-4" />
            Connect to Google Drive
          </Button>
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <>
      <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b">
        <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
          <Button variant="ghost" size="icon" onClick={() => router.push("/")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-base font-medium">Settings</h1>
        </div>
      </header>

      <div className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
        <div className="max-w-4xl mx-auto w-full space-y-6">
          {error && (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="border-green-500 text-green-700">
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}

        {isAdmin ? (
          <Tabs defaultValue="oauth-client" className="space-y-6">
            <TabsList>
              <TabsTrigger value="oauth-client">OAuth Configuration</TabsTrigger>
              <TabsTrigger value="my-connection">My Connection</TabsTrigger>
            </TabsList>

            <TabsContent value="oauth-client" className="space-y-6">
              {oauthClient?.isConfigured ? (
                <Card>
                  <CardHeader>
                    <CardTitle>OAuth Client Configured</CardTitle>
                    <CardDescription>
                      Google OAuth client is configured and ready for users to connect
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label className="text-muted-foreground">Client ID</Label>
                      <p className="font-medium font-mono text-sm break-all">{oauthClient.clientId}</p>
                    </div>

                    <Alert>
                      <AlertDescription className="text-sm">
                        <strong>Note:</strong> Users can now connect their Google Drive accounts through the OAuth flow.
                      </AlertDescription>
                    </Alert>

                    <div className="pt-4 border-t">
                      <Button
                        variant="destructive"
                        onClick={handleDeleteOAuthClient}
                        disabled={deleting}
                      >
                        {deleting ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Removing...
                          </>
                        ) : (
                          <>
                            <Trash2 className="mr-2 h-4 w-4" />
                            Remove OAuth Configuration
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle>Configure OAuth Client</CardTitle>
                    <CardDescription>
                      Set up Google OAuth 2.0 credentials to allow users to connect their Google Drive
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="client-id">OAuth Client ID</Label>
                      <Input
                        id="client-id"
                        placeholder="123456789-abc.apps.googleusercontent.com"
                        value={clientId}
                        onChange={(e) => setClientId(e.target.value)}
                        className="font-mono text-sm"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="client-secret">OAuth Client Secret</Label>
                      <Input
                        id="client-secret"
                        type="password"
                        placeholder="GOCSPX-..."
                        value={clientSecret}
                        onChange={(e) => setClientSecret(e.target.value)}
                        className="font-mono text-sm"
                      />
                    </div>

                    <Alert>
                      <AlertDescription className="text-sm">
                        <strong>How to get OAuth credentials:</strong>
                        <ol className="list-decimal list-inside mt-2 space-y-1">
                          <li>Go to Google Cloud Console</li>
                          <li>Create or select a project</li>
                          <li>Enable Google Drive API</li>
                          <li>Create OAuth 2.0 credentials (Web application)</li>
                          <li>Add authorized redirect URI: {typeof window !== "undefined" ? `${window.location.origin}/api/google-oauth/callback` : "[your-domain]/api/google-oauth/callback"}</li>
                        </ol>
                      </AlertDescription>
                    </Alert>

                    <Button
                      onClick={handleConfigureOAuth}
                      disabled={submitting || !clientId.trim() || !clientSecret.trim()}
                      className="w-full"
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Configuring...
                        </>
                      ) : (
                        "Configure OAuth Client"
                      )}
                    </Button>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="my-connection" className="space-y-6">
              {renderUserConnection()}
            </TabsContent>
          </Tabs>
        ) : (
          renderUserConnection()
        )}

        </div>
      </div>
    </>
  );
}

