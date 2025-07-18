import React, { useState, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Filter, SortAsc, SortDesc, X } from 'lucide-react';

interface FilterOption {
  field: string;
  label: string;
  values: { value: string; label: string }[];
}

interface SortOption {
  field: string;
  label: string;
}

interface CompactAdminTableControlsProps<T extends Record<string, any>> {
  data: T[];
  searchFields: (keyof T)[];
  filterOptions?: FilterOption[];
  sortOptions?: SortOption[];
  itemsPerPage?: number;
  onDataChange: (data: T[], pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    startIndex: number;
    endIndex: number;
  }) => void;
}

export function CompactAdminTableControls<T extends Record<string, any>>({
  data,
  searchFields,
  filterOptions = [],
  sortOptions = [],
  itemsPerPage = 10,
  onDataChange
}: CompactAdminTableControlsProps<T>) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilters, setActiveFilters] = useState<Record<string, string[]>>({});
  const [sortBy, setSortBy] = useState<string>('');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);

  // Filter and sort data
  const processedData = useMemo(() => {
    let filteredData = data;

    // Apply search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filteredData = filteredData.filter(item =>
        searchFields.some(field => {
          const value = item[field];
          if (typeof value === 'string') {
            return value.toLowerCase().includes(query);
          }
          if (Array.isArray(value)) {
            return value.some(v => v?.toString().toLowerCase().includes(query));
          }
          return value?.toString().toLowerCase().includes(query);
        })
      );
    }

    // Apply filters
    Object.entries(activeFilters).forEach(([field, values]) => {
      if (values.length > 0) {
        filteredData = filteredData.filter(item => 
          values.includes(item[field]?.toString() || '')
        );
      }
    });

    // Apply sorting
    if (sortBy) {
      filteredData.sort((a, b) => {
        const aVal = a[sortBy];
        const bVal = b[sortBy];
        
        if (aVal === null || aVal === undefined) return 1;
        if (bVal === null || bVal === undefined) return -1;
        
        let comparison = 0;
        if (typeof aVal === 'string' && typeof bVal === 'string') {
          comparison = aVal.localeCompare(bVal);
        } else if (aVal instanceof Date && bVal instanceof Date) {
          comparison = aVal.getTime() - bVal.getTime();
        } else {
          comparison = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
        }
        
        return sortDirection === 'asc' ? comparison : -comparison;
      });
    }

    return filteredData;
  }, [data, searchQuery, activeFilters, sortBy, sortDirection, searchFields]);

  // Calculate pagination
  const totalPages = Math.ceil(processedData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, processedData.length);
  const paginatedData = processedData.slice(startIndex, endIndex);

  // Update parent component when data changes
  React.useEffect(() => {
    onDataChange(paginatedData, {
      currentPage,
      totalPages,
      totalItems: processedData.length,
      startIndex: startIndex + 1,
      endIndex
    });
  }, [paginatedData, currentPage, totalPages, processedData.length, startIndex, endIndex, onDataChange]);

  const handleFilterToggle = (field: string, value: string) => {
    setActiveFilters(prev => {
      const current = prev[field] || [];
      const updated = current.includes(value)
        ? current.filter(v => v !== value)
        : [...current, value];
      
      return updated.length > 0 
        ? { ...prev, [field]: updated }
        : { ...prev, [field]: [] };
    });
    setCurrentPage(1);
  };

  const clearAllFilters = () => {
    setActiveFilters({});
    setSearchQuery('');
    setCurrentPage(1);
  };

  const handleSortChange = (newSortBy: string) => {
    if (sortBy === newSortBy) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(newSortBy);
      setSortDirection('desc');
    }
    setCurrentPage(1);
  };

  const totalActiveFilters = Object.values(activeFilters).reduce((sum, arr) => sum + arr.length, 0);

  return (
    <div className="space-y-3">
      {/* Search and Sort Row */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="pl-9 h-9"
          />
        </div>
        
        {sortOptions.length > 0 && (
          <Select value={sortBy} onValueChange={handleSortChange}>
            <SelectTrigger className="w-full sm:w-48 h-9">
              <div className="flex items-center gap-2">
                {sortDirection === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
                <SelectValue placeholder="Sort by..." />
              </div>
            </SelectTrigger>
            <SelectContent>
              {sortOptions.map((option) => (
                <SelectItem key={option.field} value={option.field}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Filters Row */}
      {filterOptions.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Filter className="h-4 w-4" />
            Filters:
          </div>
          
          {filterOptions.map((filter) => (
            <div key={filter.field} className="flex flex-wrap gap-1">
              {filter.values.map((option) => {
                const isActive = activeFilters[filter.field]?.includes(option.value);
                return (
                  <Badge
                    key={`${filter.field}-${option.value}`}
                    variant={isActive ? "default" : "outline"}
                    className="cursor-pointer text-xs h-6 hover:bg-primary/10"
                    onClick={() => handleFilterToggle(filter.field, option.value)}
                  >
                    {option.label}
                  </Badge>
                );
              })}
            </div>
          ))}
          
          {totalActiveFilters > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAllFilters}
              className="h-6 px-2 text-xs"
            >
              <X className="h-3 w-3 mr-1" />
              Clear all
            </Button>
          )}
        </div>
      )}

      {/* Results Summary */}
      <div className="flex justify-between items-center text-sm text-muted-foreground">
        <span>
          Showing {startIndex + 1}-{endIndex} of {processedData.length} results
        </span>
        
        {totalPages > 1 && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="h-7 px-2"
            >
              Previous
            </Button>
            <span className="text-xs">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="h-7 px-2"
            >
              Next
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}