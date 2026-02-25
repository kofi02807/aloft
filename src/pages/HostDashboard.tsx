import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

interface Property {
    id: string;
    title: string;
    location: string;
    image_url: string;
    price: number;
    rating: number;
    host_subaccount_code: string | null;
    bookings: Booking[];
}

interface Booking {
    id: string;
    guest_name: string;
    check_in: string;
    check_out: string;
    guests: number;
    total_price: number;
    status: string;
    payment_reference: string;
    created_at: string;
}

const statusColors: Record<string, { bg: string; text: string }> = {
    confirmed: { bg: 'bg-green-50', text: 'text-green-700' },
    pending: { bg: 'bg-yellow-50', text: 'text-yellow-700' },
    cancelled: { bg: 'bg-red-50', text: 'text-red-500' },
};

const HostDashboard: React.FC = () => {
    const { user, loading: authLoading } = useAuth();
    const navigate = useNavigate();

    const [properties, setProperties] = useState<Property[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<string | null>(null); // property id for expanded view

    useEffect(() => {
        if (!authLoading && !user) navigate('/login');
    }, [user, authLoading, navigate]);

    useEffect(() => {
        if (!user) return;
        const fetchData = async () => {
            setLoading(true);
            setError(null);

            // Fetch host's properties
            const { data: props, error: propErr } = await supabase
                .from('properties')
                .select('id, title, location, image_url, price, rating, host_subaccount_code')
                .eq('host_user_id', user.id)
                .order('created_at', { ascending: false });

            if (propErr) { setError('Failed to load your listings.'); setLoading(false); return; }
            if (!props || props.length === 0) { setProperties([]); setLoading(false); return; }

            // Fetch all bookings for those properties
            const propertyIds = props.map(p => p.id);
            const { data: bookings, error: bookErr } = await supabase
                .from('bookings')
                .select('id, guest_name, check_in, check_out, guests, total_price, status, payment_reference, created_at, property_id')
                .in('property_id', propertyIds)
                .order('created_at', { ascending: false });

            if (bookErr) { setError('Failed to load bookings.'); setLoading(false); return; }

            // Merge bookings into each property
            const merged = props.map(p => ({
                ...p,
                bookings: (bookings ?? []).filter((b: any) => b.property_id === p.id),
            }));

            setProperties(merged as Property[]);
            if (merged.length > 0) setActiveTab(merged[0].id);
            setLoading(false);
        };

        fetchData();
    }, [user]);

    const formatDate = (d: string) =>
        new Date(d).toLocaleDateString('en-GH', { day: 'numeric', month: 'short', year: 'numeric' });

    const getNights = (ci: string, co: string) =>
        Math.max(1, Math.round((new Date(co).getTime() - new Date(ci).getTime()) / 86400000));

    // ── Summary stats ──────────────────────────────────────────────
    const totalRevenue = properties.reduce((sum, p) =>
        sum + p.bookings.filter(b => b.status === 'confirmed').reduce((s, b) => s + b.total_price, 0), 0);
    const totalBookings = properties.reduce((sum, p) => sum + p.bookings.length, 0);
    const activeListings = properties.length;
    const upcoming = properties.reduce((sum, p) =>
        sum + p.bookings.filter(b => b.status === 'confirmed' && new Date(b.check_in) > new Date()).length, 0);

    const activeProperty = properties.find(p => p.id === activeTab);

    // ── Loading ────────────────────────────────────────────────────
    if (authLoading || loading) {
        return (
            <div className="pt-32 flex justify-center items-center min-h-screen">
                <div className="flex flex-col items-center gap-3 text-gray-400">
                    <svg className="animate-spin w-8 h-8" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                    <span className="text-sm">Loading your dashboard...</span>
                </div>
            </div>
        );
    }

    // ── Empty state ────────────────────────────────────────────────
    if (properties.length === 0 && !error) {
        return (
            <div className="pt-32 pb-16 px-6 max-w-3xl mx-auto text-center">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-9 h-9 text-gray-400">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21" />
                    </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">No listings yet</h2>
                <p className="text-gray-500 mb-8">List your first property to start earning with Aloft.</p>
                <button
                    onClick={() => navigate('/rent')}
                    className="bg-action-blue text-white px-8 py-3 rounded-full font-semibold hover:bg-blue-700 transition-colors"
                >
                    List a property
                </button>
            </div>
        );
    }

    return (
        <div className="pt-24 pb-16 px-6 sm:px-8 lg:px-20 max-w-7xl mx-auto">

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-10">
                <div>
                    <h1 className="text-3xl font-bold text-main-text">Host Dashboard</h1>
                    <p className="text-gray-500 mt-1">Manage your listings and track your earnings</p>
                </div>
                <button
                    onClick={() => navigate('/rent')}
                    className="flex items-center gap-2 bg-action-blue text-white px-5 py-2.5 rounded-full font-semibold hover:bg-blue-700 transition-colors text-sm self-start sm:self-auto"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                    Add listing
                </button>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl p-4 mb-8">{error}</div>
            )}

            {/* Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
                {[
                    {
                        label: 'Total Earnings',
                        value: `GHS ${totalRevenue.toLocaleString()}`,
                        icon: (
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 0 1 3 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 0 0-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 0 1-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 0 0 3 15h-.75M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm3 0h.008v.008H18V10.5Zm-12 0h.008v.008H6V10.5Z" />
                            </svg>
                        ),
                        color: 'bg-green-50 text-green-700',
                    },
                    {
                        label: 'Total Bookings',
                        value: totalBookings,
                        icon: (
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
                            </svg>
                        ),
                        color: 'bg-blue-50 text-blue-700',
                    },
                    {
                        label: 'Active Listings',
                        value: activeListings,
                        icon: (
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 21v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21m0 0h4.5V3.545M12.75 21h7.5V10.75M2.25 21h1.5m18 0h-18M2.25 9l4.5-1.636M18.75 3l-1.5.545m0 6.205 3 1m1.5.5-1.5-.5M6.75 7.364V3h-3v18m3-13.636 10.5-3.819" />
                            </svg>
                        ),
                        color: 'bg-purple-50 text-purple-700',
                    },
                    {
                        label: 'Upcoming Stays',
                        value: upcoming,
                        icon: (
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                            </svg>
                        ),
                        color: 'bg-orange-50 text-orange-700',
                    },
                ].map(card => (
                    <div key={card.label} className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${card.color}`}>
                            {card.icon}
                        </div>
                        <p className="text-2xl font-bold text-gray-900">{card.value}</p>
                        <p className="text-xs text-gray-500 mt-1">{card.label}</p>
                    </div>
                ))}
            </div>

            {/* Property Tabs + Bookings */}
            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">

                {/* Tabs */}
                <div className="flex overflow-x-auto border-b border-gray-100 scrollbar-hide">
                    {properties.map(p => (
                        <button
                            key={p.id}
                            onClick={() => setActiveTab(p.id)}
                            className={`flex items-center gap-2.5 px-5 py-4 text-sm font-medium whitespace-nowrap transition-colors border-b-2 flex-shrink-0 ${activeTab === p.id
                                    ? 'border-action-blue text-action-blue bg-blue-50/40'
                                    : 'border-transparent text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                                }`}
                        >
                            <img src={p.image_url} alt={p.title} className="w-7 h-7 rounded-md object-cover" />
                            <span className="max-w-[140px] truncate">{p.title}</span>
                            <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${p.bookings.length > 0 ? 'bg-action-blue text-white' : 'bg-gray-100 text-gray-500'
                                }`}>
                                {p.bookings.length}
                            </span>
                        </button>
                    ))}
                </div>

                {/* Active Property Detail */}
                {activeProperty && (
                    <div className="p-6">
                        {/* Property Info Row */}
                        <div className="flex flex-col sm:flex-row gap-5 items-start mb-8 pb-6 border-b border-gray-100">
                            <img
                                src={activeProperty.image_url}
                                alt={activeProperty.title}
                                className="w-full sm:w-44 h-32 object-cover rounded-xl flex-shrink-0 cursor-pointer"
                                onClick={() => navigate(`/property/${activeProperty.id}`)}
                            />
                            <div className="flex-1">
                                <h2
                                    className="text-xl font-bold text-gray-900 mb-1 cursor-pointer hover:underline"
                                    onClick={() => navigate(`/property/${activeProperty.id}`)}
                                >
                                    {activeProperty.title}
                                </h2>
                                <p className="text-sm text-gray-500 flex items-center gap-1 mb-3">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3.5 h-3.5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
                                    </svg>
                                    {activeProperty.location}
                                </p>
                                <div className="flex flex-wrap gap-3">
                                    <span className="text-sm bg-gray-100 text-gray-700 font-medium px-3 py-1 rounded-full">
                                        GHS {activeProperty.price} / night
                                    </span>
                                    <span className={`text-sm px-3 py-1 rounded-full font-medium ${activeProperty.host_subaccount_code
                                            ? 'bg-green-50 text-green-700'
                                            : 'bg-yellow-50 text-yellow-700'
                                        }`}>
                                        {activeProperty.host_subaccount_code ? '✓ Payouts enabled' : '⚠ No payout account'}
                                    </span>
                                </div>
                            </div>
                            <div className="self-start sm:text-right">
                                <p className="text-xs text-gray-400 mb-0.5">Property earnings</p>
                                <p className="text-2xl font-bold text-gray-900">
                                    GHS {activeProperty.bookings
                                        .filter(b => b.status === 'confirmed')
                                        .reduce((s, b) => s + b.total_price, 0)
                                        .toLocaleString()}
                                </p>
                                <p className="text-xs text-gray-400">from {activeProperty.bookings.filter(b => b.status === 'confirmed').length} confirmed booking{activeProperty.bookings.filter(b => b.status === 'confirmed').length !== 1 ? 's' : ''}</p>
                            </div>
                        </div>

                        {/* Bookings Table */}
                        <h3 className="text-base font-semibold text-gray-800 mb-4">Bookings</h3>

                        {activeProperty.bookings.length === 0 ? (
                            <div className="text-center py-12 text-gray-400">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10 mx-auto mb-3 opacity-40">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
                                </svg>
                                <p className="text-sm">No bookings yet for this property</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto rounded-xl border border-gray-100">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="bg-gray-50 text-left text-xs text-gray-500 uppercase tracking-wider">
                                            <th className="px-4 py-3 font-semibold">Guest</th>
                                            <th className="px-4 py-3 font-semibold">Check-in</th>
                                            <th className="px-4 py-3 font-semibold">Check-out</th>
                                            <th className="px-4 py-3 font-semibold">Nights</th>
                                            <th className="px-4 py-3 font-semibold">Guests</th>
                                            <th className="px-4 py-3 font-semibold">Status</th>
                                            <th className="px-4 py-3 font-semibold text-right">Amount</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {activeProperty.bookings.map(booking => {
                                            const sc = statusColors[booking.status] ?? statusColors['confirmed'];
                                            const nights = getNights(booking.check_in, booking.check_out);
                                            return (
                                                <tr key={booking.id} className="hover:bg-gray-50/60 transition-colors">
                                                    <td className="px-4 py-3.5 font-medium text-gray-800">
                                                        <div>{booking.guest_name}</div>
                                                        <div className="text-xs text-gray-400 font-mono">{booking.payment_reference}</div>
                                                    </td>
                                                    <td className="px-4 py-3.5 text-gray-700">{formatDate(booking.check_in)}</td>
                                                    <td className="px-4 py-3.5 text-gray-700">{formatDate(booking.check_out)}</td>
                                                    <td className="px-4 py-3.5 text-gray-700">{nights}</td>
                                                    <td className="px-4 py-3.5 text-gray-700">{booking.guests}</td>
                                                    <td className="px-4 py-3.5">
                                                        <span className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-full capitalize ${sc.bg} ${sc.text}`}>
                                                            {booking.status}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3.5 text-right font-semibold text-gray-900">
                                                        GHS {booking.total_price.toLocaleString()}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default HostDashboard;
