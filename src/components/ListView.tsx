
import React, { useState, useEffect, useMemo } from 'react';
import { Deal } from '@/types/deal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { DealActionsDropdown } from '@/components/DealActionsDropdown';
import { DealsFilterPanel } from '@/components/DealsFilterPanel';
import { DealColumnCustomizer, DealColumnConfig } from '@/components/DealColumnCustomizer';
import { BulkActionsBar } from '@/components/BulkActionsBar';
import { InlineEditCell } from '@/components/InlineEditCell';
import { 
  Search, 
  Filter, 
  Settings,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Eye,
  Edit,
  Trash2
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useDealsImportExport } from '@/hooks/useDealsImportExport';
// Removed import of formatCurrency from csvUtils (not exported there)
// import { formatCurrency } from '@/utils/csvUtils';

interface ListViewProps {
  deals: Deal[];
  onDealClick: (deal: Deal) => void;
  onUpdateDeal: (dealId: string, updates: Partial<Deal>) => void;
  onDeleteDeals: (dealIds: string[]) => void;
  onImportDeals: (deals: any[]) => void;
}

type SortDirection = 'asc' | 'desc' | null;

interface SortConfig {
  field: keyof Deal | null;
  direction: SortDirection;
}

export const ListView: React.FC<ListViewProps> = ({
  deals,
  onDealClick,
  onUpdateDeal,
  onDeleteDeals,
  onImportDeals,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDeals, setSelectedDeals] = useState<Deal[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [showColumnCustomizer, setShowColumnCustomizer] = useState(false);
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    field: 'project_name', // Default sort by project_name
    direction: 'asc' // Default ascending order
  });

  // Available columns configuration
  const [visibleColumns, setVisibleColumns] = useState({
    select: true,
    project_name: true,
    customer_name: true,
    lead_name: true,
    lead_owner: true,
    stage: true,
    priority: true,
    total_contract_value: true,
    probability: true,
    expected_closing_date: true,
    actions: true,
  });

  // Local currency formatter (replaces missing csvUtils.formatCurrency)
  const formatCurrency = (amount?: number, currencyType?: string) => {
    if (amount == null || isNaN(Number(amount))) return '-';
    const symbols: Record<string, string> = { USD: '$', EUR: '€', INR: '₹' };
    const symbol = currencyType ? (symbols[currencyType] ?? '') : '';
    return `${symbol}${Number(amount).toLocaleString()}`;
  };

  // Export handlers via import/export hook
  const { handleExportAll, handleExportSelected } = useDealsImportExport({
    onRefresh: () => window.location.reload(),
  });

  // Helper: convert date to YYYY-MM-DD for date inputs
  const toYMD = (d?: string | Date | null) => {
    if (!d) return '';
    const date = new Date(d);
    if (Number.isNaN(date.getTime())) return '';
    return date.toISOString().slice(0, 10);
  };

  // Map visibleColumns to DealColumnCustomizer columns API
  const columnsForCustomizer: DealColumnConfig[] = useMemo(() => {
    const base: DealColumnConfig[] = [
      { field: 'project_name', label: 'Project', visible: visibleColumns.project_name, order: 0 },
      { field: 'customer_name', label: 'Customer', visible: visibleColumns.customer_name, order: 1 },
      { field: 'lead_name', label: 'Lead Name', visible: visibleColumns.lead_name, order: 2 },
      { field: 'lead_owner', label: 'Lead Owner', visible: visibleColumns.lead_owner, order: 3 },
      { field: 'stage', label: 'Stage', visible: visibleColumns.stage, order: 4 },
      { field: 'priority', label: 'Priority', visible: visibleColumns.priority, order: 5 },
      { field: 'total_contract_value', label: 'Value', visible: visibleColumns.total_contract_value, order: 6 },
      { field: 'probability', label: 'Probability', visible: visibleColumns.probability, order: 7 },
      { field: 'expected_closing_date', label: 'Expected Close', visible: visibleColumns.expected_closing_date, order: 8 },
      // Extra fields supported by the customizer but not currently rendered in the table:
      { field: 'region', label: 'Region', visible: false, order: 9 },
      { field: 'project_duration', label: 'Duration', visible: false, order: 10 },
      { field: 'start_date', label: 'Start Date', visible: false, order: 11 },
      { field: 'end_date', label: 'End Date', visible: false, order: 12 },
      { field: 'proposal_due_date', label: 'Proposal Due', visible: false, order: 13 },
      { field: 'total_revenue', label: 'Total Revenue', visible: false, order: 14 },
    ];
    return base;
  }, [visibleColumns]);

  const handleColumnsChange = (cols: DealColumnConfig[]) => {
    const updated = { ...visibleColumns };
    cols.forEach((c) => {
      if (c.field in updated) {
        (updated as any)[c.field] = c.visible;
      }
    });
    setVisibleColumns(updated);
  };

  // Sort deals based on current sort configuration
  const sortedDeals = useMemo(() => {
    if (!sortConfig.field || !sortConfig.direction) {
      return deals;
    }

    return [...deals].sort((a, b) => {
      const aValue = a[sortConfig.field!];
      const bValue = b[sortConfig.field!];

      // Handle null/undefined values
      if (aValue == null && bValue == null) return 0;
      if (aValue == null) return sortConfig.direction === 'asc' ? 1 : -1;
      if (bValue == null) return sortConfig.direction === 'asc' ? -1 : 1;

      // Convert to strings for comparison
      const aStr = String(aValue).toLowerCase();
      const bStr = String(bValue).toLowerCase();

      if (aStr < bStr) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aStr > bStr) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [deals, sortConfig]);

  // Filter deals based on search term
  const filteredDeals = useMemo(() => {
    if (!searchTerm.trim()) return sortedDeals;

    return sortedDeals.filter(deal =>
      Object.values(deal).some(value =>
        String(value || '').toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  }, [sortedDeals, searchTerm]);

  // Handle sorting
  const handleSort = (field: keyof Deal) => {
    setSortConfig(prev => {
      if (prev.field === field) {
        // Toggle direction or reset
        if (prev.direction === 'asc') {
          return { field, direction: 'desc' };
        } else if (prev.direction === 'desc') {
          return { field: null, direction: null };
        }
      }
      return { field, direction: 'asc' };
    });
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedDeals(filteredDeals);
    } else {
      setSelectedDeals([]);
    }
  };

  const handleSelectDeal = (deal: Deal, checked: boolean) => {
    if (checked) {
      setSelectedDeals(prev => [...prev, deal]);
    } else {
      setSelectedDeals(prev => prev.filter(d => d.id !== deal.id));
    }
  };

  const handleBulkDelete = () => {
    const dealIds = selectedDeals.map(deal => deal.id);
    onDeleteDeals(dealIds);
    setSelectedDeals([]);
  };

  const handleDeleteSingle = (dealId: string) => {
    onDeleteDeals([dealId]);
  };

  const getSortIcon = (field: keyof Deal) => {
    if (sortConfig.field !== field) {
      return <ArrowUpDown className="w-4 h-4" />;
    }
    if (sortConfig.direction === 'asc') {
      return <ArrowUp className="w-4 h-4" />;
    }
    if (sortConfig.direction === 'desc') {
      return <ArrowDown className="w-4 h-4" />;
    }
    return <ArrowUpDown className="w-4 h-4" />;
  };

  const getStageColor = (stage: string) => {
    const colors = {
      'Lead': 'bg-gray-100 text-gray-800',
      'Discussions': 'bg-blue-100 text-blue-800',
      'Qualified': 'bg-green-100 text-green-800',
      'RFQ': 'bg-yellow-100 text-yellow-800',
      'Offered': 'bg-orange-100 text-orange-800',
      'Won': 'bg-green-100 text-green-800',
      'Lost': 'bg-red-100 text-red-800',
      'Dropped': 'bg-gray-100 text-gray-800',
    };
    return colors[stage as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getPriorityColor = (priority: number) => {
    if (priority === 1) return 'text-red-600 font-medium';
    if (priority === 2) return 'text-orange-600 font-medium';
    if (priority === 3) return 'text-blue-600 font-medium';
    return 'text-gray-600';
  };

  const formatPriority = (priority: number) => {
    if (priority === 1) return '1 (Highest)';
    if (priority === 2) return '2 (High)';
    if (priority === 3) return '3 (Medium)';
    return `${priority} (Low)`;
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header Controls */}
      <div className="flex-shrink-0 p-4 border-b space-y-4">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search all deal details..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="w-4 h-4 mr-2" />
              Filter
            </Button>
            
            <DealActionsDropdown
              deals={filteredDeals}
              selectedDeals={selectedDeals}
              onRefresh={() => window.location.reload()}
              onColumnCustomize={() => setShowColumnCustomizer(true)}
              showColumns
              onImport={onImportDeals}
            />
          </div>
        </div>

        {showFilters && (
          <DealsFilterPanel open={showFilters} onOpenChange={setShowFilters} />
        )}

        {selectedDeals.length > 0 && (
          <BulkActionsBar
            selectedCount={selectedDeals.length}
            onDelete={handleBulkDelete}
            onExport={() => {
              const selectedIds = selectedDeals.map(d => d.id);
              if (selectedIds.length > 0) {
                handleExportSelected(deals, selectedIds);
              } else {
                handleExportAll(deals);
              }
            }}
            onClearSelection={() => setSelectedDeals([])}
          />
        )}
      </div>

      {/* Table Content */}
      <div className="flex-1 overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              {visibleColumns.select && (
                <TableHead className="w-12">
                  <Checkbox
                    checked={selectedDeals.length === filteredDeals.length && filteredDeals.length > 0}
                    onCheckedChange={handleSelectAll}
                  />
                </TableHead>
              )}
              
              {visibleColumns.project_name && (
                <TableHead>
                  <Button 
                    variant="ghost" 
                    className="h-auto p-0 font-medium justify-start"
                    onClick={() => handleSort('project_name')}
                  >
                    Project {getSortIcon('project_name')}
                  </Button>
                </TableHead>
              )}
              
              {visibleColumns.customer_name && (
                <TableHead>
                  <Button 
                    variant="ghost" 
                    className="h-auto p-0 font-medium justify-start"
                    onClick={() => handleSort('customer_name')}
                  >
                    Customer {getSortIcon('customer_name')}
                  </Button>
                </TableHead>
              )}
              
              {visibleColumns.lead_name && (
                <TableHead>
                  <Button 
                    variant="ghost" 
                    className="h-auto p-0 font-medium justify-start"
                    onClick={() => handleSort('lead_name')}
                  >
                    Lead Name {getSortIcon('lead_name')}
                  </Button>
                </TableHead>
              )}
              
              {visibleColumns.lead_owner && (
                <TableHead>
                  <Button 
                    variant="ghost" 
                    className="h-auto p-0 font-medium justify-start"
                    onClick={() => handleSort('lead_owner')}
                  >
                    Lead Owner {getSortIcon('lead_owner')}
                  </Button>
                </TableHead>
              )}
              
              {visibleColumns.stage && (
                <TableHead>
                  <Button 
                    variant="ghost" 
                    className="h-auto p-0 font-medium justify-start"
                    onClick={() => handleSort('stage')}
                  >
                    Stage {getSortIcon('stage')}
                  </Button>
                </TableHead>
              )}
              
              {visibleColumns.priority && (
                <TableHead>
                  <Button 
                    variant="ghost" 
                    className="h-auto p-0 font-medium justify-start"
                    onClick={() => handleSort('priority')}
                  >
                    Priority {getSortIcon('priority')}
                  </Button>
                </TableHead>
              )}
              
              {visibleColumns.total_contract_value && (
                <TableHead>
                  <Button 
                    variant="ghost" 
                    className="h-auto p-0 font-medium justify-start"
                    onClick={() => handleSort('total_contract_value')}
                  >
                    Value {getSortIcon('total_contract_value')}
                  </Button>
                </TableHead>
              )}
              
              {visibleColumns.probability && (
                <TableHead>
                  <Button 
                    variant="ghost" 
                    className="h-auto p-0 font-medium justify-start"
                    onClick={() => handleSort('probability')}
                  >
                    Probability {getSortIcon('probability')}
                  </Button>
                </TableHead>
              )}
              
              {visibleColumns.expected_closing_date && (
                <TableHead>
                  <Button 
                    variant="ghost" 
                    className="h-auto p-0 font-medium justify-start"
                    onClick={() => handleSort('expected_closing_date')}
                  >
                    Expected Close {getSortIcon('expected_closing_date')}
                  </Button>
                </TableHead>
              )}
              
              {visibleColumns.actions && (
                <TableHead className="w-24">Actions</TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredDeals.map((deal) => (
              <TableRow key={deal.id} className="hover:bg-muted/50">
                {visibleColumns.select && (
                  <TableCell>
                    <Checkbox
                      checked={selectedDeals.some(d => d.id === deal.id)}
                      onCheckedChange={(checked) => handleSelectDeal(deal, checked as boolean)}
                    />
                  </TableCell>
                )}
                
                {visibleColumns.project_name && (
                  <TableCell>
                    <InlineEditCell
                      value={deal.project_name || deal.deal_name || '-'}
                      field="project_name"
                      dealId={deal.id}
                      onSave={(id, _field, val) => {
                        const v = String(val || '').trim();
                        onUpdateDeal(id, { project_name: v, deal_name: v });
                      }}
                      type="text"
                    />
                  </TableCell>
                )}
                
                {visibleColumns.customer_name && (
                  <TableCell>
                    <InlineEditCell
                      value={deal.customer_name || '-'}
                      field="customer_name"
                      dealId={deal.id}
                      onSave={(id, field, val) => onUpdateDeal(id, { [field]: String(val || '') })}
                      type="text"
                    />
                  </TableCell>
                )}
                
                {visibleColumns.lead_name && (
                  <TableCell>
                    <InlineEditCell
                      value={deal.lead_name || '-'}
                      field="lead_name"
                      dealId={deal.id}
                      onSave={(id, field, val) => onUpdateDeal(id, { [field]: String(val || '') })}
                      type="text"
                    />
                  </TableCell>
                )}
                
                {visibleColumns.lead_owner && (
                  <TableCell>
                    <InlineEditCell
                      value={deal.lead_owner || '-'}
                      field="lead_owner"
                      dealId={deal.id}
                      onSave={(id, field, val) => onUpdateDeal(id, { [field]: String(val || '') })}
                      type="text"
                    />
                  </TableCell>
                )}
                
                {visibleColumns.stage && (
                  <TableCell>
                    <Badge className={getStageColor(deal.stage || '')}>
                      {deal.stage || '-'}
                    </Badge>
                  </TableCell>
                )}
                
                {visibleColumns.priority && (
                  <TableCell>
                    <span className={getPriorityColor(deal.priority || 0)}>
                      {deal.priority ? formatPriority(deal.priority) : '-'}
                    </span>
                  </TableCell>
                )}
                
                {visibleColumns.total_contract_value && (
                  <TableCell>
                    <InlineEditCell
                      value={deal.total_contract_value ? formatCurrency(deal.total_contract_value, (deal as any).currency_type) : '-'}
                      field="total_contract_value"
                      dealId={deal.id}
                      onSave={(id, _field, val) => {
                        const numericValue = parseFloat(String(val).replace(/[^0-9.-]/g, ''));
                        if (!isNaN(numericValue)) {
                          onUpdateDeal(id, { total_contract_value: numericValue });
                        }
                      }}
                      type="text"
                    />
                  </TableCell>
                )}
                
                {visibleColumns.probability && (
                  <TableCell>
                    <InlineEditCell
                      value={deal.probability ? `${deal.probability}%` : '-'}
                      field="probability"
                      dealId={deal.id}
                      onSave={(id, _field, val) => {
                        const numericValue = parseInt(String(val).replace('%', '').trim());
                        if (!isNaN(numericValue)) {
                          onUpdateDeal(id, { probability: numericValue });
                        }
                      }}
                      type="text"
                    />
                  </TableCell>
                )}
                
                {visibleColumns.expected_closing_date && (
                  <TableCell>
                    <InlineEditCell
                      value={deal.expected_closing_date ? toYMD(deal.expected_closing_date) : ''}
                      field="expected_closing_date"
                      dealId={deal.id}
                      onSave={(id, field, val) => onUpdateDeal(id, { [field]: String(val || '') })}
                      type="date"
                    />
                  </TableCell>
                )}
                
                {visibleColumns.actions && (
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onDealClick(deal)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onDealClick(deal)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteSingle(deal.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {filteredDeals.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            No deals found
          </div>
        )}
      </div>

      {/* Column Customizer Modal */}
      {showColumnCustomizer && (
        <DealColumnCustomizer
          open={showColumnCustomizer}
          onOpenChange={setShowColumnCustomizer}
          columns={columnsForCustomizer}
          onColumnsChange={handleColumnsChange}
        />
      )}
    </div>
  );
};
