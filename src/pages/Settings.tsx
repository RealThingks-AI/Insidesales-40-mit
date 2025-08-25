
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Shield, FileText } from "lucide-react";
import UserManagement from "@/components/UserManagement";
import SecuritySettings from "@/components/settings/SecuritySettings";
import AuditLogsSettings from "@/components/settings/AuditLogsSettings";

const Settings = () => {
  const [activeTab, setActiveTab] = useState("user-management");

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Settings</h1>
        <p className="text-muted-foreground">Manage your account and application preferences</p>
      </div>

      {/* Settings Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="inline-flex h-9 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground w-fit mx-auto">
          <TabsTrigger value="user-management" className="flex items-center gap-1.5 px-3 py-1 text-sm">
            <Users className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Users</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-1.5 px-3 py-1 text-sm">
            <Shield className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Security</span>
          </TabsTrigger>
          <TabsTrigger value="audit-logs" className="flex items-center gap-1.5 px-3 py-1 text-sm">
            <FileText className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Audit</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="user-management" className="mt-6">
          <UserManagement />
        </TabsContent>

        <TabsContent value="security" className="mt-6">
          <SecuritySettings />
        </TabsContent>

        <TabsContent value="audit-logs" className="mt-6">
          <AuditLogsSettings />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Settings;
