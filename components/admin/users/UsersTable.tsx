"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
    Table, 
    TableBody, 
    TableCell, 
    TableHead, 
    TableHeader, 
    TableRow 
} from "@/components/ui/table";
import { 
    DropdownMenu, 
    DropdownMenuContent, 
    DropdownMenuItem, 
    DropdownMenuLabel, 
    DropdownMenuSeparator, 
    DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
    MoreHorizontal, 
    Search, 
    User, 
    Mail, 
    Phone, 
    ListFilter, 
    ExternalLink,
    Shield,
    ShieldAlert,
    Trash2,
    RefreshCw
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
    Select, 
    SelectContent, 
    SelectItem, 
    SelectTrigger, 
    SelectValue 
} from "@/components/ui/select";
import { format } from "date-fns";
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import { toast } from "react-hot-toast";

interface UserProfile {
    id: string;
    full_name: string | null;
    email: string;
    phone: string | null;
    is_active: boolean;
    created_at: string;
    avatar_url: string | null;
    listing_count: number;
    subscription_status: string | null;
    subscription_plan: string | null;
}

export default function UsersTable() {
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [total, setTotal] = useState(0);
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [status, setStatus] = useState("all");
    const [page, setPage] = useState(1);
    const limit = 10;

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const query = new URLSearchParams({
                page: page.toString(),
                limit: limit.toString(),
                search: search,
                status: status !== "all" ? status : "",
            });
            const res = await fetch(`/api/admin/users?${query}`);
            const data = await res.json();
            if (data.error) throw new Error(data.error);

            setUsers(data.data || []);
            setTotal(data.pagination?.total || 0);
            if (data.stats) setStats(data.stats);
        } catch (err: any) {
            toast.error(err.message || "Failed to fetch users");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, [page, status]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setPage(1);
        fetchUsers();
    };

    const toggleStatus = async (userId: string, currentStatus: boolean) => {
        try {
            const res = await fetch(`/api/admin/users/${userId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "toggle_active", is_active: !currentStatus }),
            });
            const data = await res.json();
            if (data.error) throw new Error(data.error);

            toast.success(`User ${!currentStatus ? 'activated' : 'deactivated'} successfully`);
            setUsers(users.map(u => u.id === userId ? { ...u, is_active: !currentStatus } : u));
        } catch (err: any) {
            toast.error(err.message || "Action failed");
        }
    };

    const deleteUser = async (userId: string, userName: string | null) => {
        if (!confirm(`Are you sure you want to permanently delete the account for "${userName || 'this user'}"? This action cannot be undone.`)) {
            return;
        }

        try {
            const res = await fetch(`/api/admin/users/${userId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "delete", listing_action: "delete" }),
            });
            const data = await res.json();
            if (data.error) throw new Error(data.error);

            toast.success("User account deleted successfully");
            setUsers(users.filter(u => u.id !== userId));
            setTotal(prev => prev - 1);
        } catch (err: any) {
            toast.error(err.message || "Deletion failed");
        }
    };

    const getInitials = (name: string | null) => {
        if (!name) return "??";
        return name.split(" ").map(n => n[0]).join("").toUpperCase().substring(0, 2);
    };

    return (
        <div className="space-y-6">
            {/* Stats Overview */}
            {stats && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                        <p className="text-sm text-gray-500 mb-1">Total Registered</p>
                        <p className="text-2xl font-bold">{stats.total}</p>
                    </div>
                    <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                        <p className="text-sm text-gray-500 mb-1">Registered This Month</p>
                        <p className="text-2xl font-bold text-blue-600">{stats.this_month}</p>
                    </div>
                    <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                        <p className="text-sm text-gray-500 mb-1">Active Subscriptions</p>
                        <p className="text-2xl font-bold text-emerald-600">{stats.with_subscriptions}</p>
                    </div>
                    <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                        <p className="text-sm text-gray-500 mb-1">Pending Listings</p>
                        <p className="text-2xl font-bold text-amber-500">{stats.with_pending}</p>
                    </div>
                </div>
            )}

            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between pb-2">
                <form onSubmit={handleSearch} className="relative w-full md:max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input 
                        placeholder="Search name, email, phone..." 
                        className="pl-10"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </form>

                <div className="flex items-center gap-3 w-full md:w-auto">
                    <Select value={status} onValueChange={setStatus}>
                        <SelectTrigger className="w-[180px]">
                            <ListFilter className="h-4 w-4 mr-2" />
                            <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Status</SelectItem>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="inactive">Inactive</SelectItem>
                        </SelectContent>
                    </Select>
                    
                    <Button variant="outline" size="icon" onClick={() => fetchUsers()}>
                        <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                    </Button>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                <Table>
                    <TableHeader className="bg-gray-50/50">
                        <TableRow>
                            <TableHead className="w-[80px]">Owner</TableHead>
                            <TableHead>Details</TableHead>
                            <TableHead>Contact</TableHead>
                            <TableHead className="text-center">Listings</TableHead>
                            <TableHead>Plans</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Registered</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading && users.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={8} className="h-64 text-center">
                                    <LoadingSpinner />
                                </TableCell>
                            </TableRow>
                        ) : users.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={8} className="h-64 text-center text-gray-500">
                                    No business owners found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            users.map((user) => (
                                <TableRow key={user.id} className="hover:bg-gray-50/50 transition-colors">
                                    <TableCell>
                                        <Avatar className="h-9 w-9 border border-gray-100">
                                            <AvatarImage src={user.avatar_url || ""} />
                                            <AvatarFallback className="bg-blue-50 text-blue-600 text-xs font-semibold">
                                                {getInitials(user.full_name)}
                                            </AvatarFallback>
                                        </Avatar>
                                    </TableCell>
                                    <TableCell>
                                        <div>
                                            <Link 
                                                href={`/admin/users/${user.id}`}
                                                className="font-semibold text-gray-900 hover:text-blue-600 transition-colors block"
                                            >
                                                {user.full_name || "Unnamed User"}
                                            </Link>
                                            <span className="text-xs text-gray-400 font-mono uppercase tracking-tighter">
                                                {user.id.substring(0, 8)}...
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="space-y-1">
                                            <div className="flex items-center text-sm text-gray-600">
                                                <Mail className="h-3 w-3 mr-2 opacity-50" />
                                                {user.email}
                                            </div>
                                            {user.phone && (
                                                <div className="flex items-center text-sm text-gray-600">
                                                    <Phone className="h-3 w-3 mr-2 opacity-50" />
                                                    {user.phone}
                                                </div>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-center font-medium">
                                        <Badge variant="outline" className="rounded-full">
                                            {user.listing_count}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        {user.subscription_plan ? (
                                            <Badge 
                                                className={`capitalize rounded-full ${
                                                    user.subscription_plan === 'premium' 
                                                        ? 'bg-purple-100 text-purple-700 hover:bg-purple-100' 
                                                        : 'bg-blue-100 text-blue-700 hover:bg-blue-100'
                                                }`}
                                            >
                                                {user.subscription_plan}
                                            </Badge>
                                        ) : (
                                            <span className="text-xs text-gray-400">—</span>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        {user.is_active ? (
                                            <Badge className="bg-emerald-50 text-emerald-700 hover:bg-emerald-50 border-emerald-200">
                                                Active
                                            </Badge>
                                        ) : (
                                            <Badge variant="destructive" className="bg-rose-50 text-rose-700 hover:bg-rose-50 border-rose-200">
                                                Inactive
                                            </Badge>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-sm text-gray-500">
                                        {format(new Date(user.created_at), "MMM d, yyyy")}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" className="h-8 w-8 p-0">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="w-48">
                                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                <DropdownMenuItem asChild>
                                                    <Link href={`/admin/users/${user.id}`} className="cursor-pointer">
                                                        <User className="mr-2 h-4 w-4" /> View Profile
                                                    </Link>
                                                </DropdownMenuItem>
                                                <DropdownMenuItem>
                                                    <Mail className="mr-2 h-4 w-4" /> Send Email
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem onClick={() => toggleStatus(user.id, user.is_active)}>
                                                    {user.is_active ? (
                                                        <><ShieldAlert className="mr-2 h-4 w-4 text-rose-600" /> Deactivate Account</>
                                                    ) : (
                                                        <><Shield className="mr-2 h-4 w-4 text-emerald-600" /> Activate Account</>
                                                    )}
                                                </DropdownMenuItem>
                                                <DropdownMenuItem 
                                                    className="text-rose-600 focus:bg-rose-50 focus:text-rose-600" 
                                                    onClick={() => deleteUser(user.id, user.full_name)}
                                                >
                                                    <Trash2 className="mr-2 h-4 w-4" /> Delete Account
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Pagination */}
            {total > limit && (
                <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-500">
                        Showing {(page - 1) * limit + 1} to {Math.min(page * limit, total)} of {total} users
                    </p>
                    <div className="flex gap-2">
                        <Button 
                            variant="outline" 
                            size="sm" 
                            disabled={page === 1}
                            onClick={() => setPage(page - 1)}
                        >
                            Previous
                        </Button>
                        <Button 
                            variant="outline" 
                            size="sm"
                            disabled={page * limit >= total}
                            onClick={() => setPage(page + 1)}
                        >
                            Next
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
