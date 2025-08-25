import React, { useState, useEffect, useMemo } from 'react';
import { Deal } from "@/types/deal";
import { DealColumnCustomizer } from "./DealColumnCustomizer";
import { DealsAdvancedFilter } from "./DealsAdvancedFilter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { InlineEditCell } from "./InlineEditCell";
import { BulkActionsBar } from "./BulkActionsBar";
import { 
  Search, 
  Filter, 
  ChevronUp, 
  ChevronDown, 
  Columns,
  X
} from "lucide-react";
import { formatDistanceToNow } from 'date-fns';
import { useToast } from "@/hooks/use-toast";

interface ListViewProps {
  deals: Deal[];
  onDealClick: (deal: Deal) => void;
  onUpdateDeal: (dealId: string, updates: Partial<Deal>) => Promise<void>;
  onDeleteDeals: (dealIds: string[]) => Promise<void>;
  onImportDeals: (deals: Partial<Deal>[]) => Promise<void>;
}

interface DealColumn {
  key: keyof Deal | 'select' | 'actions';
  label: string;
  visible: boolean;
  type?: 'text' | 'number' | 'date' | 'currency' | 'select' | 'actions';
  options?: string[];
}

const defaultColumns: DealColumn[] = [
  { key: 'select', label: '', visible: true, type: 'select' },
  { key: 'project_name', label: 'Project Name', visible: true },
  { key: 'deal_stage', label: 'Stage', visible: true },
  { key: 'deal_value', label: 'Value', visible: true, type: 'currency' },
  { key: 'company_name', label: 'Company', visible: true },
  { key: 'created_at', label: 'Created', visible: true, type: 'date' },
  { key: 'modified_at', label: 'Modified', visible: true, type: 'date' },
];

