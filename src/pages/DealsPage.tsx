
import { useState, useEffect } from "react";
import { DealForm } from "@/components/DealForm";
import { ListView } from "@/components/ListView";
import { KanbanBoard } from "@/components/KanbanBoard";
import { Deal } from "@/types/deal";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSecureDeals } from "@/hooks/useSecureDeals";
import { Plus, List, Grid3x3, Settings } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { DealColumnCustomizer, DealColumnConfig } from "@/components/DealColumnCustomizer";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Columns } from "lucide-react";

const DealsPage = () => {
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [activeView, setActiveView] = useState<"list" | "kanban">("list");
  const [columnCustomizerOpen, setColumnCustomizerOpen] = useState(false);
  const [columns, setColumns] = useState<DealColumnConfig[]>([
    { field: 'project_name', label: 'Project', visible: true, order: 0 },
    { field: 'customer_name', label: 'Customer', visible: true, order: 1 },
    { field: 'lead_name', label: 'Lead Name', visible: true, order: 2 },
    { field: 'lead_owner', label: 'Lead Owner', visible: true, order: 3 },
    { field: 'stage', label: 'Stage', visible: true, order: 4 },
    { field: 'priority', label: 'Priority', visible: true, order: 5 },
    { field: 'total_contract_value', label: 'Value', visible: true, order: 6 },
    { field: 'probability', label: 'Probability', visible: true, order: 7 },
    { field: 'expected_closing_date', label: 'Expected Close', visible: true, order: 8 },
    { field: 'region', label: 'Region', visible: false, order: 9 },
    { field: 'project_duration', label: 'Duration', visible: false, order: 10 },
    { field: 'start_date', label: 'Start Date', visible: false, order: 11 },
    { field: 'end_date', label: 'End Date', visible: false, order: 12 },
    { field: 'proposal_due_date', label: 'Proposal Due', visible: false, order: 13 },
    { field: 'total_revenue', label: 'Total Revenue', visible: false, order: 14 },
  ]);

  const { toast } = useToast();
  const {
    deals,
    isLoading,
    error,
    createDeal,
    updateDeal,
    deleteDeal,
    refetch
  } = useSecureDeals();

  const handleCreateDeal = async (dealData: Omit<Deal, 'id' | 'created_at' | 'modified_at'>) => {
    try {
      await createDeal(dealData);
      setIsFormOpen(false);
      toast({
        title: "Success",
        description: "Deal created successfully",
      });
    } catch (error: any) {
      console.error('Error creating deal:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create deal",
        variant: "destructive",
      });
    }
  };

  const handleUpdateDeal = async (dealId: string, updates: Partial<Deal>) => {
    try {
      await updateDeal(dealId, updates);
      if (selectedDeal && selectedDeal.id === dealId) {
        setSelectedDeal({ ...selectedDeal, ...updates });
      }
      toast({
        title: "Success",
        description: "Deal updated successfully",
      });
    } catch (error: any) {
      console.error('Error updating deal:', error);
      toast({
        title: "Error", 
        description: error.message || "Failed to update deal",
        variant: "destructive",
      });
    }
  };

  const handleDeleteDeals = async (dealIds: string[]) => {
    try {
      await Promise.all(dealIds.map(id => deleteDeal(id)));
      toast({
        title: "Success",
        description: `Successfully deleted ${dealIds.length} deal(s)`,
      });
    } catch (error: any) {
      console.error('Error deleting deals:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete deals",
        variant: "destructive",
      });
    }
  };

  const handleImportDeals = async (importedDeals: Partial<Deal>[]) => {
    console.log('Importing deals:', importedDeals);
    await refetch();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-lg">Loading deals...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-lg text-destructive">Error loading deals: {error.message}</div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex-shrink-0 p-6 border-b bg-background">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Deals</h1>
            <p className="text-muted-foreground mt-1">Manage your sales pipeline</p>
          </div>
          
          <div className="flex items-center gap-3">
            <Tabs value={activeView} onValueChange={(value) => setActiveView(value as "list" | "kanban")}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="list" className="flex items-center gap-2">
                  <List className="w-4 h-4" />
                  List
                </TabsTrigger>
                <TabsTrigger value="kanban" className="flex items-center gap-2">
                  <Grid3x3 className="w-4 h-4" />
                  Kanban
                </TabsTrigger>
              </TabsList>
            </Tabs>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Settings className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setColumnCustomizerOpen(true)}>
                  <Columns className="w-4 h-4 mr-2" />
                  Columns
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button 
              onClick={() => {
                setSelectedDeal(null);
                setIsFormOpen(true);
              }}
              className="flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Deal
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 min-h-0">
        <Tabs value={activeView} className="h-full">
          <TabsContent value="list" className="h-full m-0">
            <ListView
              deals={deals || []}
              onDealClick={(deal) => {
                setSelectedDeal(deal);
                setIsFormOpen(true);
              }}
              onUpdateDeal={handleUpdateDeal}
              onDeleteDeals={handleDeleteDeals}
              onImportDeals={handleImportDeals}
            />
          </TabsContent>
          
          <TabsContent value="kanban" className="h-full m-0">
            <KanbanBoard
              deals={deals || []}
              onDealClick={(deal) => {
                setSelectedDeal(deal);
                setIsFormOpen(true);
              }}
              onUpdateDeal={handleUpdateDeal}
              onDeleteDeal={(dealId) => handleDeleteDeals([dealId])}
            />
          </TabsContent>
        </Tabs>
      </div>

      <DealForm
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        deal={selectedDeal}
        onSave={selectedDeal ? 
          (updates) => handleUpdateDeal(selectedDeal.id, updates) : 
          handleCreateDeal
        }
      />

      <DealColumnCustomizer
        open={columnCustomizerOpen}
        onOpenChange={setColumnCustomizerOpen}
        columns={columns}
        onColumnsChange={setColumns}
      />
    </div>
  );
};

export default DealsPage;
