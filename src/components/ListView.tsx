
import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Search, Edit, Trash2, Filter } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Deal } from "@/types/deal";
import { BulkActionsBar } from "./BulkActionsBar";
import { DealActionsDropdown } from './DealActionsDropdown';

interface ListViewProps {
  deals: Deal[];
  onDealClick: (deal: Deal) => void;
  onUpdateDeal: (dealId: string, updates: Partial<Deal>) => Promise<void>;
  onDeleteDeals: (dealIds: string[]) => Promise<void>;
  onImportDeals: (importedDeals: (Partial<Deal> & { shouldUpdate?: boolean })[]) => Promise<void>;
}

export const ListView = ({ deals, onDealClick, onUpdateDeal, onDeleteDeals, onImportDeals }: ListViewProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDeals, setSelectedDeals] = useState<string[]>([]);

  const filteredDeals = useMemo(() => {
    if (!searchQuery) return deals;
    
    const query = searchQuery.toLowerCase();
    return deals.filter(deal => {
      return (
        deal.deal_name?.toLowerCase().includes(query) ||
        deal.project_name?.toLowerCase().includes(query) ||
        deal.customer_name?.toLowerCase().includes(query) ||
        deal.lead_name?.toLowerCase().includes(query) ||
        deal.stage?.toLowerCase().includes(query) ||
        deal.priority?.toString().includes(query) ||
        deal.total_contract_value?.toString().includes(query)
      );
    });
  }, [deals, searchQuery]);

  const toggleDealSelection = (dealId: string) => {
    setSelectedDeals(prev => {
      if (prev.includes(dealId)) {
        return prev.filter(id => id !== dealId);
      } else {
        return [...prev, dealId];
      }
    });
  };

  const toggleSelectAll = () => {
    if (selectedDeals.length === filteredDeals.length) {
      setSelectedDeals([]);
    } else {
      setSelectedDeals(filteredDeals.map(deal => deal.id));
    }
  };

  const isAllSelected = selectedDeals.length === filteredDeals.length && filteredDeals.length > 0;

  const handleDeleteSelected = async () => {
    await onDeleteDeals(selectedDeals);
    setSelectedDeals([]);
  };

  const handleClearSelection = () => {
    setSelectedDeals([]);
  };

  const handleExportSelected = () => {
    const selectedData = deals.filter(deal => selectedDeals.includes(deal.id));
    console.log('Exporting selected deals:', selectedData);
  };

  const handleImport = (importedDeals: Partial<Deal>[]) => {
    onImportDeals(importedDeals.map(deal => ({ ...deal, shouldUpdate: false })));
  };

  const handleColumnCustomize = () => {
    console.log('Column customization clicked');
  };

  const onRefresh = async () => {
    console.log('Refreshing deals...');
  };

  const selectedDealsData = deals.filter(deal => selectedDeals.includes(deal.id));

  const getStageColor = (stage: string) => {
    switch (stage) {
      case 'Lead': return 'bg-slate-100 text-slate-800';
      case 'Qualified': return 'bg-blue-100 text-blue-800';
      case 'Discussions': return 'bg-yellow-100 text-yellow-800';
      case 'Offered': return 'bg-orange-100 text-orange-800';
      case 'Won': return 'bg-green-100 text-green-800';
      case 'Lost': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatCurrency = (amount: number | null | undefined) => {
    if (!amount) return '-';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (date: string | null | undefined) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString();
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
            <span className="text-sm text-muted-foreground">Select Deals</span>
            <DealActionsDropdown
              deals={deals}
              selectedDeals={selectedDealsData}
              onImport={handleImport}
              onRefresh={onRefresh}
              onColumnCustomize={handleColumnCustomize}
              showColumns={true}
            />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        <Card className="m-6">
          <CardHeader>
            <CardTitle>Deals ({filteredDeals.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {selectedDeals.length > 0 && (
              <BulkActionsBar
                selectedCount={selectedDeals.length}
                onDelete={handleDeleteSelected}
                onExport={handleExportSelected}
                onClearSelection={handleClearSelection}
              />
            )}

            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">
                      <Checkbox
                        checked={isAllSelected}
                        onCheckedChange={toggleSelectAll}
                        aria-label="Select all"
                      />
                    </TableHead>
                    <TableHead>Deal Name</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Stage</TableHead>
                    <TableHead>Value</TableHead>
                    <TableHead>Probability</TableHead>
                    <TableHead>Expected Close</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDeals.map(deal => (
                    <TableRow key={deal.id} className="cursor-pointer hover:bg-muted/50">
                      <TableCell>
                        <Checkbox
                          checked={selectedDeals.includes(deal.id)}
                          onCheckedChange={() => toggleDealSelection(deal.id)}
                          onClick={(e) => e.stopPropagation()}
                          aria-label={`Select ${deal.deal_name}`}
                        />
                      </TableCell>
                      <TableCell 
                        className="font-medium"
                        onClick={() => onDealClick(deal)}
                      >
                        <div>
                          <div className="font-medium">{deal.deal_name || deal.project_name}</div>
                          {deal.lead_name && (
                            <div className="text-sm text-muted-foreground">{deal.lead_name}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell onClick={() => onDealClick(deal)}>
                        {deal.customer_name || '-'}
                      </TableCell>
                      <TableCell onClick={() => onDealClick(deal)}>
                        <Badge variant="secondary" className={getStageColor(deal.stage || '')}>
                          {deal.stage}
                        </Badge>
                      </TableCell>
                      <TableCell onClick={() => onDealClick(deal)}>
                        {formatCurrency(deal.total_contract_value)}
                      </TableCell>
                      <TableCell onClick={() => onDealClick(deal)}>
                        {deal.probability ? `${deal.probability}%` : '-'}
                      </TableCell>
                      <TableCell onClick={() => onDealClick(deal)}>
                        {formatDate(deal.expected_closing_date)}
                      </TableCell>
                      <TableCell onClick={() => onDealClick(deal)}>
                        {deal.priority || '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button 
                            size="icon" 
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              onDealClick(deal);
                            }}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button 
                            size="icon" 
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteDeals([deal.id]);
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredDeals.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-8">
                        No deals found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
