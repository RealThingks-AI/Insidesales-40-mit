
import { 
  Home, 
  Users, 
  UserPlus, 
  BarChart3, 
  Settings,
  LogOut,
  Pin,
  PinOff,
  Bell,
  Sun,
  Moon
} from "lucide-react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useThemePreferences } from "@/hooks/useThemePreferences";
import { useState, useEffect } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const menuItems = [
  { title: "Dashboard", url: "/", icon: Home },
  { title: "Contacts", url: "/contacts", icon: Users },
  { title: "Leads", url: "/leads", icon: UserPlus },
  { title: "Deals", url: "/deals", icon: BarChart3 },
  { title: "Settings", url: "/settings", icon: Settings },
];

interface AppSidebarProps {
  isFixed?: boolean;
  isOpen?: boolean;
  onToggle?: (open: boolean) => void;
}

export function AppSidebar({ isFixed = false, isOpen, onToggle }: AppSidebarProps) {
  // Start collapsed by default
  const [isPinned, setIsPinned] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { theme, setTheme } = useThemePreferences();
  const currentPath = location.pathname;

  // Use external state if provided (for fixed mode), otherwise use internal state
  const sidebarOpen = isFixed ? (isOpen ?? false) : isPinned;
  const setSidebarOpen = isFixed ? (onToggle || (() => {})) : setIsPinned;

  const isActive = (path: string) => {
    if (path === "/") {
      return currentPath === "/";
    }
    return currentPath.startsWith(path);
  };

  const handleSignOut = async () => {
    console.log('Sign out clicked');
    await signOut();
  };

  const handleLogoClick = () => {
    navigate('/');
  };

  const handleNotificationClick = () => {
    navigate('/notifications');
  };

  const handleThemeToggle = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
  };

  const getThemeIcon = () => {
    return theme === 'light' ? Sun : Moon;
  };

  const getThemeTooltipText = () => {
    return theme === 'light' ? 'Switch to Dark theme' : 'Switch to Light theme';
  };

  const getUserDisplayName = () => {
    return user?.user_metadata?.full_name || user?.email || 'User';
  };

  const togglePin = () => {
    if (isFixed) {
      onToggle?.(!sidebarOpen);
    } else {
      setIsPinned(!isPinned);
    }
  };

  return (
    <div 
      className={`h-screen flex flex-col border-r border-sidebar-border bg-sidebar-background transition-all duration-300 ease-in-out relative ${
        isFixed ? 'relative' : ''
      }`}
      style={{ 
        width: sidebarOpen ? '200px' : '60px',
        minWidth: sidebarOpen ? '200px' : '60px',
        maxWidth: sidebarOpen ? '200px' : '60px',
        overflow: 'visible'
      }}
    >
      {/* Header */}
      <div className="flex items-center border-b border-sidebar-border relative" style={{ height: '60px' }}>
        <div 
          className="flex items-center cursor-pointer absolute left-3"
          onClick={handleLogoClick}
        >
          <img 
            src="/lovable-uploads/12bdcc4a-a1c8-4ccf-ba6a-931fd566d3c8.png" 
            alt="Logo" 
            className="w-6 h-6 flex-shrink-0 object-contain"
          />
          {sidebarOpen && (
            <span className="ml-2 text-sidebar-foreground font-semibold text-base whitespace-nowrap opacity-100 transition-opacity duration-300" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
              RealThingks
            </span>
          )}
        </div>
      </div>

      {/* Menu Items */}
      <div className="flex-1 py-3">
        <nav className="space-y-1 px-2">
          {menuItems.map((item) => {
            const active = isActive(item.url);
            const menuButton = (
              <NavLink
                to={item.url}
                className={`
                  flex items-center rounded-lg relative transition-colors duration-200 font-medium
                  ${active 
                    ? 'text-sidebar-primary bg-sidebar-accent' 
                    : 'text-sidebar-foreground hover:text-sidebar-primary hover:bg-sidebar-accent/50'
                  }
                `}
                style={{ 
                  paddingTop: '10px',
                  paddingBottom: '10px',
                  paddingLeft: sidebarOpen ? '12px' : '0px',
                  paddingRight: sidebarOpen ? '12px' : '0px',
                  minHeight: '40px',
                  fontFamily: 'Inter, system-ui, sans-serif',
                  fontSize: '14px',
                  fontWeight: '500',
                  justifyContent: sidebarOpen ? 'flex-start' : 'center'
                }}
              >
                <div 
                  className="flex items-center justify-center flex-shrink-0"
                  style={{ 
                    width: '16px',
                    height: '16px',
                    minWidth: '16px',
                    minHeight: '16px',
                    marginRight: sidebarOpen ? '10px' : '0px'
                  }}
                >
                  <item.icon 
                    className="w-4 h-4" 
                    style={{ 
                      minWidth: '16px',
                      minHeight: '16px'
                    }} 
                  />
                </div>
                {sidebarOpen && (
                  <span 
                    className="opacity-100 transition-opacity duration-300"
                  >
                    {item.title}
                  </span>
                )}
              </NavLink>
            );

            if (!sidebarOpen) {
              return (
                <Tooltip key={item.title}>
                  <TooltipTrigger asChild>
                    {menuButton}
                  </TooltipTrigger>
                  <TooltipContent side="right" className="ml-2">
                    <p>{item.title}</p>
                  </TooltipContent>
                </Tooltip>
              );
            }

            return (
              <div key={item.title}>
                {menuButton}
              </div>
            );
          })}
        </nav>
      </div>

      {/* Bottom Section - Notifications, Theme Toggle, Pin Toggle & User & Sign Out */}
      <div className="border-t border-sidebar-border p-3 space-y-2 relative" style={{ overflow: 'visible', zIndex: 100 }}>
        {/* Notification Bell */}
        <div className="flex justify-center">
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={handleNotificationClick}
                className="flex items-center justify-center w-8 h-8 rounded-lg transition-colors text-sidebar-foreground/70 hover:text-sidebar-primary hover:bg-sidebar-accent/50"
              >
                <Bell className="w-4 h-4" />
                {sidebarOpen && (
                  <span className="ml-2 text-sm font-medium">Notifications</span>
                )}
              </button>
            </TooltipTrigger>
            <TooltipContent side={sidebarOpen ? "bottom" : "right"}>
              <p>Notifications</p>
            </TooltipContent>
          </Tooltip>
        </div>

        {/* Theme Toggle */}
        <div className="flex justify-center">
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={handleThemeToggle}
                className="flex items-center justify-center w-8 h-8 rounded-lg transition-colors text-sidebar-foreground/70 hover:text-sidebar-primary hover:bg-sidebar-accent/50"
              >
                {(() => {
                  const ThemeIcon = getThemeIcon();
                  return <ThemeIcon className="w-4 h-4" />;
                })()}
                {sidebarOpen && (
                  <span className="ml-2 text-sm font-medium">Theme</span>
                )}
              </button>
            </TooltipTrigger>
            <TooltipContent side={sidebarOpen ? "bottom" : "right"}>
              <p>{getThemeTooltipText()}</p>
            </TooltipContent>
          </Tooltip>
        </div>

        {/* Pin Toggle Button */}
        <div className="flex justify-center">
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={togglePin}
                className="flex items-center justify-center w-8 h-8 rounded-lg transition-colors text-sidebar-foreground/70 hover:text-sidebar-primary hover:bg-sidebar-accent/50"
              >
                {sidebarOpen ? <Pin className="w-4 h-4" /> : <PinOff className="w-4 h-4" />}
                {sidebarOpen && (
                  <span className="ml-2 text-sm font-medium">Pin</span>
                )}
              </button>
            </TooltipTrigger>
            <TooltipContent side={sidebarOpen ? "bottom" : "right"}>
              <p>{sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}</p>
            </TooltipContent>
          </Tooltip>
        </div>

        {/* User & Sign Out */}
        <div className="flex items-center relative" style={{ minHeight: '32px' }}>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={handleSignOut}
                className="flex items-center justify-center text-sidebar-foreground hover:text-sidebar-primary hover:bg-sidebar-accent/50 rounded-lg transition-colors w-8 h-8"
              >
                <LogOut className="w-4 h-4" />
                {sidebarOpen && (
                  <span className="ml-2 text-sm font-medium">AI</span>
                )}
              </button>
            </TooltipTrigger>
            <TooltipContent side={sidebarOpen ? "bottom" : "right"}>
              <p>Sign Out</p>
            </TooltipContent>
          </Tooltip>
          
          {sidebarOpen && (
            <p 
              className="text-sidebar-foreground text-xs font-medium truncate ml-3 opacity-100 transition-opacity duration-300"
              style={{ 
                fontFamily: 'Inter, system-ui, sans-serif',
                fontSize: '12px'
              }}
            >
              {getUserDisplayName()}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