export const ListView: React.FC<ListViewProps> = ({ 
  deals, 
  onDealClick, 
  onUpdateDeal, 
  onDeleteDeals, 
  onImportDeals 
}) => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDeals, setSelectedDeals] = useState<string[]>([]);
  const [columns, setColumns] = useState<DealColumn[]>(defaultColumns);
  const [sortColumn, setSortColumn] = useState<keyof Deal | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [showAdvancedFilter, setShowAdvancedFilter] = useState(false);
  const [advancedFilters, setAdvancedFilters] = useState<{ [key: string]: string }>({});
  const [showColumnCustomizer, setShowColumnCustomizer] = useState(false);

  const filteredDeals = useMemo(() => {
    let filtered = [...deals];

    if (searchTerm) {
      const lowerSearchTerm = searchTerm.toLowerCase();
      filtered = filtered.filter(deal =>
        Object.values(deal).some(value =>
          typeof value === 'string' && value.toLowerCase().includes(lowerSearchTerm)
        )
      );
    }

    Object.entries(advancedFilters).forEach(([field, value]) => {
      if (value && field !== 'date_range') {
        filtered = filtered.filter(deal => {
          const dealValue = deal[field as keyof Deal];
          if (typeof dealValue === 'string') {
            return dealValue.toLowerCase().includes(value.toLowerCase());
          }
          return false;
        });
      }
    });

    return filtered;
  }, [deals, searchTerm, advancedFilters]);

  const sortedDeals = useMemo(() => {
    if (!sortColumn) return filteredDeals;

    return [...filteredDeals].sort((a, b) => {
      const aValue = a[sortColumn];
      const bValue = b[sortColumn];

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
      } else if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
      } else if (aValue instanceof Date && bValue instanceof Date) {
        return sortDirection === 'asc' ? aValue.getTime() - bValue.getTime() : bValue.getTime() - aValue.getTime();
      } else {
        return 0;
      }
    });
  }, [filteredDeals, sortColumn, sortDirection]);

  const toggleSort = (column: keyof Deal) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const handleCheckboxChange = (dealId: string) => {
    setSelectedDeals(prev => {
      if (prev.includes(dealId)) {
        return prev.filter(id => id !== dealId);
      } else {
        return [...prev, dealId];
      }
    });
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const dealIds = sortedDeals.map(deal => deal.id);
      setSelectedDeals(dealIds);
    } else {
      setSelectedDeals([]);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedDeals.length === 0) {
      toast({
        title: "Error",
        description: "No deals selected for deletion.",
        variant: "destructive",
      });
      return;
    }

    try {
      await onDeleteDeals(selectedDeals);
      setSelectedDeals([]);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete deals.",
        variant: "destructive",
      });
    }
  };

  const activeFilters = useMemo(() => {
    return Object.entries(advancedFilters)
      .filter(([key, value]) => value !== '')
      .map(([key, value]) => {
        const column = defaultColumns.find(col => col.key === key);
        return {
          field: key,
          label: column?.label || key,
          value: value
        };
      });
  }, [advancedFilters]);

  const activeFiltersCount = activeFilters.length;

  const removeFilter = (field: string, value: string) => {
    setAdvancedFilters(prevFilters => {
      const { [field]: removed, ...rest } = prevFilters;
      return rest;
    });
  };

  const clearAllFilters = () => {
    setAdvancedFilters({});
  };

  const getColumnHeader = (column: DealColumn) => {
    if (column.key === 'select') {
      return (
        <th key={column.key} className="w-10 px-2 py-3 text-left">
          <Checkbox
            checked={selectedDeals.length === sortedDeals.length && sortedDeals.length > 0}
            onCheckedChange={handleSelectAll}
          />
        </th>
      );
    }

    if (column.key === 'actions') {
      return <th key={column.key} className="px-2 py-3 text-left"></th>;
    }

    return (
      <th
        key={column.key}
        className="px-2 py-3 text-left cursor-pointer"
        onClick={() => {
          if (column.key !== 'select' && column.key !== 'actions') {
            toggleSort(column.key);
          }
        }}
      >
        <div className="flex items-center">
          {column.label}
          {sortColumn === column.key && (
            <span>{sortDirection === 'asc' ? <ChevronUp className="w-4 h-4 ml-1" /> : <ChevronDown className="w-4 h-4 ml-1" />}</span>
          )}
        </div>
      </th>
    );
  };

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Search and Filter Bar */}
      <div className="flex-shrink-0 bg-background border-b px-6 py-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex flex-1 items-center gap-4 min-w-0">
            {/* Search Input */}
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search deals..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Filter Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAdvancedFilter(!showAdvancedFilter)}
              className={showAdvancedFilter ? 'bg-accent' : ''}
            >
              <Filter className="w-4 h-4 mr-2" />
              Filter
              {activeFiltersCount > 0 && (
                <Badge variant="secondary" className="ml-2 px-1 py-0 text-xs">
                  {activeFiltersCount}
                </Badge>
              )}
            </Button>
          </div>

          {/* Right side actions */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowColumnCustomizer(true)}
            >
              <Columns className="w-4 h-4 mr-2" />
              Columns
            </Button>
          </div>
        </div>

        {/* Advanced Filters Panel */}
        {showAdvancedFilter && (
          <div className="mt-4 pt-4 border-t">
            <DealsAdvancedFilter
              deals={deals}
              onFiltersChange={setAdvancedFilters}
              initialFilters={advancedFilters}
            />
          </div>
        )}

        {/* Active Filters Display */}
        {activeFilters.length > 0 && (
          <div className="mt-4 pt-4 border-t">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm text-muted-foreground">Active filters:</span>
              {activeFilters.map((filter, index) => (
                <Badge key={index} variant="secondary" className="flex items-center gap-1">
                  {filter.label}: {filter.value}
                  <X 
                    className="w-3 h-3 cursor-pointer" 
                    onClick={() => removeFilter(filter.field, filter.value)}
                  />
                </Badge>
              ))}
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={clearAllFilters}
                className="text-xs"
              >
                Clear all
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Bulk Actions Bar */}
      {selectedDeals.length > 0 && (
        <BulkActionsBar
          selectedCount={selectedDeals.length}
          onDelete={() => handleBulkDelete()}
          onClearSelection={() => setSelectedDeals([])}
        />
      )}

      {/* Table Container */}
      <div className="flex-1 min-h-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {columns.filter(col => col.visible).map(column => (
                  getColumnHeader(column)
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedDeals.map(deal => (
                <tr key={deal.id} className="hover:bg-accent/40">
                  {columns.filter(col => col.visible).map(column => {
                    if (column.key === 'select') {
                      return (
                        <td key={column.key} className="px-2 py-4">
                          <Checkbox
                            checked={selectedDeals.includes(deal.id)}
                            onCheckedChange={() => handleCheckboxChange(deal.id)}
                          />
                        </td>
                      );
                    }

                    if (column.key === 'actions') {
                      return (
                        <td key={column.key} className="px-2 py-4">
                          <Button variant="ghost" size="sm" onClick={() => onDealClick(deal)}>
                            View
                          </Button>
                        </td>
                      );
                    }

                    let cellContent: React.ReactNode = deal[column.key];

                    if (column.type === 'date' && deal[column.key]) {
                      const dateValue = new Date(deal[column.key] as string);
                      cellContent = <span className="text-xs text-muted-foreground">{formatDistanceToNow(dateValue, { addSuffix: true })}</span>;
                    }

                    return (
                      <td key={column.key} className="px-2 py-4">
                        <InlineEditCell
                          value={deal[column.key]}
                          columnType={column.type || 'text'}
                          onValueChange={async (newValue) => {
                            try {
                              await onUpdateDeal(deal.id, { [column.key]: newValue });
                            } catch (error) {
                              console.error("Failed to update deal:", error);
                              toast({
                                title: "Error",
                                description: "Failed to update deal.",
                                variant: "destructive",
                              });
                            }
                          }}
                        >
                          {cellContent}
                        </InlineEditCell>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {sortedDeals.length === 0 && (
          <div className="py-6 px-4 text-center text-muted-foreground">
            No deals found.
          </div>
        )}
      </div>

      {/* Column Customizer */}
      <DealColumnCustomizer 
        open={showColumnCustomizer}
        onOpenChange={setShowColumnCustomizer}
        columns={columns.map((col, index) => ({
          field: col.key as string,
          label: col.label,
          visible: col.visible,
          order: index
        }))}
        onColumnsChange={(newColumns) => {
          const updatedColumns = newColumns.map(col => ({
            key: col.field as keyof Deal | 'select' | 'actions',
            label: col.label,
            visible: col.visible,
            type: columns.find(c => c.key === col.field)?.type || 'text'
          }));
          setColumns(updatedColumns);
        }}
      />
    </div>
  );
};
