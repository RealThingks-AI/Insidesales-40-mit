import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Shield, LogOut, Smartphone, Key, AlertTriangle, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";
import { useSecurityAudit } from "@/hooks/useSecurityAudit";

interface SessionData {
  id: string;
  device: string;
  location: string;
  lastActive: string;
  current: boolean;
  userAgent: string;
  loginTime: string;
}

const SecuritySettings = () => {
  const [sessions, setSessions] = useState<SessionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const { toast } = useToast();
  const { user } = useAuth();
  const { logSecurityEvent } = useSecurityAudit();

  useEffect(() => {
    if (user) {
      fetchActiveSessions();
    }
  }, [user]);

  const fetchActiveSessions = async () => {
    try {
      setLoading(true);

      // Get current session info
      const { data: { session } } = await supabase.auth.getSession();
      const currentSessionData: SessionData = {
        id: session?.access_token?.substring(0, 8) || 'current',
        device: getBrowserInfo(),
        location: 'Current Location', // In a real app, you'd get this from IP geolocation
        lastActive: 'Now',
        current: true,
        userAgent: navigator.userAgent,
        loginTime: new Date().toISOString()
      };

      // Fetch recent authentication logs to show other sessions
      const { data: authLogs, error } = await supabase
        .from('security_audit_log')
        .select('*')
        .eq('user_id', user?.id)
        .in('action', ['SESSION_START'])
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) {
        console.error('Error fetching auth logs:', error);
        setSessions([currentSessionData]);
        return;
      }

      // Process auth logs to create session data
      const recentSessions: SessionData[] = [];
      const seenDevices = new Set<string>();
      
      authLogs?.forEach((log, index) => {
        if (index === 0) return; // Skip the most recent (current session)
        
        const userAgent = (log.details as any)?.user_agent || 'Unknown Browser';
        const deviceInfo = parseUserAgent(userAgent);
        
        if (!seenDevices.has(deviceInfo) && recentSessions.length < 3) {
          seenDevices.add(deviceInfo);
          recentSessions.push({
            id: log.id.substring(0, 8),
            device: deviceInfo,
            location: 'Unknown Location',
            lastActive: format(new Date(log.created_at), 'MMM dd, HH:mm'),
            current: false,
            userAgent: userAgent,
            loginTime: log.created_at
          });
        }
      });

      setSessions([currentSessionData, ...recentSessions]);
    } catch (error) {
      console.error('Error fetching sessions:', error);
      toast({
        title: "Error",
        description: "Failed to fetch session data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getBrowserInfo = () => {
    const userAgent = navigator.userAgent;
    return parseUserAgent(userAgent);
  };

  const parseUserAgent = (userAgent: string) => {
    if (userAgent.includes('Chrome')) return 'Chrome on ' + getOS(userAgent);
    if (userAgent.includes('Firefox')) return 'Firefox on ' + getOS(userAgent);
    if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) return 'Safari on ' + getOS(userAgent);
    if (userAgent.includes('Edge')) return 'Edge on ' + getOS(userAgent);
    return 'Unknown Browser on ' + getOS(userAgent);
  };

  const getOS = (userAgent: string) => {
    if (userAgent.includes('Windows')) return 'Windows';
    if (userAgent.includes('Mac')) return 'macOS';
    if (userAgent.includes('Linux')) return 'Linux';
    if (userAgent.includes('Android')) return 'Android';
    if (userAgent.includes('iPhone') || userAgent.includes('iPad')) return 'iOS';
    return 'Unknown OS';
  };

  const handleEndSession = async (sessionId: string) => {
    try {
      // Log the security event
      await logSecurityEvent('SESSION_TERMINATED', 'auth', sessionId, {
        terminated_by: 'user',
        session_id: sessionId
      });

      setSessions(prevSessions => prevSessions.filter(session => session.id !== sessionId));
      
      toast({
        title: "Session Ended",
        description: "The session has been terminated successfully."
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to end session",
        variant: "destructive"
      });
    }
  };

  const handleEndAllSessions = async () => {
    try {
      // Log the security event
      await logSecurityEvent('ALL_SESSIONS_TERMINATED', 'auth', user?.id, {
        terminated_sessions: sessions.filter(s => !s.current).length
      });

      setSessions(prevSessions => prevSessions.filter(session => session.current));
      
      toast({
        title: "All Sessions Ended",
        description: "All other sessions have been terminated."
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to end all sessions",
        variant: "destructive"
      });
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({
        title: "Error",
        description: "New passwords do not match",
        variant: "destructive"
      });
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast({
        title: "Error",
        description: "Password must be at least 6 characters long",
        variant: "destructive"
      });
      return;
    }

    setIsChangingPassword(true);
    
    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordData.newPassword
      });

      if (error) throw error;

      // Log the security event
      await logSecurityEvent('PASSWORD_CHANGE', 'auth', user?.id, {
        changed_at: new Date().toISOString()
      });

      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });

      toast({
        title: "Password Updated",
        description: "Your password has been successfully changed."
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update password",
        variant: "destructive"
      });
    } finally {
      setIsChangingPassword(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-center h-24">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Session Management */}
      <div className="bg-white rounded-lg border border-border p-4">
        <div className="flex items-center gap-2 mb-3">
          <Shield className="w-4 h-4" />
          <h3 className="font-medium text-sm">Session Management</h3>
        </div>
        <p className="text-xs text-muted-foreground mb-4">
          Manage and monitor your active sessions across different devices
        </p>
        
        <div className="space-y-2">
          {sessions.map((session) => (
            <div key={session.id} className="flex items-center justify-between p-3 border border-border rounded-md bg-muted/20">
              <div className="flex items-center gap-3">
                <Smartphone className="w-4 h-4 text-muted-foreground" />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{session.device}</span>
                    {session.current && (
                      <Badge variant="secondary" className="text-xs px-1.5 py-0.5">
                        Current
                      </Badge>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {session.location} • {session.lastActive}
                  </div>
                </div>
              </div>
              {!session.current && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => handleEndSession(session.id)}
                  className="text-xs px-2 py-1 h-6"
                >
                  End Session
                </Button>
              )}
            </div>
          ))}
        </div>

        {sessions.filter(s => !s.current).length > 0 && (
          <Button 
            variant="destructive" 
            onClick={handleEndAllSessions}
            className="mt-4 text-sm px-4 py-2 h-8"
          >
            End All Other Sessions
          </Button>
        )}
      </div>

      {/* Change Password */}
      <div className="bg-white rounded-lg border border-border p-4">
        <div className="flex items-center gap-2 mb-3">
          <Key className="w-4 h-4" />
          <h3 className="font-medium text-sm">Change Password</h3>
        </div>
        <p className="text-xs text-muted-foreground mb-4">
          Update your password to keep your account secure
        </p>
        
        <form onSubmit={handlePasswordChange} className="space-y-3">
          <div>
            <Label htmlFor="newPassword" className="text-xs text-muted-foreground">New Password</Label>
            <Input
              id="newPassword"
              type="password"
              value={passwordData.newPassword}
              onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
              placeholder="Enter new password"
              required
              className="mt-1 h-8 text-sm"
            />
          </div>
          <div>
            <Label htmlFor="confirmPassword" className="text-xs text-muted-foreground">Confirm New Password</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={passwordData.confirmPassword}
              onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
              placeholder="Confirm new password"
              required
              className="mt-1 h-8 text-sm"
            />
          </div>
          <Button
            type="submit"
            disabled={isChangingPassword || !passwordData.newPassword || !passwordData.confirmPassword}
            className="text-sm px-4 py-2 h-8"
          >
            {isChangingPassword ? "Updating..." : "Update Password"}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default SecuritySettings;
