import { useState, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Search, ChevronLeft, ChevronRight, Filter, X, SortAsc, SortDesc } from 'lucide-react';

interface FilterOption {
  label: string;
  value: string;
  count?: number;
}

interface SortOption {
  label: string;
  value: string;
}

interface AdminTableControlsProps<T> {
  data: T[];
  searchPlaceholder?: string;
  searchFields: (keyof T)[];
  filterOptions?: {
    label: string;
    field: keyof T;
    options: FilterOption[];
  }[];
  sortOptions?: SortOption[];
  itemsPerPage?: number;
  onDataChange: (filteredData: T[], pagination: {
    currentPage: number;
    totalPages: number;
    startIndex: number;
    endIndex: number;
  }) => void;
}

export function AdminTableControls<T extends Record<string, any>>({
  data,
  searchPlaceholder = "Search...",
  searchFields,
  filterOptions = [],
  sortOptions = [],
  itemsPerPage = 10,
  onDataChange
}: AdminTableControlsProps<T>) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilters, setActiveFilters] = useState<Record<string, string>>({});
  const [sortBy, setSortBy] = useState(sortOptions[0]?.value || '');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);

  const filteredAndSortedData = useMemo(() => {
    let filtered = [...data];

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(item =>
        searchFields.some(field => {
          const value = String(item[field] || '').toLowerCase();
          return value.includes(query);
        })
      );
    }

    // Apply active filters
    Object.entries(activeFilters).forEach(([field, value]) => {
      filtered = filtered.filter(item => {
        const itemValue = String(item[field] || '').toLowerCase();
        return itemValue === value.toLowerCase();
      });
    });

    // Apply sorting
    if (sortBy) {
      filtered.sort((a, b) => {
        const aValue = a[sortBy];
        const bValue = b[sortBy];
        
        let comparison = 0;
        if (aValue < bValue) comparison = -1;
        if (aValue > bValue) comparison = 1;
        
        return sortDirection === 'asc' ? comparison : -comparison;
      });
    }

    return filtered;
  }, [data, searchQuery, activeFilters, sortBy, sortDirection, searchFields]);

  // Calculate pagination
  const totalPages = Math.ceil(filteredAndSortedData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, filteredAndSortedData.length);
  const paginatedData = filteredAndSortedData.slice(startIndex, endIndex);

  // Update parent component whenever data changes
  useMemo(() => {
    onDataChange(paginatedData, {
      currentPage,
      totalPages,
      startIndex,
      endIndex
    });
  }, [paginatedData, currentPage, totalPages, startIndex, endIndex, onDataChange]);

  const handleFilterToggle = (field: string, value: string) => {
    setActiveFilters(prev => {
      const newFilters = { ...prev };
      if (newFilters[field] === value) {
        delete newFilters[field];
      } else {
        newFilters[field] = value;
      }
      setCurrentPage(1); // Reset to first page when filters change
      return newFilters;
    });
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

  const hasActiveFilters = searchQuery.trim() || Object.keys(activeFilters).length > 0;

  return (
    <div className="space-y-4">
      {/* Search and Sort Controls */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={searchPlaceholder}
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="pl-10 rounded-lg"
          />
        </div>
        
        {sortOptions.length > 0 && (
          <div className="flex items-center gap-2">
            <Select value={sortBy} onValueChange={handleSortChange}>
              <SelectTrigger className="w-40 rounded-lg">
                <SelectValue placeholder="Sort by..." />
              </SelectTrigger>
              <SelectContent>
                {sortOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')}
              className="rounded-lg"
            >
              {sortDirection === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
            </Button>
          </div>
        )}
      </div>

      {/* Filter Options */}
      {filterOptions.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium text-foreground">Filters</span>
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAllFilters}
                className="h-6 px-2 text-xs rounded-lg"
              >
                <X className="h-3 w-3 mr-1" />
                Clear all
              </Button>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filterOptions.map(({ label, field, options }) => (
              <div key={String(field)} className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">{label}</label>
                <div className="flex flex-wrap gap-1">
                  {options.map(option => {
                    const isActive = activeFilters[String(field)] === option.value;
                    return (
                      <Badge
                        key={option.value}
                        variant={isActive ? "default" : "secondary"}
                        className="cursor-pointer text-xs rounded-lg hover:bg-muted transition-colors"
                        onClick={() => handleFilterToggle(String(field), option.value)}
                      >
                        {option.label}
                        {option.count !== undefined && ` (${option.count})`}
                      </Badge>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Results Summary */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <div>
          Showing {startIndex + 1}-{endIndex} of {filteredAndSortedData.length} results
          {hasActiveFilters && ` (filtered from ${data.length} total)`}
        </div>
        
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="rounded-lg"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            <span className="text-xs">
              Page {currentPage} of {totalPages}
            </span>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="rounded-lg"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}