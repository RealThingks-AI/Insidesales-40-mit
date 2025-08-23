
import { Button } from "@/components/ui/button";
import { Plus, LayoutGrid, List } from "lucide-react";
import { NotificationBell } from "@/components/NotificationBell";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface DashboardHeaderProps {
  activeView: 'kanban' | 'list';
  onViewChange: (view: 'kanban' | 'list') => void;
  onCreateDeal: () => void;
  onSignOut: () => Promise<void>;
}

export const DashboardHeader = ({ 
  activeView, 
  onViewChange, 
  onCreateDeal, 
  onSignOut 
}: DashboardHeaderProps) => {
  return (
    <div className="flex items-center justify-between p-6 border-b bg-white shadow-sm">
      <div className="flex items-center gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Deals Dashboard</h1>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button onClick={onCreateDeal} variant="outline" size="icon">
              <Plus className="w-4 h-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>New Deal</p>
          </TooltipContent>
        </Tooltip>
      </div>
      
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={activeView === 'kanban' ? 'default' : 'ghost'}
                size="icon"
                onClick={() => onViewChange('kanban')}
              >
                <LayoutGrid className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Kanban</p>
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={activeView === 'list' ? 'default' : 'ghost'}
                size="icon"
                onClick={() => onViewChange('list')}
              >
                <List className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>List</p>
            </TooltipContent>
          </Tooltip>
        </div>
        
        {/* Notification Bell - Maximum visibility */}
        <div className="flex items-center bg-yellow-100 rounded-full p-3 border-2 border-yellow-300 shadow-lg">
          <NotificationBell />
        </div>
        
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="outline" onClick={onSignOut} size="icon">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Sign Out</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
};
