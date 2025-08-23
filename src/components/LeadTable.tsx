
import React, { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Edit, Trash2, ArrowUpDown, ArrowUp, ArrowDown, FileText } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { ColumnCustomizer } from "./ColumnCustomizer";
import { LeadModal } from "./LeadModal";
import { LeadActionItemsModal } from "./LeadActionItemsModal";
import { useSecureLeads } from "@/hooks/useSecureLeads";
import { useUserDisplayNames } from "@/hooks/useUserDisplayNames";
import { LeadStatusFilter } from "./LeadStatusFilter";

interface LeadTableProps {
  showColumnCustomizer: boolean;
  setShowColumnCustomizer: (show: boolean) => void;
  showModal: boolean;
  setShowModal: (show: boolean) => void;
  selectedLeads: string[];
  setSelectedLeads: React.Dispatch<React.SetStateAction<string[]>>;
}

interface Lead {
  id: string;
  lead_name: string;
  company_name?: string;
  email?: string;
  phone_no?: string;
  position?: string;
  created_by?: string;
  contact_owner?: string;
  lead_status?: string;
  created_time?: string;
  modified_time?: string;
  linkedin?: string;
  website?: string;
  contact_source?: string;
  industry?: string;
  country?: string;
  description?: string;
}

const defaultColumns = [
  { key: 'lead_name', label: 'Lead Name', visible: true, field: 'lead_name', order: 1 },
  { key: 'company_name', label: 'Company Name', visible: true, field: 'company_name', order: 2 },
  { key: 'position', label: 'Position', visible: true, field: 'position', order: 3 },
  { key: 'email', label: 'Email', visible: true, field: 'email', order: 4 },
  { key: 'phone_no', label: 'Phone', visible: true, field: 'phone_no', order: 5 },
  { key: 'country', label: 'Region', visible: true, field: 'country', order: 6 },
  { key: 'contact_owner', label: 'Lead Owner', visible: true, field: 'contact_owner', order: 7 },
  { key: 'lead_status', label: 'Lead Status', visible: true, field: 'lead_status', order: 8 },
];

