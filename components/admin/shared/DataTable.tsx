"use client";

import { useState, useMemo, useCallback } from "react";
import {
    ChevronUp, ChevronDown, ChevronsUpDown, Search, X, Download,
    ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, SlidersHorizontal, Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface Column<T> {
    key: string;
    header: string;
    sortable?: boolean;
    hidden?: boolean;
    render?: (row: T, index: number) => React.ReactNode;
    csvValue?: (row: T) => string;
    className?: string;
    headerClassName?: string;
}

export interface BulkAction<T> {
    label: string;
    onClick: (selectedRows: T[]) => void;
    variant?: "default" | "destructive";
}

interface DataTableProps<T> {
    data: T[];
    columns: Column<T>[];
    keyField: keyof T;
    isLoading?: boolean;
    searchable?: boolean;
    searchPlaceholder?: string;
    bulkActions?: BulkAction<T>[];
    defaultPageSize?: number;
    pageSizeOptions?: number[];
    emptyMessage?: string;
    onRowClick?: (row: T) => void;
    className?: string;
    filterComponent?: React.ReactNode;
}

type SortDirection = "asc" | "desc" | null;

function exportCSV<T>(data: T[], columns: Column<T>[], filename = "export.csv") {
    const visibleCols = columns.filter(c => !c.hidden);
    const headers = visibleCols.map(c => `"${c.header}"`).join(",");
    const rows = data.map(row =>
        visibleCols.map(c => {
            const val = c.csvValue ? c.csvValue(row) : String((row as any)[c.key] ?? "");
            return `"${val.replace(/"/g, '""')}"`;
        }).join(",")
    );
    const csv = [headers, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}

export default function DataTable<T extends Record<string, any>>({
    data, columns, keyField, isLoading = false, searchable = true,
    searchPlaceholder = "Search...", bulkActions = [], defaultPageSize = 10,
    pageSizeOptions = [10, 20, 50], emptyMessage = "No records found.",
    onRowClick, className, filterComponent
}: DataTableProps<T>) {
    const [search, setSearch] = useState("");
    const [sortKey, setSortKey] = useState<string | null>(null);
    const [sortDir, setSortDir] = useState<SortDirection>(null);
    const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(defaultPageSize);
    const [hiddenCols, setHiddenCols] = useState<Set<string>>(
        new Set(columns.filter(c => c.hidden).map(c => c.key))
    );
    const [colPickerOpen, setColPickerOpen] = useState(false);

    const visibleCols = useMemo(() => columns.filter(c => !hiddenCols.has(c.key)), [columns, hiddenCols]);

    const filtered = useMemo(() => {
        if (!search.trim()) return data;
        const q = search.toLowerCase();
        return data.filter(row =>
            visibleCols.some(col => {
                const val = col.csvValue ? col.csvValue(row) : String(row[col.key] ?? "");
                return val.toLowerCase().includes(q);
            })
        );
    }, [data, search, visibleCols]);

    const sorted = useMemo(() => {
        if (!sortKey || !sortDir) return filtered;
        return [...filtered].sort((a, b) => {
            const av = String(a[sortKey] ?? "").toLowerCase();
            const bv = String(b[sortKey] ?? "").toLowerCase();
            return sortDir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
        });
    }, [filtered, sortKey, sortDir]);

    const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
    const paginated = useMemo(() => {
        const start = (page - 1) * pageSize;
        return sorted.slice(start, start + pageSize);
    }, [sorted, page, pageSize]);

    const handleSort = useCallback((key: string) => {
        if (sortKey !== key) { setSortKey(key); setSortDir("asc"); }
        else if (sortDir === "asc") setSortDir("desc");
        else { setSortKey(null); setSortDir(null); }
        setPage(1);
    }, [sortKey, sortDir]);

    const handleSearch = (val: string) => { setSearch(val); setPage(1); };

    const allSelected = paginated.length > 0 && paginated.every(r => selectedKeys.has(String(r[keyField])));
    const toggleAll = () => {
        setSelectedKeys(prev => {
            const next = new Set(prev);
            if (allSelected) paginated.forEach(r => next.delete(String(r[keyField])));
            else paginated.forEach(r => next.add(String(r[keyField])));
            return next;
        });
    };
    const toggleRow = (key: string) => {
        setSelectedKeys(prev => {
            const next = new Set(prev);
            next.has(key) ? next.delete(key) : next.add(key);
            return next;
        });
    };

    const selectedRows = data.filter(r => selectedKeys.has(String(r[keyField])));
    const SortIcon = ({ col }: { col: Column<T> }) => {
        if (sortKey !== col.key) return <ChevronsUpDown className="h-3 w-3 opacity-40" />;
        return sortDir === "asc" ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />;
    };

    return (
        <div className={cn("flex flex-col gap-3", className)}>
            {/* Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                    {searchable && (
                        <div className="relative flex items-center">
                            <Search className="absolute left-3 h-3.5 w-3.5 text-muted-foreground" />
                            <input
                                value={search}
                                onChange={e => handleSearch(e.target.value)}
                                placeholder={searchPlaceholder}
                                className="h-8 rounded-lg border border-border bg-background pl-8 pr-7 text-sm outline-none focus:border-[#FF6B35] focus:ring-1 focus:ring-[#FF6B35]/20 w-52"
                            />
                            {search && (
                                <button onClick={() => handleSearch("")} className="absolute right-2">
                                    <X className="h-3.5 w-3.5 text-muted-foreground" />
                                </button>
                            )}
                        </div>
                    )}
                    {filterComponent}
                    {selectedKeys.size > 0 && bulkActions.length > 0 && (
                        <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/50 px-3 py-1">
                            <span className="text-xs text-muted-foreground">{selectedKeys.size} selected</span>
                            {bulkActions.map((action, i) => (
                                <button
                                    key={i}
                                    onClick={() => { action.onClick(selectedRows); setSelectedKeys(new Set()); }}
                                    className={cn(
                                        "rounded px-2 py-0.5 text-xs font-medium transition",
                                        action.variant === "destructive"
                                            ? "bg-red-500 text-white hover:bg-red-600"
                                            : "bg-primary text-primary-foreground hover:bg-primary/90"
                                    )}
                                >
                                    {action.label}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-2">
                    {/* Column visibility */}
                    <div className="relative">
                        <button
                            onClick={() => setColPickerOpen(!colPickerOpen)}
                            className="flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs text-muted-foreground transition hover:bg-muted"
                        >
                            <SlidersHorizontal className="h-3.5 w-3.5" />
                            Columns
                        </button>
                        {colPickerOpen && (
                            <>
                                <div className="fixed inset-0 z-10" onClick={() => setColPickerOpen(false)} />
                                <div className="absolute right-0 top-full z-20 mt-1 w-44 overflow-hidden rounded-xl border border-border bg-background shadow-lg">
                                    {columns.map(col => (
                                        <label key={col.key} className="flex cursor-pointer items-center gap-2 px-3 py-2 text-xs hover:bg-muted">
                                            <input
                                                type="checkbox"
                                                checked={!hiddenCols.has(col.key)}
                                                onChange={() => {
                                                    setHiddenCols(prev => {
                                                        const next = new Set(prev);
                                                        next.has(col.key) ? next.delete(col.key) : next.add(col.key);
                                                        return next;
                                                    });
                                                }}
                                                className="accent-[#FF6B35]"
                                            />
                                            {col.header}
                                        </label>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                    {/* CSV Export */}
                    <button
                        onClick={() => exportCSV(sorted, columns)}
                        className="flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs text-muted-foreground transition hover:bg-muted"
                    >
                        <Download className="h-3.5 w-3.5" />
                        Export
                    </button>
                </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto rounded-xl border border-border bg-background">
                <table className="w-full min-w-[600px] text-sm">
                    <thead className="border-b border-border bg-muted/40">
                        <tr>
                            {bulkActions.length > 0 && (
                                <th className="w-10 px-3 py-3">
                                    <input
                                        type="checkbox"
                                        checked={allSelected}
                                        onChange={toggleAll}
                                        className="accent-[#FF6B35]"
                                    />
                                </th>
                            )}
                            {visibleCols.map(col => (
                                <th
                                    key={col.key}
                                    className={cn(
                                        "whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground",
                                        col.sortable && "cursor-pointer select-none hover:text-foreground",
                                        col.headerClassName
                                    )}
                                    onClick={() => col.sortable && handleSort(col.key)}
                                >
                                    <span className="flex items-center gap-1">
                                        {col.header}
                                        {col.sortable && <SortIcon col={col} />}
                                    </span>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {isLoading ? (
                            Array.from({ length: 5 }).map((_, i) => (
                                <tr key={i}>
                                    {bulkActions.length > 0 && <td className="px-3 py-3"><div className="h-4 w-4 rounded bg-muted animate-pulse" /></td>}
                                    {visibleCols.map(col => (
                                        <td key={col.key} className="px-4 py-3">
                                            <div className="h-4 rounded bg-muted animate-pulse" style={{ width: `${60 + Math.random() * 40}%` }} />
                                        </td>
                                    ))}
                                </tr>
                            ))
                        ) : paginated.length === 0 ? (
                            <tr>
                                <td colSpan={visibleCols.length + (bulkActions.length > 0 ? 1 : 0)} className="py-16 text-center text-muted-foreground">
                                    <div className="flex flex-col items-center gap-2">
                                        <Search className="h-8 w-8 opacity-30" />
                                        <p className="text-sm">{emptyMessage}</p>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            paginated.map((row, i) => {
                                const key = String(row[keyField]);
                                const selected = selectedKeys.has(key);
                                return (
                                    <tr
                                        key={key}
                                        className={cn(
                                            "transition-colors",
                                            selected ? "bg-[#FF6B35]/5" : "hover:bg-muted/30",
                                            onRowClick && "cursor-pointer"
                                        )}
                                        onClick={() => onRowClick?.(row)}
                                    >
                                        {bulkActions.length > 0 && (
                                            <td className="px-3 py-3" onClick={e => e.stopPropagation()}>
                                                <input
                                                    type="checkbox"
                                                    checked={selected}
                                                    onChange={() => toggleRow(key)}
                                                    onClick={e => e.stopPropagation()}
                                                    className="accent-[#FF6B35]"
                                                />
                                            </td>
                                        )}
                                        {visibleCols.map(col => (
                                            <td key={col.key} className={cn("px-4 py-3 text-sm text-foreground", col.className)}>
                                                {col.render ? col.render(row, i) : String(row[col.key] ?? "—")}
                                            </td>
                                        ))}
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                    <span>Rows per page:</span>
                    <select
                        value={pageSize}
                        onChange={e => { setPageSize(Number(e.target.value)); setPage(1); }}
                        className="rounded border border-border bg-background px-2 py-1 text-xs focus:outline-none"
                    >
                        {pageSizeOptions.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <span>
                        {Math.min((page - 1) * pageSize + 1, sorted.length)}–{Math.min(page * pageSize, sorted.length)} of {sorted.length}
                    </span>
                </div>
                <div className="flex items-center gap-1">
                    <button onClick={() => setPage(1)} disabled={page === 1} className="rounded p-1 hover:bg-muted disabled:opacity-30"><ChevronsLeft className="h-4 w-4" /></button>
                    <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="rounded p-1 hover:bg-muted disabled:opacity-30"><ChevronLeft className="h-4 w-4" /></button>
                    <span className="px-2">Page {page} of {totalPages}</span>
                    <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="rounded p-1 hover:bg-muted disabled:opacity-30"><ChevronRight className="h-4 w-4" /></button>
                    <button onClick={() => setPage(totalPages)} disabled={page === totalPages} className="rounded p-1 hover:bg-muted disabled:opacity-30"><ChevronsRight className="h-4 w-4" /></button>
                </div>
            </div>
        </div>
    );
}
