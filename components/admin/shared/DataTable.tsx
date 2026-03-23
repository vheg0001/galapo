"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
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
    persistKey?: string;
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
    onRowClick, className, filterComponent, persistKey
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
    const [isColumnPrefsReady, setIsColumnPrefsReady] = useState(false);
    const storageKey = useMemo(() => {
        const signature = columns.map((c) => c.key).join("|");
        if (persistKey) return `admin:datatable:cols:${persistKey}:${signature}`;
        if (typeof window !== "undefined") return `admin:datatable:cols:${window.location.pathname}:${signature}`;
        return `admin:datatable:cols:${signature}`;
    }, [columns, persistKey]);

    useEffect(() => {
        setIsColumnPrefsReady(false);
        try {
            const raw = window.localStorage.getItem(storageKey);
            if (raw) {
                const parsed = JSON.parse(raw);
                if (Array.isArray(parsed)) {
                    const validKeys = new Set(columns.map((c) => c.key));
                    const next = new Set<string>(parsed.filter((key: string) => validKeys.has(key)));
                    setHiddenCols(next);
                }
            }
        } catch {
            // Ignore malformed persisted table settings.
        } finally {
            setIsColumnPrefsReady(true);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [storageKey]);

    useEffect(() => {
        if (!isColumnPrefsReady) return;
        try {
            window.localStorage.setItem(storageKey, JSON.stringify(Array.from(hiddenCols)));
        } catch {
            // Ignore persistence errors (private mode, quota, etc).
        }
    }, [hiddenCols, storageKey, isColumnPrefsReady]);

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
        <div className={cn("flex flex-col gap-4 relative", className)}>
            {/* Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-3 px-1">
                <div className="flex flex-wrap items-center gap-3">
                    {searchable && (
                        <div className="relative flex items-center group">
                            <label htmlFor="datatable-search" className="sr-only">{searchPlaceholder}</label>
                            <Search className="absolute left-3.5 h-4 w-4 text-muted-foreground/60 transition-colors group-focus-within:text-primary" />
                            <input
                                id="datatable-search"
                                name="datatable_search"
                                value={search}
                                onChange={e => handleSearch(e.target.value)}
                                placeholder={searchPlaceholder}
                                className="h-10 w-64 rounded-xl border border-border/50 bg-background/50 pl-10 pr-9 text-sm font-medium outline-none transition-all placeholder:text-muted-foreground/50 focus:border-primary/50 focus:bg-background focus:ring-4 focus:ring-primary/10 shadow-sm"
                            />
                            {search && (
                                <button onClick={() => handleSearch("")} className="absolute right-2.5 rounded-md p-1 hover:bg-muted transition-colors">
                                    <X className="h-3.5 w-3.5 text-muted-foreground" />
                                </button>
                            )}
                        </div>
                    )}
                    {filterComponent}
                    {selectedKeys.size > 0 && bulkActions.length > 0 && (
                        <div className="flex items-center gap-3 rounded-xl border border-primary/20 bg-primary/5 px-4 py-1.5 shadow-sm animate-in fade-in slide-in-from-left-2 duration-300">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-primary">{selectedKeys.size} selected</span>
                            <div className="h-4 w-px bg-primary/20" />
                            {bulkActions.map((action, i) => (
                                <button
                                    key={i}
                                    onClick={() => { action.onClick(selectedRows); setSelectedKeys(new Set()); }}
                                    className={cn(
                                        "rounded-lg px-3 py-1.5 text-xs font-bold transition-all hover:scale-105 active:scale-95 shadow-sm",
                                        action.variant === "destructive"
                                            ? "bg-red-500 text-white hover:bg-red-600 shadow-red-500/20"
                                            : "bg-primary text-primary-foreground hover:bg-primary/90 shadow-primary/20"
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
                            className="flex h-10 items-center gap-2 rounded-xl border border-border/50 bg-background/50 px-4 text-xs font-bold text-muted-foreground shadow-sm transition-colors hover:bg-muted hover:text-foreground"
                        >
                            <SlidersHorizontal className="h-4 w-4" />
                            Columns
                        </button>
                        {colPickerOpen && (
                            <>
                                <div className="fixed inset-0 z-10" onClick={() => setColPickerOpen(false)} />
                                <div className="absolute right-0 top-full z-20 mt-2 w-56 overflow-hidden rounded-2xl border border-border/50 bg-background/95 backdrop-blur-xl shadow-xl animate-in fade-in slide-in-from-top-2 duration-200">
                                    <div className="px-3 py-2 border-b border-border/50">
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Toggle Columns</span>
                                    </div>
                                    <div className="p-1">
                                        {columns.map(col => (
                                            <label key={col.key} className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-xs font-medium transition-colors hover:bg-muted/50">
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
                                                    className="accent-primary w-4 h-4 rounded border-border cursor-pointer"
                                                />
                                                {col.header}
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                    {/* CSV Export */}
                    <button
                        onClick={() => exportCSV(sorted, columns)}
                        className="flex h-10 items-center gap-2 rounded-xl border border-border/50 bg-background/50 px-4 text-xs font-bold text-muted-foreground shadow-sm transition-colors hover:bg-muted hover:text-foreground"
                    >
                        <Download className="h-4 w-4" />
                        Export
                    </button>
                </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto rounded-[2rem] border border-border/50 bg-background/40 shadow-sm backdrop-blur-sm ring-1 ring-border/50">
                <table className="w-full min-w-[600px] text-sm text-left">
                    <thead className="border-b border-border/50 bg-muted/20 backdrop-blur-xl">
                        <tr>
                            {bulkActions.length > 0 && (
                                <th className="w-12 px-4 py-4">
                                    <label htmlFor="select-all-rows" className="sr-only">Select All Rows</label>
                                    <input
                                        id="select-all-rows"
                                        name="select_all"
                                        type="checkbox"
                                        checked={allSelected}
                                        onChange={toggleAll}
                                        className="accent-primary w-4 h-4 rounded border-border cursor-pointer"
                                    />
                                </th>
                            )}
                            {visibleCols.map(col => (
                                <th
                                    key={col.key}
                                    className={cn(
                                        "whitespace-nowrap px-4 py-4 text-left text-[11px] font-bold uppercase tracking-wider text-muted-foreground",
                                        col.sortable && "cursor-pointer select-none hover:text-foreground transition-colors",
                                        col.headerClassName
                                    )}
                                    onClick={() => col.sortable && handleSort(col.key)}
                                >
                                    <span className="flex items-center gap-1.5">
                                        {col.header}
                                        {col.sortable && <SortIcon col={col} />}
                                    </span>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border/30">
                        {isLoading ? (
                            Array.from({ length: 5 }).map((_, i) => (
                                <tr key={i} className="hover:bg-muted/10 transition-colors">
                                    {bulkActions.length > 0 && <td className="px-4 py-4"><div className="h-4 w-4 rounded bg-muted/60 animate-pulse" /></td>}
                                    {visibleCols.map(col => (
                                        <td key={col.key} className="px-4 py-4">
                                            <div className="h-4 rounded bg-muted/60 animate-pulse" style={{ width: `${60 + Math.random() * 40}%` }} />
                                        </td>
                                    ))}
                                </tr>
                            ))
                        ) : paginated.length === 0 ? (
                            <tr>
                                <td colSpan={visibleCols.length + (bulkActions.length > 0 ? 1 : 0)} className="py-24 text-center text-muted-foreground">
                                    <div className="flex flex-col items-center gap-3">
                                        <div className="p-4 rounded-full bg-muted/30 ring-1 ring-border/50">
                                            <Search className="h-8 w-8 text-muted-foreground/40" />
                                        </div>
                                        <p className="text-sm font-medium">{emptyMessage}</p>
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
                                            "transition-colors duration-200",
                                            selected ? "bg-primary/5 hover:bg-primary/10" : "hover:bg-muted/30",
                                            onRowClick && "cursor-pointer"
                                        )}
                                        onClick={() => onRowClick?.(row)}
                                    >
                                        {bulkActions.length > 0 && (
                                            <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                                                <label htmlFor={`select-row-${key}`} className="sr-only">Select Row {key}</label>
                                                <input
                                                    id={`select-row-${key}`}
                                                    name={`select_row_${key}`}
                                                    type="checkbox"
                                                    checked={selected}
                                                    onChange={() => toggleRow(key)}
                                                    onClick={e => e.stopPropagation()}
                                                    className="accent-primary w-4 h-4 rounded border-border cursor-pointer transition-transform active:scale-95"
                                                />
                                            </td>
                                        )}
                                        {visibleCols.map(col => (
                                            <td key={col.key} className={cn("px-4 py-3 text-sm font-medium text-foreground relative", col.className)}>
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

            {/* Pagination outline-none transition-all focus:border-primary */}
            <div className="flex flex-wrap items-center justify-between gap-4 text-xs font-semibold text-muted-foreground px-2">
                <div className="flex items-center gap-3">
                    <label htmlFor="datatable-page-size">Rows per page:</label>
                    <select
                        id="datatable-page-size"
                        name="page_size"
                        value={pageSize}
                        onChange={e => { setPageSize(Number(e.target.value)); setPage(1); }}
                        className="h-8 rounded-lg border border-border/50 bg-background/50 px-2 py-1 text-xs outline-none transition-colors hover:bg-muted focus:border-primary focus:ring-1 focus:ring-primary/20"
                    >
                        {pageSizeOptions.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <span className="hidden sm:inline">
                        {Math.min((page - 1) * pageSize + 1, sorted.length)}–{Math.min(page * pageSize, sorted.length)} of {sorted.length}
                    </span>
                </div>
                <div className="flex items-center gap-1.5">
                    <button onClick={() => setPage(1)} disabled={page === 1} className="flex h-8 w-8 items-center justify-center rounded-lg border border-border/50 bg-background/50 transition-colors hover:bg-muted disabled:pointer-events-none disabled:opacity-40"><ChevronsLeft className="h-4 w-4" /></button>
                    <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="flex h-8 w-8 items-center justify-center rounded-lg border border-border/50 bg-background/50 transition-colors hover:bg-muted disabled:pointer-events-none disabled:opacity-40"><ChevronLeft className="h-4 w-4" /></button>
                    <span className="flex h-8 items-center px-3 rounded-lg bg-background/50 border border-border/50">Page {page} of {totalPages}</span>
                    <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="flex h-8 w-8 items-center justify-center rounded-lg border border-border/50 bg-background/50 transition-colors hover:bg-muted disabled:pointer-events-none disabled:opacity-40"><ChevronRight className="h-4 w-4" /></button>
                    <button onClick={() => setPage(totalPages)} disabled={page === totalPages} className="flex h-8 w-8 items-center justify-center rounded-lg border border-border/50 bg-background/50 transition-colors hover:bg-muted disabled:pointer-events-none disabled:opacity-40"><ChevronsRight className="h-4 w-4" /></button>
                </div>
            </div>
        </div>
    );
}
