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
    Bell, 
    User, 
    Users, 
    Clock, 
    ChevronLeft, 
    ChevronRight,
    Megaphone,
    Mail,
    Filter,
    Loader2
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "react-hot-toast";
import SendNotificationModal from "./SendNotificationModal";

export default function AdminNotificationsList() {
    const [notifications, setNotifications] = useState<any[]>([]);
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [type, setType] = useState("all");
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isMarkingRead, setIsMarkingRead] = useState(false);

    const fetchNotifications = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/admin/notifications?type=${type === 'all' ? '' : type}&page=${page}`);
            const data = await res.json();
            if (data.error) throw new Error(data.error);
            setNotifications(data.notifications || []);
            setTotal(data.pagination?.total || 0);
            setStats(data.stats || { 
                total_sent: data.pagination?.total || 0, 
                unread_count: data.unread_count || 0, 
                broadcast_count: data.broadcast_count || 0 
            });
        } catch (err: any) {
            toast.error(err.message || "Failed to fetch notifications");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNotifications();
    }, [type, page]);

    const markAllAsRead = async () => {
        setIsMarkingRead(true);
        try {
            const res = await fetch("/api/notifications/read-all", { method: "PATCH" });
            const data = await res.json();
            if (data.error) throw new Error(data.error);
            
            toast.success("All notifications marked as read");
            window.dispatchEvent(new Event("admin_notifications_read"));
            fetchNotifications();
        } catch (err: any) {
            toast.error(err.message || "Failed to mark notifications as read");
        } finally {
            setIsMarkingRead(false);
        }
    };

    const getTypeBadge = (type: string) => {
        switch (type) {
            case 'system':
                return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-100">System</Badge>;
            case 'annual_check':
                return <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-100">Annual Check</Badge>;
            case 'payment_confirmed':
            case 'payment_verified':
                return <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-100">Payment</Badge>;
            case 'payment_rejected':
                return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-100">Payment Rejected</Badge>;
            case 'new_payment_uploaded':
                return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-100">New Payment</Badge>;
            case 'broadcast':
                return <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-100 flex items-center gap-1"><Megaphone className="h-3 w-3" /> Broadcast</Badge>;
            case 'new_listing_submitted':
                return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-100">New Listing Submitted</Badge>;
            case 'new_claim_request':
                return <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-100">New Claim Request</Badge>;
            case 'top_search_assigned':
            case 'top_search_removed':
                return <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-100 flex items-center gap-1 w-fit whitespace-nowrap"><Search className="h-3 w-3" /> Top Search</Badge>;
            case 'listing_approved':
            case 'listing_rejected':
            case 'claim_approved':
            case 'claim_rejected':
                return <Badge variant="outline" className="bg-slate-50 text-slate-700 border-slate-100 capitalize">{type.split('_').join(' ')}</Badge>;
            default:
                return <Badge variant="outline" className="capitalize">{type.split('_').join(' ')}</Badge>;
        }
    };

    return (
        <div className="space-y-6">
            {/* Stats Overview */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card className="border-gray-200 shadow-sm overflow-hidden border-l-4 border-l-indigo-600">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-bold uppercase tracking-wider text-gray-500">Total Sent</CardTitle>
                        <Bell className="h-4 w-4 text-indigo-600" />
                    </CardHeader>
                    <CardContent className="pt-2">
                        <div className="text-3xl font-black text-gray-900">{stats?.total_sent || 0}</div>
                        <p className="text-xs text-gray-400 mt-1">Total system notifications</p>
                    </CardContent>
                </Card>

                <Card className="border-gray-200 shadow-sm overflow-hidden border-l-4 border-l-orange-500">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-bold uppercase tracking-wider text-gray-500">Unread by Users</CardTitle>
                        <Clock className="h-4 w-4 text-orange-500" />
                    </CardHeader>
                    <CardContent className="pt-2">
                        <div className="text-3xl font-black text-gray-900">{stats?.unread_count || 0}</div>
                        <p className="text-xs text-gray-400 mt-1">Notifications waiting to be seen</p>
                    </CardContent>
                </Card>

                <Card className="border-gray-200 shadow-sm overflow-hidden border-l-4 border-l-emerald-500">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-bold uppercase tracking-wider text-gray-500">Active Broadcasters</CardTitle>
                        <Megaphone className="h-4 w-4 text-emerald-500" />
                    </CardHeader>
                    <CardContent className="pt-2">
                        <div className="text-3xl font-black text-gray-900">{stats?.broadcast_count || 0}</div>
                        <p className="text-xs text-gray-400 mt-1">Recent platform-wide alerts</p>
                    </CardContent>
                </Card>
            </div>

            {/* Actions */}
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                    <Select value={type} onValueChange={(val) => { setType(val); setPage(1); }}>
                        <SelectTrigger className="w-[200px] h-10 border-gray-200">
                            <Filter className="h-3.5 w-3.5 mr-2 text-gray-400" />
                            <SelectValue placeholder="Type Filter" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Types</SelectItem>
                            <SelectItem value="system">System</SelectItem>
                            <SelectItem value="broadcast">Broadcast</SelectItem>
                            <SelectItem value="annual_check">Annual Check</SelectItem>
                            <SelectItem value="payment_verified">Payment Verified</SelectItem>
                            <SelectItem value="payment_rejected">Payment Rejected</SelectItem>
                            <SelectItem value="new_payment_uploaded">New Payment</SelectItem>
                            <SelectItem value="new_listing_submitted">New Listing Submitted</SelectItem>
                            <SelectItem value="new_claim_request">New Claim Request</SelectItem>
                            <SelectItem value="listing_approved">Listing Approved</SelectItem>
                            <SelectItem value="listing_rejected">Listing Rejected</SelectItem>
                            <SelectItem value="claim_approved">Claim Approved</SelectItem>
                            <SelectItem value="claim_rejected">Claim Rejected</SelectItem>
                            <SelectItem value="top_search_assigned">Top Search Assigned</SelectItem>
                            <SelectItem value="top_search_removed">Top Search Removed</SelectItem>
                            <SelectItem value="top_search_expiring">Top Search Expiring</SelectItem>
                            <SelectItem value="subscription_expiring">Subscription Expiring</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="flex items-center gap-3">
                    {stats?.unread_count > 0 && (
                        <Button 
                            variant="outline"
                            onClick={markAllAsRead}
                            disabled={isMarkingRead}
                            className="h-10 border-gray-200 text-gray-600 hover:bg-gray-50 bg-white shadow-sm"
                        >
                            {isMarkingRead ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <Bell className="mr-2 h-4 w-4 text-gray-400" />
                            )}
                            Mark All Read
                        </Button>
                    )}
                    <Button 
                        onClick={() => setIsModalOpen(true)}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2 shadow-lg shadow-indigo-100 h-10 px-6 font-bold"
                    >
                        <Megaphone className="h-4 w-4" />
                        Send New Notification
                    </Button>
                </div>
            </div>

            {/* List */}
            <Card className="border-gray-200 shadow-sm overflow-hidden">
                <CardContent className="p-0">
                    <Table>
                        <TableHeader className="bg-gray-50/50">
                            <TableRow>
                                <TableHead className="w-[300px]">Notification Content</TableHead>
                                <TableHead>Recipient</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Created At</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <TableRow key={i} className="animate-pulse">
                                        <TableCell><div className="h-4 w-full bg-gray-100 rounded" /></TableCell>
                                        <TableCell><div className="h-4 w-32 bg-gray-100 rounded" /></TableCell>
                                        <TableCell><div className="h-4 w-20 bg-gray-100 rounded" /></TableCell>
                                        <TableCell><div className="h-4 w-16 bg-gray-100 rounded" /></TableCell>
                                        <TableCell><div className="h-4 w-24 bg-gray-100 rounded" /></TableCell>
                                    </TableRow>
                                ))
                            ) : notifications.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-48 text-center text-gray-500 italic">
                                        No notifications found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                notifications.map((notif) => (
                                    <TableRow key={notif.id} className="hover:bg-gray-50/30 transition-colors">
                                        <TableCell>
                                            <div className="space-y-1 py-1">
                                                <div className="font-bold text-gray-900 leading-tight">{notif.title}</div>
                                                <p className="text-xs text-gray-500 line-clamp-1">{notif.message}</p>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {notif.user ? (
                                                <div className="flex items-center gap-2">
                                                    <div className="h-7 w-7 bg-gray-100 rounded-full flex items-center justify-center">
                                                        <User className="h-3.5 w-3.5 text-gray-400" />
                                                    </div>
                                                    <div className="text-xs">
                                                        <div className="font-bold text-gray-700">{notif.user.full_name || "User"}</div>
                                                        <div className="text-gray-400">{notif.user.email}</div>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-2 text-indigo-600 font-bold text-xs capitalize">
                                                    <Users className="h-3.5 w-3.5" />
                                                    Broadcast
                                                </div>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {getTypeBadge(notif.type)}
                                        </TableCell>
                                        <TableCell>
                                            {notif.is_read ? (
                                                <Badge className="bg-gray-50 text-gray-400 hover:bg-gray-50 border-gray-100 font-medium text-[10px]">Read</Badge>
                                            ) : (
                                                <Badge className="bg-orange-50 text-orange-600 hover:bg-orange-50 border-orange-100 font-bold text-[10px] animate-pulse">Unread</Badge>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-xs text-gray-400">
                                            {format(new Date(notif.created_at), "MMM d, yyyy · HH:mm")}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Pagination */}
            <div className="flex items-center justify-between px-2 pb-6">
                <p className="text-sm text-gray-500">
                    Showing <span className="font-bold text-gray-900">{notifications.length}</span> of <span className="font-bold text-gray-900">{total}</span> notifications
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
                        disabled={page * 50 >= total}
                        onClick={() => setPage(page + 1)}
                    >
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            <SendNotificationModal 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)} 
                onSuccess={fetchNotifications}
            />
        </div>
    );
}
