"use client";

import { useState, useEffect } from "react";
import { 
    Table, 
    TableBody, 
    TableCell, 
    TableHead, 
    TableHeader, 
    TableRow 
} from "@/components/ui/table";
import { 
    Card, 
    CardContent, 
    CardHeader, 
    CardTitle,
    CardDescription
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
    Select, 
    SelectContent, 
    SelectItem, 
    SelectTrigger, 
    SelectValue 
} from "@/components/ui/select";
import { 
    Search, 
    Filter, 
    RefreshCcw, 
    Calendar, 
    AlertCircle, 
    CheckCircle2, 
    Clock, 
    ChevronLeft, 
    ChevronRight,
    ExternalLink,
    Play
} from "lucide-react";
import { format, differenceInDays } from "date-fns";
import { toast } from "react-hot-toast";
import Link from "next/link";
import AutoCheckTrigger from "./AutoCheckTrigger";

export default function AnnualChecksTable() {
    const [checks, setChecks] = useState<any[]>([]);
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [status, setStatus] = useState("all");
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);

    const fetchChecks = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/admin/annual-checks?status=${status === 'all' ? '' : status}&page=${page}`);
            const data = await res.json();
            if (data.error) throw new Error(data.error);
            setChecks(data.checks);
            setStats(data.stats);
            setTotal(data.total);
        } catch (err: any) {
            toast.error(err.message || "Failed to fetch checks");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchChecks();
    }, [status, page]);

    const getStatusBadge = (status: string, deadline: string) => {
        const isOverdue = status === 'pending' && new Date(deadline) < new Date();
        
        switch (status) {
            case 'confirmed':
                return <Badge className="bg-emerald-50 text-emerald-700 hover:bg-emerald-50 border-emerald-100 flex items-center gap-1 w-fit"><CheckCircle2 className="h-3 w-3" /> Confirmed</Badge>;
            case 'pending':
                return isOverdue 
                    ? <Badge variant="destructive" className="flex items-center gap-1 w-fit"><AlertCircle className="h-3 w-3" /> Overdue</Badge>
                    : <Badge className="bg-amber-50 text-amber-700 hover:bg-amber-50 border-amber-100 flex items-center gap-1 w-fit"><Clock className="h-3 w-3" /> Pending</Badge>;
            case 'deactivated':
                return <Badge variant="outline" className="text-gray-400 border-gray-200">Deactivated</Badge>;
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    return (
        <div className="space-y-6">
            {/* Stats Overview */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="border-gray-200 shadow-sm overflow-hidden group hover:border-emerald-200 transition-colors">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-gray-50/30">
                        <CardTitle className="text-sm font-bold uppercase tracking-wider text-gray-500">Check Eligibility</CardTitle>
                        <RefreshCcw className="h-4 w-4 text-emerald-500" />
                    </CardHeader>
                    <CardContent className="pt-4">
                        <div className="text-3xl font-bold text-gray-900">{stats?.due_for_check || 0}</div>
                        <p className="text-xs text-emerald-600 font-medium flex items-center gap-1 mt-1">
                            Listings not verified in 1yr+
                        </p>
                    </CardContent>
                </Card>

                <Card className="border-gray-200 shadow-sm overflow-hidden group hover:border-blue-200 transition-colors">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-gray-50/30">
                        <CardTitle className="text-sm font-bold uppercase tracking-wider text-gray-500">Waitng Response</CardTitle>
                        <Clock className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent className="pt-4">
                        <div className="text-3xl font-bold text-gray-900">{stats?.pending_response || 0}</div>
                        <p className="text-xs text-blue-600 font-medium flex items-center gap-1 mt-1">
                            Active verifications sent
                        </p>
                    </CardContent>
                </Card>

                <Card className="border-gray-200 shadow-sm overflow-hidden group hover:border-rose-200 transition-colors">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-gray-50/30">
                        <CardTitle className="text-sm font-bold uppercase tracking-wider text-gray-500">Overdue / Warning</CardTitle>
                        <AlertCircle className="h-4 w-4 text-rose-500" />
                    </CardHeader>
                    <CardContent className="pt-4">
                        <div className="text-3xl font-bold text-gray-900">{stats?.no_response || 0}</div>
                        <p className="text-xs text-rose-600 font-medium flex items-center gap-1 mt-1">
                            Action required: No response
                        </p>
                    </CardContent>
                </Card>

                <Card className="border-gray-200 shadow-sm overflow-hidden group hover:border-teal-200 transition-colors">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-gray-50/30">
                        <CardTitle className="text-sm font-bold uppercase tracking-wider text-gray-500">Verified MoM</CardTitle>
                        <CheckCircle2 className="h-4 w-4 text-teal-500" />
                    </CardHeader>
                    <CardContent className="pt-4">
                        <div className="text-3xl font-bold text-gray-900">{stats?.confirmed_this_month || 0}</div>
                        <p className="text-xs text-emerald-600 font-medium flex items-center gap-1 mt-1">
                            Confirmations this month
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Actions & Filters */}
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                    <div className="relative w-full md:w-80">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input placeholder="Search business name..." className="pl-9 h-10 border-gray-200" />
                    </div>
                    <Select value={status} onValueChange={setStatus}>
                        <SelectTrigger className="w-[180px] h-10 border-gray-200">
                            <Filter className="h-3.5 w-3.5 mr-2 text-gray-400" />
                            <SelectValue placeholder="Status Filter" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Statuses</SelectItem>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="confirmed">Confirmed</SelectItem>
                            <SelectItem value="deactivated">Deactivated</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                
                <AutoCheckTrigger onTriggered={fetchChecks} dueCount={stats?.due_for_check || 0} />
            </div>

            {/* Table */}
            <Card className="border-gray-200 shadow-sm overflow-hidden">
                <CardContent className="p-0">
                    <Table>
                        <TableHeader className="bg-gray-50/50">
                            <TableRow>
                                <TableHead className="w-[250px]">Business Listing</TableHead>
                                <TableHead>Owner</TableHead>
                                <TableHead>Sent At</TableHead>
                                <TableHead>Deadline</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <TableRow key={i} className="animate-pulse">
                                        <TableCell><div className="h-4 w-40 bg-gray-100 rounded" /></TableCell>
                                        <TableCell><div className="h-4 w-32 bg-gray-100 rounded" /></TableCell>
                                        <TableCell><div className="h-4 w-24 bg-gray-100 rounded" /></TableCell>
                                        <TableCell><div className="h-4 w-24 bg-gray-100 rounded" /></TableCell>
                                        <TableCell><div className="h-8 w-20 bg-gray-100 rounded-full" /></TableCell>
                                        <TableCell className="text-right"><div className="h-8 w-8 bg-gray-100 rounded-full ml-auto" /></TableCell>
                                    </TableRow>
                                ))
                            ) : checks.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-48 text-center text-gray-500 italic">
                                        No verification records found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                checks.map((check) => (
                                    <TableRow key={check.id} className="hover:bg-gray-50/30 transition-colors">
                                        <TableCell>
                                            <div className="space-y-1">
                                                <Link 
                                                    href={`/listing/${check.listing?.slug}`} 
                                                    target="_blank"
                                                    className="font-bold text-gray-900 hover:text-emerald-600 flex items-center gap-1 group"
                                                >
                                                    {check.listing?.business_name}
                                                    <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                </Link>
                                                <div className="text-[10px] uppercase font-mono tracking-tighter text-gray-400">
                                                    ID: {check.listing?.id?.substring(0, 8)}
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="text-sm font-medium text-gray-700">
                                                {check.owner?.full_name || "Unassigned"}
                                            </div>
                                            <div className="text-xs text-gray-400">{check.owner?.email}</div>
                                        </TableCell>
                                        <TableCell className="text-sm text-gray-600">
                                            {format(new Date(check.sent_at), "MMM d, yyyy")}
                                        </TableCell>
                                        <TableCell>
                                            <div className="text-sm font-medium text-gray-900">
                                                {format(new Date(check.response_deadline), "MMM d, yyyy")}
                                            </div>
                                            <div className="text-[10px] text-gray-400 italic">
                                                {differenceInDays(new Date(check.response_deadline), new Date())} days remaining
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {getStatusBadge(check.status, check.response_deadline)}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" title="View Details">
                                                <RefreshCcw className="h-4 w-4 text-emerald-600" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Pagination */}
            <div className="flex items-center justify-between px-2">
                <p className="text-sm text-gray-500">
                    Showing <span className="font-bold text-gray-900">{checks.length}</span> of <span className="font-bold text-gray-900">{total}</span> verification checks
                </p>
                <div className="flex items-center gap-2">
                    <Button 
                        variant="outline" 
                        size="sm" 
                        className="h-8 w-8 p-0 border-gray-200" 
                        disabled={page === 1}
                        onClick={() => setPage(page - 1)}
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <div className="text-sm font-bold text-gray-900 w-8 text-center">{page}</div>
                    <Button 
                        variant="outline" 
                        size="sm" 
                        className="h-8 w-8 p-0 border-gray-200" 
                        disabled={page * 20 >= total}
                        onClick={() => setPage(page + 1)}
                    >
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        </div>
    );
}