const LeadTable: React.FC<LeadTableProps> = ({ 
  showColumnCustomizer, 
  setShowColumnCustomizer, 
  showModal, 
  setShowModal,
  selectedLeads,
  setSelectedLeads
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [visibleColumns, setVisibleColumns] = useState(defaultColumns);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [showActionItemsModal, setShowActionItemsModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('');

  const { leads, loading, fetchLeads, deleteLead } = useSecureLeads();

  // Get unique user IDs for display name lookup
  const contactOwnerIds = [...new Set(leads.map(l => l.contact_owner).filter(Boolean))];
  const createdByIds = [...new Set(leads.map(l => l.created_by).filter(Boolean))];
  const allUserIds = [...new Set([...contactOwnerIds, ...createdByIds])];
  
  const { displayNames } = useUserDisplayNames(allUserIds);

  // Filter and sort leads
  const filteredLeads = leads.filter(lead => {
    const matchesSearch = !searchTerm || Object.values(lead).some(value => 
      value && value.toString().toLowerCase().includes(searchTerm.toLowerCase())
    );
    const matchesStatus = !statusFilter || lead.lead_status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const sortedLeads = [...filteredLeads].sort((a, b) => {
    if (!sortField) return 0;
    
    const aValue = a[sortField as keyof Lead] || '';
    const bValue = b[sortField as keyof Lead] || '';
    
    if (sortDirection === 'asc') {
      return aValue.toString().localeCompare(bValue.toString());
    } else {
      return bValue.toString().localeCompare(aValue.toString());
    }
  });

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (field: string) => {
    if (sortField !== field) return <ArrowUpDown className="w-4 h-4" />;
    return sortDirection === 'asc' ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />;
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedLeads(sortedLeads.map(lead => lead.id));
    } else {
      setSelectedLeads([]);
    }
  };

  const handleSelectLead = (leadId: string, checked: boolean) => {
    if (checked) {
      setSelectedLeads(prev => [...prev, leadId]);
    } else {
      setSelectedLeads(prev => prev.filter(id => id !== leadId));
    }
  };

  const handleEdit = (lead: Lead) => {
    setSelectedLead(lead);
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this lead?')) {
      try {
        await deleteLead(id);
        setSelectedLeads(prev => prev.filter(leadId => leadId !== id));
      } catch (error) {
        console.error('Error deleting lead:', error);
      }
    }
  };

  const handleShowActionItems = (lead: Lead) => {
    setSelectedLead(lead);
    setShowActionItemsModal(true);
  };

  const getDisplayValue = (lead: Lead, columnKey: string) => {
    if (columnKey === 'contact_owner') {
      if (!lead.contact_owner) return '-';
      const displayName = displayNames[lead.contact_owner];
      return displayName && displayName !== "Unknown User" ? displayName : 
             (displayName === "Unknown User" ? "Unknown User" : "Loading...");
    } else if (columnKey === 'lead_status' && lead.lead_status) {
      return (
        <Badge variant={lead.lead_status === 'Converted' ? 'default' : 'secondary'}>
          {lead.lead_status}
        </Badge>
      );
    } else {
      return lead[columnKey as keyof Lead] || '-';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mr-2"></div>
        Loading leads...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search and Filters */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search leads..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-80"
            />
          </div>
          <LeadStatusFilter value={statusFilter} onValueChange={setStatusFilter} />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-auto">
        <Table>
          <TableHeader className="sticky top-0 z-10">
            <TableRow className="bg-muted/50 hover:bg-muted/60 border-b-2">
              <TableHead className="w-12 text-center">
                <div className="flex justify-center">
                  <Checkbox
                    checked={selectedLeads.length > 0 && selectedLeads.length === sortedLeads.length}
                    onCheckedChange={handleSelectAll}
                  />
                </div>
              </TableHead>
              {visibleColumns.filter(col => col.visible).map((column) => (
                <TableHead key={column.key} className="text-left font-bold text-foreground px-4 py-4">
                  <Button
                    variant="ghost"
                    className="h-auto p-0 font-bold hover:bg-transparent justify-start text-foreground"
                    onClick={() => handleSort(column.key)}
                  >
                    <div className="flex items-center gap-2">
                      {column.label}
                      {getSortIcon(column.key)}
                    </div>
                  </Button>
                </TableHead>
              ))}
              <TableHead className="text-center font-bold text-foreground w-32">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedLeads.length === 0 ? (
              <TableRow>
                <TableCell colSpan={visibleColumns.filter(col => col.visible).length + 2} className="text-center py-8">
                  <div className="flex flex-col items-center gap-2">
                    <p className="text-muted-foreground">No leads found</p>
                    {searchTerm && (
                      <p className="text-sm text-muted-foreground">
                        Try adjusting your search terms
                      </p>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              sortedLeads.map((lead) => (
                <TableRow key={lead.id} className="hover:bg-muted/20 border-b">
                  <TableCell className="text-center px-4 py-3">
                    <div className="flex justify-center">
                      <Checkbox
                        checked={selectedLeads.includes(lead.id)}
                        onCheckedChange={(checked) => handleSelectLead(lead.id, checked as boolean)}
                      />
                    </div>
                  </TableCell>
                  {visibleColumns.filter(col => col.visible).map((column) => (
                    <TableCell key={column.key} className="text-left px-4 py-3 align-middle">
                      <div className="truncate max-w-[200px]">
                        {column.key === 'lead_name' ? (
                          <button
                            onClick={() => handleEdit(lead)}
                            className="text-primary hover:underline font-medium text-left"
                          >
                            {lead[column.key as keyof Lead]}
                          </button>
                        ) : (
                          <span className="text-sm">
                            {getDisplayValue(lead, column.key)}
                          </span>
                        )}
                      </div>
                    </TableCell>
                  ))}
                  <TableCell className="w-32 py-3">
                    <div className="flex items-center justify-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(lead)}
                        className="h-8 w-8 p-0 hover:bg-muted"
                        title="Edit lead"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleShowActionItems(lead)}
                        className="h-8 w-8 p-0 hover:bg-muted"
                        title="Action items"
                      >
                        <FileText className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(lead.id)}
                        className="h-8 w-8 p-0 hover:bg-destructive/10 text-destructive hover:text-destructive"
                        title="Delete lead"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Modals */}
      <ColumnCustomizer
        isOpen={showColumnCustomizer}
        onClose={() => setShowColumnCustomizer(false)}
        columns={visibleColumns}
        onColumnsChange={setVisibleColumns}
      />

      <LeadModal
        open={showModal}
        onOpenChange={(open) => {
          setShowModal(open);
          if (!open) setSelectedLead(null);
        }}
        lead={selectedLead}
        onSuccess={() => {
          fetchLeads();
          setShowModal(false);
          setSelectedLead(null);
        }}
      />

      <LeadActionItemsModal
        open={showActionItemsModal}
        onOpenChange={(open) => {
          setShowActionItemsModal(open);
          if (!open) setSelectedLead(null);
        }}
        leadId={selectedLead?.id || ''}
        leadName={selectedLead?.lead_name || ''}
      />
    </div>
  );
};

export default LeadTable;
