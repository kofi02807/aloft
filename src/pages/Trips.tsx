import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

interface Booking {
    id: string;
    check_in: string;
    check_out: string;
    guests: number;
    total_price: number;
    status: string;
    payment_reference: string;
    created_at: string;
    property: {
        id: string;
        title: string;
        location: string;
        image_url: string;
        price: number;
    };
}

const statusColors: Record<string, { bg: string; text: string; label: string }> = {
    confirmed: { bg: 'bg-green-50', text: 'text-green-700', label: 'Confirmed' },
    pending: { bg: 'bg-yellow-50', text: 'text-yellow-700', label: 'Pending' },
    cancelled: { bg: 'bg-red-50', text: 'text-red-600', label: 'Cancelled' },
};

const Trips: React.FC = () => {
    const { user, loading: authLoading } = useAuth();
    const navigate = useNavigate();
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!authLoading && !user) {
            navigate('/login');
        }
    }, [user, authLoading, navigate]);

    useEffect(() => {
        if (!user) return;

        const fetchBookings = async () => {
            setLoading(true);
            setError(null);

            const { data, error } = await supabase
                .from('bookings')
                .select(`
                    id,
                    check_in,
                    check_out,
                    guests,
                    total_price,
                    status,
                    payment_reference,
                    created_at,
                    property:property_id (
                        id,
                        title,
                        location,
                        image_url,
                        price
                    )
                `)
                .eq('guest_user_id', user.id)
                .order('created_at', { ascending: false });

            if (error) {
                setError('Failed to load your trips. Please try again.');
                console.error(error);
            } else {
                setBookings(data as unknown as Booking[]);
            }
            setLoading(false);
        };

        fetchBookings();
    }, [user]);

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('en-GH', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        });
    };

    const getNights = (checkIn: string, checkOut: string) => {
        const diff = new Date(checkOut).getTime() - new Date(checkIn).getTime();
        return Math.round(diff / (1000 * 60 * 60 * 24));
    };

    const isUpcoming = (checkIn: string) => new Date(checkIn) > new Date();

    if (authLoading || loading) {
        return (
            <div className="pt-32 flex justify-center items-center min-h-screen">
                <div className="flex flex-col items-center gap-3 text-gray-400">
                    <svg className="animate-spin w-8 h-8" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                    <span className="text-sm">Loading your trips...</span>
                </div>
            </div>
        );
    }

    const upcoming = bookings.filter(b => isUpcoming(b.check_in) && b.status !== 'cancelled');
    const past = bookings.filter(b => !isUpcoming(b.check_in) || b.status === 'cancelled');

    return (
        <div className="pt-28 pb-16 px-6 sm:px-8 lg:px-20 max-w-5xl mx-auto">
            <h1 className="text-3xl font-bold mb-2 text-main-text">My Trips</h1>
            <p className="text-gray-500 mb-10">Your upcoming and past stays</p>

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl p-4 mb-8">
                    {error}
                </div>
            )}

            {bookings.length === 0 && !error && (
                <div className="flex flex-col items-center justify-center py-24 text-center">
                    <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-6">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-9 h-9 text-gray-400">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 21v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21m0 0h4.5V3.545M12.75 21h7.5V10.75M2.25 21h1.5m18 0h-18M2.25 9l4.5-1.636M18.75 3l-1.5.545m0 6.205 3 1m1.5.5-1.5-.5M6.75 7.364V3h-3v18m3-13.636 10.5-3.819" />
                        </svg>
                    </div>
                    <h2 className="text-xl font-semibold text-gray-800 mb-2">No trips yet</h2>
                    <p className="text-gray-500 max-w-sm mb-6">
                        When you book a stay, it'll show up here. Start exploring properties today.
                    </p>
                    <button
                        onClick={() => navigate('/')}
                        className="bg-action-blue text-white px-6 py-3 rounded-full font-semibold hover:bg-blue-700 transition-colors"
                    >
                        Explore properties
                    </button>
                </div>
            )}

            {/* Upcoming Trips */}
            {upcoming.length > 0 && (
                <section className="mb-12">
                    <h2 className="text-xl font-semibold mb-5 flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-green-500 inline-block"></span>
                        Upcoming
                    </h2>
                    <div className="flex flex-col gap-5">
                        {upcoming.map(booking => (
                            <BookingCard key={booking.id} booking={booking} formatDate={formatDate} getNights={getNights} navigate={navigate} />
                        ))}
                    </div>
                </section>
            )}

            {/* Past Trips */}
            {past.length > 0 && (
                <section>
                    <h2 className="text-xl font-semibold mb-5 flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-gray-400 inline-block"></span>
                        Past trips
                    </h2>
                    <div className="flex flex-col gap-5">
                        {past.map(booking => (
                            <BookingCard key={booking.id} booking={booking} formatDate={formatDate} getNights={getNights} navigate={navigate} />
                        ))}
                    </div>
                </section>
            )}
        </div>
    );
};

interface BookingCardProps {
    booking: Booking;
    formatDate: (d: string) => string;
    getNights: (ci: string, co: string) => number;
    navigate: ReturnType<typeof useNavigate>;
}

const BookingCard: React.FC<BookingCardProps> = ({ booking, formatDate, getNights, navigate }) => {
    const nights = getNights(booking.check_in, booking.check_out);
    const status = statusColors[booking.status] ?? statusColors['confirmed'];

    return (
        <div
            className="flex flex-col sm:flex-row bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden cursor-pointer"
            onClick={() => navigate(`/property/${booking.property?.id}`)}
        >
            {/* Image */}
            <div className="sm:w-52 h-44 sm:h-auto flex-shrink-0">
                <img
                    src={booking.property?.image_url}
                    alt={booking.property?.title}
                    className="w-full h-full object-cover"
                />
            </div>

            {/* Details */}
            <div className="flex-1 p-5 flex flex-col justify-between gap-3">
                <div>
                    <div className="flex items-start justify-between gap-2 mb-1">
                        <h3 className="font-semibold text-gray-900 text-lg leading-tight">
                            {booking.property?.title}
                        </h3>
                        <span className={`text-xs font-semibold px-3 py-1 rounded-full flex-shrink-0 ${status.bg} ${status.text}`}>
                            {status.label}
                        </span>
                    </div>
                    <p className="text-sm text-gray-500 flex items-center gap-1">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3.5 h-3.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
                        </svg>
                        {booking.property?.location}
                    </p>
                </div>

                <div className="flex flex-wrap gap-4 text-sm text-gray-700">
                    <div>
                        <p className="text-xs text-gray-400 mb-0.5">Check-in</p>
                        <p className="font-medium">{formatDate(booking.check_in)}</p>
                    </div>
                    <div>
                        <p className="text-xs text-gray-400 mb-0.5">Check-out</p>
                        <p className="font-medium">{formatDate(booking.check_out)}</p>
                    </div>
                    <div>
                        <p className="text-xs text-gray-400 mb-0.5">Duration</p>
                        <p className="font-medium">{nights} night{nights !== 1 ? 's' : ''}</p>
                    </div>
                    <div>
                        <p className="text-xs text-gray-400 mb-0.5">Guests</p>
                        <p className="font-medium">{booking.guests}</p>
                    </div>
                </div>

                <div className="flex items-center justify-between border-t border-gray-100 pt-3 mt-1">
                    <p className="text-sm text-gray-500">
                        Ref: <span className="font-mono text-xs">{booking.payment_reference}</span>
                    </p>
                    <p className="font-bold text-gray-900">GHS {booking.total_price.toLocaleString()}</p>
                </div>
            </div>
        </div>
    );
};

export default Trips;
