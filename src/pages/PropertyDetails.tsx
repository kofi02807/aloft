import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

// Define a type for your property data if not importing
interface Property {
    id: number;
    title: string;
    location: string;
    rating: number;
    price: number;
    image_url: string;
    images?: string[];
    description: string;
    amenities: string[];
    isGuestFavorite?: boolean;
}

const PropertyDetails: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [property, setProperty] = useState<Property | null>(null);
    const [loading, setLoading] = useState(true);
    const [bookedRanges, setBookedRanges] = useState<{ check_in: string; check_out: string }[]>([]);
    const [dateConflict, setDateConflict] = useState(false);

    useEffect(() => {
        const fetchProperty = async () => {
            if (!id) {
                setLoading(false);
                return;
            }
            const { data, error } = await supabase
                .from('properties')
                .select('*')
                .eq('id', id)
                .single();

            if (error) {
                console.error('Error fetching property:', error);
                setProperty(null); // Ensure property is null on error
            } else {
                setProperty(data as Property); // Cast data to Property type
            }
            setLoading(false);
        };

        fetchProperty();
    }, [id]);

    // Fetch all confirmed bookings for this property
    useEffect(() => {
        if (!id) return;
        const fetchBookedDates = async () => {
            const { data } = await supabase
                .from('bookings')
                .select('check_in, check_out')
                .eq('property_id', id)
                .eq('status', 'confirmed');
            if (data) setBookedRanges(data);
        };
        fetchBookedDates();
    }, [id]);

    const [checkIn, setCheckIn] = useState('');
    const [checkOut, setCheckOut] = useState('');
    const [guests, setGuests] = useState(1);

    const today = new Date().toISOString().split('T')[0];

    // Check if selected dates overlap any confirmed booking
    const hasConflict = (ci: string, co: string) => {
        if (!ci || !co) return false;
        const newIn = new Date(ci).getTime();
        const newOut = new Date(co).getTime();
        return bookedRanges.some(({ check_in, check_out }) => {
            const bookedIn = new Date(check_in).getTime();
            const bookedOut = new Date(check_out).getTime();
            return newIn < bookedOut && newOut > bookedIn;
        });
    };

    const handleCheckIn = (val: string) => {
        setCheckIn(val);
        setCheckOut(''); // reset checkout when checkin changes
        setDateConflict(false);
    };

    const handleCheckOut = (val: string) => {
        setCheckOut(val);
        setDateConflict(hasConflict(checkIn, val));
    };

    if (loading) {
        return <div className="pt-32 text-center text-xl">Loading details...</div>;
    }

    if (!property) {
        return <div className="pt-32 text-center text-xl">Property not found</div>;
    }

    // Calculate nights and total
    const calculateTotal = () => {
        if (!checkIn || !checkOut) return 0;
        const start = new Date(checkIn);
        const end = new Date(checkOut);
        const diffTime = Math.abs(end.getTime() - start.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays > 0 ? diffDays * property.price : 0;
    };

    const total = calculateTotal();
    const nights = total / property.price;
    const cleaningFee = 50;
    const serviceFee = 35;
    const grandTotal = total > 0 ? total + cleaningFee + serviceFee : 0;

    // Prepare images for grid
    const displayImages = property.images && property.images.length > 0
        ? property.images
        : [property.image_url];

    // Ensure we always have at least 1 image
    if (displayImages.length === 0 && property.image_url) {
        displayImages.push(property.image_url);
    }

    return (
        <div className="pt-24 pb-12 px-6 sm:px-8 lg:px-20 max-w-7xl mx-auto">
            {/* Title & Location */}
            <h1 className="text-3xl font-bold text-main-text mb-2">{property.title}</h1>
            <div className="flex items-center gap-2 text-sm font-medium underline mb-6">
                <span className="flex items-center gap-1">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                        <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006Z" clipRule="evenodd" />
                    </svg>
                    {property.rating}
                </span>
                <span>·</span>
                <span className="text-gray-700">{property.location}</span>
            </div>

            {/* Photo Gallery - Grid of 5 */}
            <div className="grid grid-cols-4 grid-rows-2 gap-2 h-[400px] md:h-[500px] rounded-2xl overflow-hidden mb-12">
                {/* Main Image (First one) */}
                <div className="col-span-2 row-span-2 relative">
                    <img
                        src={displayImages[0]}
                        alt={property.title}
                        className="w-full h-full object-cover hover:opacity-95 transition-opacity cursor-pointer"
                    />
                </div>

                {/* Secondary Images (Next 4) */}
                {[1, 2, 3, 4].map((index) => (
                    <div key={index} className="bg-gray-200 relative">
                        {displayImages[index] ? (
                            <img
                                src={displayImages[index]}
                                alt={`Detail ${index}`}
                                className="w-full h-full object-cover hover:opacity-95 transition-opacity cursor-pointer"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400">
                                {/* Empty placeholder handled by gray bg */}
                            </div>
                        )}

                        {/* Show "Show all photos" button on the last grid item */}
                        {index === 4 && (
                            <button className="absolute bottom-4 right-4 bg-white border border-black px-3 py-1.5 rounded-lg text-sm font-semibold shadow-sm hover:bg-gray-50">
                                Show all photos
                            </button>
                        )}
                    </div>
                ))}
            </div>

            {/* Content Layout */}
            <div className="flex flex-col md:flex-row gap-16">

                {/* Left Column: Info */}
                <div className="md:w-2/3">
                    <div className="border-b border-gray-200 pb-8 mb-8">
                        <h2 className="text-2xl font-semibold mb-1">Entire place hosted by Host</h2>
                        <p className="text-gray-600">2 guests · 1 bedroom · 1 bed · 1 bath</p>
                    </div>

                    <div className="border-b border-gray-200 pb-8 mb-8">
                        <div className="flex items-start gap-4 mb-6">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 mt-1">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                            </svg>
                            <div>
                                <h3 className="font-semibold text-lg">Self check-in</h3>
                                <p className="text-gray-500">Check yourself in with the keypad.</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-4">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 mt-1">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
                            </svg>
                            <div>
                                <h3 className="font-semibold text-lg">Great location</h3>
                                <p className="text-gray-500">95% of recent guests gave the location a 5-star rating.</p>
                            </div>
                        </div>
                    </div>

                    <div className="border-b border-gray-200 pb-8 mb-8">
                        <p className="text-gray-800 leading-relaxed text-lg">
                            {property.description}
                        </p>
                    </div>

                    <div className="mb-12">
                        <h2 className="text-2xl font-semibold mb-6">What this place offers</h2>
                        <div className="grid grid-cols-2 gap-y-4">
                            {property.amenities.map((amenity, index) => (
                                <div key={index} className="flex items-center gap-3 text-gray-700">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                                    </svg>
                                    <span>{amenity}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right Column: Sticky Booking Widget */}
                <div className="md:w-1/3 relative">
                    <div className="sticky top-28 border border-gray-200 rounded-xl shadow-xl p-6 bg-white">
                        <div className="flex justify-between items-end mb-6">
                            <div className="flex items-baseline gap-1">
                                <span className="text-2xl font-bold">GHS {property.price}</span>
                                <span className="text-gray-600">night</span>
                            </div>
                            <div className="flex items-center gap-1 text-sm">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5">
                                    <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006Z" clipRule="evenodd" />
                                </svg>
                                <span className="font-semibold">{property.rating}</span>
                                <span className="text-gray-500">·</span>
                                <span className="text-gray-500 underline">Reviews</span>
                            </div>
                        </div>

                        <div className="border border-gray-400 rounded-lg overflow-hidden mb-4">
                            <div className="grid grid-cols-2 border-b border-gray-400">
                                <div className="p-3 border-r border-gray-400">
                                    <label className="block text-[10px] font-bold uppercase text-gray-700">Check-in</label>
                                    <input
                                        type="date"
                                        value={checkIn}
                                        min={today}
                                        onChange={(e) => handleCheckIn(e.target.value)}
                                        className="w-full text-sm outline-none text-gray-700 placeholder-gray-400 cursor-pointer"
                                    />
                                </div>
                                <div className="p-3">
                                    <label className="block text-[10px] font-bold uppercase text-gray-700">Check-out</label>
                                    <input
                                        type="date"
                                        value={checkOut}
                                        min={checkIn || today}
                                        onChange={(e) => handleCheckOut(e.target.value)}
                                        className="w-full text-sm outline-none text-gray-700 placeholder-gray-400 cursor-pointer"
                                    />
                                </div>
                            </div>
                            <div className="p-3">
                                <label className="block text-[10px] font-bold uppercase text-gray-700">Guests</label>
                                <select
                                    value={guests}
                                    onChange={(e) => setGuests(Number(e.target.value))}
                                    className="w-full text-sm outline-none text-gray-700 cursor-pointer bg-white"
                                >
                                    <option value={1}>1 guest</option>
                                    <option value={2}>2 guests</option>
                                    <option value={3}>3 guests</option>
                                    <option value={4}>4 guests</option>
                                </select>
                            </div>
                        </div>

                        {/* Date conflict warning */}
                        {dateConflict && (
                            <div className="mb-4 bg-red-50 border border-red-200 rounded-lg px-4 py-3 flex items-start gap-2">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
                                </svg>
                                <p className="text-sm text-red-600 font-medium">
                                    These dates are already booked. Please select different dates.
                                </p>
                            </div>
                        )}

                        <button
                            onClick={() => {
                                if (total > 0 && !dateConflict) {
                                    navigate('/checkout', {
                                        state: { property, checkIn, checkOut, guests, total, nights, cleaningFee, serviceFee, grandTotal }
                                    });
                                } else if (dateConflict) {
                                    // do nothing — warning already shown
                                } else {
                                    alert('Please select valid dates');
                                }
                            }}
                            disabled={dateConflict}
                            className={`w-full py-3.5 rounded-lg font-bold text-lg transition-colors mb-4 ${dateConflict
                                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                    : 'bg-action-blue text-white hover:bg-blue-700'
                                }`}
                        >
                            {dateConflict ? 'Dates unavailable' : 'Reserve'}
                        </button>

                        <p className="text-center text-sm text-gray-500 mb-6 font-light">You won't be charged yet</p>

                        {total > 0 && (
                            <div className="flex flex-col gap-3 text-gray-600">
                                <div className="flex justify-between underline">
                                    <span>GHS {property.price} x {nights} nights</span>
                                    <span>GHS {total}</span>
                                </div>
                                <div className="flex justify-between underline">
                                    <span>Cleaning fee</span>
                                    <span>GHS {cleaningFee}</span>
                                </div>
                                <div className="flex justify-between underline">
                                    <span>Service fee</span>
                                    <span>GHS {serviceFee}</span>
                                </div>
                                <div className="border-t border-gray-200 pt-4 flex justify-between font-bold text-gray-900 text-lg">
                                    <span>Total before taxes</span>
                                    <span>GHS {grandTotal}</span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PropertyDetails;
