"use client";

import { useState, useMemo, useCallback } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Plus,
  Search,
  Edit,
  Trash2,
  Printer,
  X,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ListFilter,
  Trash,
} from "lucide-react";

export interface Column<T> {
  key: keyof T | string;
  header: string;
  render?: (value: any, item: T) => React.ReactNode;
  sortable?: boolean;
  filterable?: boolean;
  filterType?: "text" | "select";
  filterOptions?: { label: string; value: string }[];
  hidden?: boolean;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  onCreate?: () => void;
  onEdit?: (item: T) => void;
  onDelete?: (item: T) => void;
  onPrint?: (item: T) => void;
  onBulkDelete?: (items: T[]) => void;
  searchable?: boolean;
  searchPlaceholder?: string;
  loading?: boolean;
  title?: string;
  selectable?: boolean;
  pageSize?: number;
  pageSizeOptions?: number[];
}

function getPageNumbers(current: number, total: number): (number | "ellipsis")[] {
  if (total <= 5) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const pages: (number | "ellipsis")[] = [1];

  if (current > 3) {
    pages.push("ellipsis");
  }

  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);

  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  if (current < total - 2) {
    pages.push("ellipsis");
  }

  if (total > 1) {
    pages.push(total);
  }

  return pages;
}

export function DataTable<T extends { id: number | string }>({
  data,
  columns,
  onCreate,
  onEdit,
  onDelete,
  onPrint,
  onBulkDelete,
  searchable = true,
  searchPlaceholder = "Search...",
  loading = false,
  title,
  selectable = false,
  pageSize: initialPageSize = 10,
  pageSizeOptions = [10, 20, 50, 100],
}: DataTableProps<T>) {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [columnFilters, setColumnFilters] = useState<Record<string, any>>({});
  const [selectedIds, setSelectedIds] = useState<Set<number | string>>(new Set());


  const visibleColumns = useMemo(
    () => columns.filter((c) => !c.hidden),
    [columns]
  );

  const filterableColumns = useMemo(
    () => visibleColumns.filter((c) => c.filterable),
    [visibleColumns]
  );

  const hasActiveFilters = Object.values(columnFilters).some(
    (v) => v !== undefined && v !== null && v !== "" && !(Array.isArray(v) && v.length === 0)
  );

  const getFilterOptions = useCallback(
    (column: Column<T>) => {
      if (column.filterOptions) return column.filterOptions;
      const uniqueValues = new Set(
        data.map((item) => String(item[column.key as keyof T] ?? ""))
      );
      return Array.from(uniqueValues)
        .filter((v) => v && v !== "undefined" && v !== "null")
        .map((v) => ({ label: v, value: v }));
    },
    [data]
  );

  const filteredData = useMemo(() => {
    if (!Array.isArray(data)) return [];

    return data.filter((item) => {
      if (searchTerm) {
        const matchesSearch = Object.values(item || {}).some((value) =>
          String(value).toLowerCase().includes(searchTerm.toLowerCase())
        );
        if (!matchesSearch) return false;
      }

      for (const [key, filterValue] of Object.entries(columnFilters)) {
        if (filterValue === undefined || filterValue === null || filterValue === "")
          continue;

        const itemValue = item[key as keyof T];
        const strValue = String(itemValue ?? "");

        if (strValue !== String(filterValue)) return false;
      }

      return true;
    });
  }, [data, searchTerm, columnFilters]);

  const sortedData = useMemo(() => {
    if (!sortField) return filteredData;

    return [...filteredData].sort((a, b) => {
      const aValue = a[sortField as keyof T];
      const bValue = b[sortField as keyof T];

      if (aValue == null) return 1;
      if (bValue == null) return -1;

      if (typeof aValue === "number" && typeof bValue === "number") {
        return sortDirection === "asc" ? aValue - bValue : bValue - aValue;
      }

      const strA = String(aValue);
      const strB = String(bValue);
      const comparison = strA.localeCompare(strB);
      return sortDirection === "asc" ? comparison : -comparison;
    });
  }, [filteredData, sortField, sortDirection]);

  const totalPages = Math.max(1, Math.ceil(sortedData.length / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);

  const paginatedData = useMemo(
    () =>
      sortedData.slice(
        (safeCurrentPage - 1) * pageSize,
        safeCurrentPage * pageSize
      ),
    [sortedData, safeCurrentPage, pageSize]
  );

  const allCurrentPageSelected = paginatedData.length > 0
    && paginatedData.every((item) => selectedIds.has(item.id));

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  const handlePageSizeChange = (newSize: string) => {
    const size = Number(newSize);
    setPageSize(size);
    setCurrentPage(1);
  };

  const handleSelectAll = () => {
    if (allCurrentPageSelected) {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        paginatedData.forEach((item) => next.delete(item.id));
        return next;
      });
    } else {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        paginatedData.forEach((item) => next.add(item.id));
        return next;
      });
    }
  };

  const handleSelectOne = (id: number | string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleClearSelection = () => {
    setSelectedIds(new Set());
  };

  const setColumnFilter = (key: string, value: any) => {
    setColumnFilters((prev) => {
      if (value === undefined || value === null || value === "" || (Array.isArray(value) && value.length === 0)) {
        const next = { ...prev };
        delete next[key];
        return next;
      }
      return { ...prev, [key]: value };
    });
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setColumnFilters({});
    setSearchTerm("");
    setCurrentPage(1);
  };

  const getSortIcon = (field: string) => {
    if (sortField !== field) {
      return <ArrowUpDown className="h-3 w-3 opacity-40" />;
    }
    return sortDirection === "asc" ? (
      <ArrowUp className="h-3 w-3" />
    ) : (
      <ArrowDown className="h-3 w-3" />
    );
  };

  const getFilterValue = (key: string) => columnFilters[key];

  const selectedItems = useMemo(
    () => data.filter((item) => selectedIds.has(item.id)),
    [data, selectedIds]
  );

  const pageNumbers = getPageNumbers(safeCurrentPage, totalPages);
  const showActionsColumn = !!(onEdit || onDelete || onPrint);

  return (
    <div className="space-y-4">
      {/* Header */}
      {(title || onCreate || selectable) && (
        <div className="flex items-center justify-between gap-4">
          {title && <h2 className="text-2xl font-bold">{title}</h2>}
          <div className="flex items-center gap-2 ml-auto">
            {selectable && selectedIds.size > 0 && (
              <div className="flex items-center gap-2 mr-2">
                <Badge variant="secondary" className="text-xs">
                  {selectedIds.size} selected
                </Badge>
              </div>
            )}
            {onCreate && (
              <Button onClick={onCreate} size="sm">
                <Plus className="mr-1 h-4 w-4" />
                Create
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Search + Filter toolbar */}
      <div className="flex items-center gap-2">
        {searchable && (
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={searchPlaceholder}
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-8"
            />
          </div>
        )}
        {filterableColumns.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant={hasActiveFilters ? "default" : "outline"}
                size="sm"
                className="gap-1 shrink-0"
              >
                <ListFilter className="h-4 w-4" />
                Filters
                {hasActiveFilters && (
                  <Badge variant="secondary" className="ml-1 text-xs px-1">
                    {Object.keys(columnFilters).length}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              {hasActiveFilters && (
                <>
                  <div className="flex items-center justify-between px-2 py-1">
                    <span className="text-xs text-muted-foreground">Active filters</span>
                    <Button variant="ghost" size="sm" onClick={clearFilters} className="h-6 text-xs">
                      Clear all
                    </Button>
                  </div>
                  <DropdownMenuSeparator />
                </>
              )}
              {filterableColumns.map((column) => (
                <div key={String(column.key)} className="px-2 py-1.5">
                  <DropdownMenuLabel className="px-0 text-xs font-medium">
                    {column.header}
                  </DropdownMenuLabel>
                  <Select
                    value={getFilterValue(String(column.key)) || "all"}
                    onValueChange={(v) => setColumnFilter(String(column.key), v === "all" ? undefined : v)}
                  >
                    <SelectTrigger className="h-8 w-full text-xs mt-1">
                      <SelectValue placeholder="All" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      {getFilterOptions(column).map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* Active filter chips */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-1.5">
          {Object.entries(columnFilters).map(([key, value]) => {
            const column = visibleColumns.find((c) => c.key === key);
            if (!column) return null;

            const label = `${column.header}: ${value}`;

            return (
              <Badge key={key} variant="secondary" className="text-xs gap-1 pr-1">
                {label}
                <button
                  onClick={() => setColumnFilter(key, undefined)}
                  className="ml-1 hover:text-foreground"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            );
          })}
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="text-xs h-6 px-2 text-muted-foreground"
          >
            Clear all
          </Button>
        </div>
      )}

      {/* Bulk actions bar */}
      {selectable && selectedIds.size > 0 && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-primary/5 border border-primary/20">
          <span className="text-sm font-medium">
            {selectedIds.size} item{selectedIds.size !== 1 ? "s" : ""} selected
          </span>
          <span className="text-xs text-muted-foreground">
            ({selectedItems.length === data.length ? "all items" : `${Math.round((selectedIds.size / data.length) * 100)}% of total`})
          </span>
          <div className="ml-auto flex items-center gap-2">
            {onBulkDelete && (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => onBulkDelete(selectedItems)}
              >
                <Trash className="h-4 w-4 mr-1" />
                Delete Selected
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={handleClearSelection}>
              <X className="h-4 w-4 mr-1" />
              Clear
            </Button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              {selectable && (
                <TableHead className="w-10">
                  <Checkbox
                    checked={
                      paginatedData.length > 0 && allCurrentPageSelected
                    }
                    onCheckedChange={handleSelectAll}
                    aria-label="Select all"
                  />
                </TableHead>
              )}
              {visibleColumns.map((column) => (
                <TableHead
                  key={String(column.key)}
                  className={column.sortable ? "cursor-pointer select-none" : ""}
                  onClick={() =>
                    column.sortable && handleSort(String(column.key))
                  }
                >
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-medium">
                      {column.header}
                    </span>
                    {column.sortable && (
                      <span className="text-muted-foreground">
                        {getSortIcon(String(column.key))}
                      </span>
                    )}
                  </div>
                </TableHead>
              ))}
              {(onEdit || onDelete || onPrint) && (
                <TableHead className="w-20 text-right">
                  <span className="text-xs font-medium">Actions</span>
                </TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={`skeleton-${i}`}>
                  {selectable && (
                    <TableCell>
                      <div className="h-4 w-4 rounded-sm bg-muted animate-pulse" />
                    </TableCell>
                  )}
                  {visibleColumns.map((col) => (
                    <TableCell key={String(col.key)}>
                      <div className="h-4 w-full max-w-32 bg-muted animate-pulse rounded" />
                    </TableCell>
                  ))}
                  {showActionsColumn && (
                    <TableCell>
                      <div className="h-8 w-16 bg-muted animate-pulse rounded ml-auto" />
                    </TableCell>
                  )}
                </TableRow>
              ))
            ) : paginatedData.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={
                    (selectable ? 1 : 0) +
                    visibleColumns.length +
                    (showActionsColumn ? 1 : 0)
                  }
                  className="text-center py-12"
                >
                  <div className="flex flex-col items-center gap-2">
                    <Search className="h-8 w-8 text-muted-foreground/40" />
                    <p className="text-muted-foreground text-sm">
                      {hasActiveFilters || searchTerm
                        ? "No results match your search or filters"
                        : "No data found"}
                    </p>
                    {(hasActiveFilters || searchTerm) && (
                      <Button
                        variant="link"
                        size="sm"
                        onClick={clearFilters}
                        className="text-xs"
                      >
                        Clear filters
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              paginatedData.map((item) => (
                <TableRow
                  key={item.id}
                  className={
                    selectedIds.has(item.id)
                      ? "bg-primary/5"
                      : undefined
                  }
                >
                  {selectable && (
                    <TableCell>
                      <Checkbox
                        checked={selectedIds.has(item.id)}
                        onCheckedChange={() => handleSelectOne(item.id)}
                        aria-label={`Select row ${item.id}`}
                      />
                    </TableCell>
                  )}
                  {visibleColumns.map((column) => (
                    <TableCell key={String(column.key)}>
                      {column.render
                        ? column.render(item[column.key as keyof T], item)
                        : String(item[column.key as keyof T] ?? "")}
                    </TableCell>
                  ))}
                  {(onEdit || onDelete || onPrint) && (
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        {onEdit && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onEdit(item)}
                            title="Edit"
                            className="h-8 w-8"
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </Button>
                        )}
                        {onPrint && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onPrint(item)}
                            title="Print"
                            className="h-8 w-8"
                          >
                            <Printer className="h-3.5 w-3.5" />
                          </Button>
                        )}
                        {onDelete && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onDelete(item)}
                            title="Delete"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          {sortedData.length > 0 && (
          <>
            <span>
              Showing{" "}
              <span className="font-medium">
                {(safeCurrentPage - 1) * pageSize + 1}
              </span>{" "}
              to{" "}
              <span className="font-medium">
                {Math.min(safeCurrentPage * pageSize, sortedData.length)}
              </span>{" "}
              of <span className="font-medium">{sortedData.length}</span>{" "}
              entries
            </span>
            <div className="flex items-center gap-1.5 ml-2">
              <span className="text-xs">Show</span>
              <Select
                value={String(pageSize)}
                onValueChange={handlePageSizeChange}
              >
                <SelectTrigger className="h-7 w-16 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {pageSizeOptions.map((size) => (
                    <SelectItem key={size} value={String(size)} className="text-xs">
                      {size}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </>
        )}
        </div>

        {sortedData.length > 0 && (
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              onClick={() => handlePageChange(1)}
              disabled={safeCurrentPage === 1}
              className="h-8 w-8"
              title="First page"
            >
              <ChevronsLeft className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => handlePageChange(safeCurrentPage - 1)}
              disabled={safeCurrentPage === 1}
              className="h-8 w-8"
              title="Previous page"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </Button>

            <div className="hidden sm:flex items-center gap-1">
              {pageNumbers.map((pageNum, idx) =>
                pageNum === "ellipsis" ? (
                  <span
                    key={`ellipsis-${idx}`}
                    className="px-1 text-xs text-muted-foreground"
                  >
                    ...
                  </span>
                ) : (
                  <Button
                    key={pageNum}
                    variant={
                      pageNum === safeCurrentPage ? "default" : "outline"
                    }
                    size="icon"
                    onClick={() => handlePageChange(pageNum)}
                    className="h-8 w-8 text-xs"
                  >
                    {pageNum}
                  </Button>
                )
              )}
            </div>

            <span className="sm:hidden text-xs text-muted-foreground px-2">
              {safeCurrentPage} / {totalPages}
            </span>

            <Button
              variant="outline"
              size="icon"
              onClick={() => handlePageChange(safeCurrentPage + 1)}
              disabled={safeCurrentPage === totalPages}
              className="h-8 w-8"
              title="Next page"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => handlePageChange(totalPages)}
              disabled={safeCurrentPage === totalPages}
              className="h-8 w-8"
              title="Last page"
            >
              <ChevronsRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
