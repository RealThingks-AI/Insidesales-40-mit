
import React, { useState, useMemo } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Filter } from "lucide-react";
import { DealCard } from './DealCard';
import { Deal, DealStage } from '@/types/deal';
import { DealActionsDropdown } from './DealActionsDropdown';

const STAGES: { stage: DealStage; label: string; color: string }[] = [
  { stage: 'Lead', label: 'Lead', color: 'bg-slate-100' },
  { stage: 'Qualified', label: 'Qualified', color: 'bg-blue-100' },
  { stage: 'Discussions', label: 'Discussions', color: 'bg-yellow-100' },
  { stage: 'Offered', label: 'Offered', color: 'bg-orange-100' },
  { stage: 'Won', label: 'Won', color: 'bg-green-100' },
  { stage: 'Lost', label: 'Lost', color: 'bg-red-100' },
];

interface KanbanBoardProps {
  deals: Deal[];
  onUpdateDeal: (dealId: string, updates: Partial<Deal>) => Promise<void>;
  onDealClick: (deal: Deal) => void;
  onCreateDeal: (stage: DealStage) => void;
  onDeleteDeals: (dealIds: string[]) => Promise<void>;
  onImportDeals: (importedDeals: (Partial<Deal> & { shouldUpdate?: boolean })[]) => Promise<void>;
  onRefresh: () => Promise<void>;
}

export const KanbanBoard = ({ 
  deals, 
  onUpdateDeal, 
  onDealClick, 
  onCreateDeal, 
  onDeleteDeals, 
  onImportDeals,
  onRefresh 
}: KanbanBoardProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDeals, setSelectedDeals] = useState<Deal[]>([]);

  const filteredDeals = useMemo(() => {
    if (!searchQuery) return deals;
    
    const query = searchQuery.toLowerCase();
    return deals.filter(deal => {
      return (
        deal.deal_name?.toLowerCase().includes(query) ||
        deal.project_name?.toLowerCase().includes(query) ||
        deal.customer_name?.toLowerCase().includes(query) ||
        deal.lead_name?.toLowerCase().includes(query) ||
        deal.stage?.toLowerCase().includes(query)
      );
    });
  }, [deals, searchQuery]);

  const dealsByStage = useMemo(() => {
    const grouped = STAGES.reduce((acc, { stage }) => {
      acc[stage] = filteredDeals.filter(deal => deal.stage === stage);
      return acc;
    }, {} as Record<DealStage, Deal[]>);
    return grouped;
  }, [filteredDeals]);

  const handleDragEnd = async (result: any) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    const deal = deals.find(d => d.id === draggableId);
    if (!deal) return;

    try {
      await onUpdateDeal(deal.id, { stage: destination.droppableId as DealStage });
    } catch (error) {
      console.error('Failed to update deal stage:', error);
    }
  };

  const handleImport = (importedDeals: Partial<Deal>[]) => {
    onImportDeals(importedDeals.map(deal => ({ ...deal, shouldUpdate: false })));
  };

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header with Search and Actions */}
      <div className="flex-shrink-0 px-6 py-4 border-b bg-background">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              type="text"
              placeholder="Search all deal details..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-10"
            />
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" className="flex items-center gap-2">
              <Filter className="w-4 h-4" />
              Filter
            </Button>
            <DealActionsDropdown
              deals={deals}
              selectedDeals={selectedDeals}
              onImport={handleImport}
              onRefresh={onRefresh}
            />
          </div>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="flex-1 overflow-auto">
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="flex gap-4 p-6 min-h-full">
            {STAGES.map(({ stage, label, color }) => (
              <div key={stage} className="flex-1 min-w-[280px] max-w-sm">
                <Card className="h-full flex flex-col">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${color}`} />
                        <CardTitle className="text-sm font-medium">
                          {label} ({dealsByStage[stage]?.length || 0})
                        </CardTitle>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onCreateDeal(stage)}
                        className="h-8 w-8 p-0"
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1 pt-0">
                    <Droppable droppableId={stage}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.droppableProps}
                          className={`min-h-[200px] space-y-3 ${
                            snapshot.isDraggingOver ? 'bg-muted/30 rounded-lg' : ''
                          }`}
                        >
                          {dealsByStage[stage]?.map((deal, index) => (
                            <Draggable key={deal.id} draggableId={deal.id} index={index}>
                              {(provided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  className={snapshot.isDragging ? 'rotate-3 scale-105' : ''}
                                >
                                  <DealCard
                                    deal={deal}
                                    onClick={() => onDealClick(deal)}
                                    onDelete={() => onDeleteDeals([deal.id])}
                                  />
                                </div>
                              )}
                            </Draggable>
                          ))}
                          {provided.placeholder}
                        </div>
                      )}
                    </Droppable>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        </DragDropContext>
      </div>
    </div>
  );
};
