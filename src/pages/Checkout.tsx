import React, { useState } from 'react';
import { usePaystackPayment } from 'react-paystack';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

import { supabase } from '../lib/supabase';

const Checkout: React.FC = () => {
    const { state } = useLocation();
    const navigate = useNavigate();
    const [paymentMethod, setPaymentMethod] = useState<'card' | 'momo'>('card');
    const [network, setNetwork] = useState('MTN');
    const [loading, setLoading] = useState(false);

    const { user, loading: authLoading } = useAuth();

    // Fallback if accessed directly without state
    if (!state) {
        return (
            <div className="pt-32 text-center">
                <h2 className="text-xl font-semibold">No booking details found.</h2>
                <button
                    onClick={() => navigate('/')}
                    className="mt-4 text-action-blue underline"
                >
                    Return Home
                </button>
            </div>
        );
    }

    // Redirect if not logged in
    React.useEffect(() => {
        if (!authLoading && !user) {
            navigate('/login', { state: { from: location } });
        }
    }, [user, authLoading, navigate, location]);

    if (authLoading || !user) {
        return <div className="pt-32 text-center">Loading...</div>;
    }

    const { property, checkIn, checkOut, guests, total, nights, cleaningFee, serviceFee, grandTotal } = state;

    const hasSubaccount = Boolean(property.host_subaccount_code);

    const config = {
        reference: (new Date()).getTime().toString(),
        email: user.email || "user@example.com",
        amount: Math.round(grandTotal * 100), // Paystack uses pesewas
        publicKey: import.meta.env.VITE_PAYSTACK_PUBLIC_KEY as string,
        currency: 'GHS',
        ...(hasSubaccount && {
            split: {
                type: "percentage",
                bearer_type: "account",
                subaccounts: [
                    {
                        subaccount: property.host_subaccount_code,
                        share: 90,  // Host receives 90%
                    }
                ]
            }
        })
    };

    // Initialize Paystack hook
    const initializePayment = usePaystackPayment(config);

    const onSuccess = async (reference: any) => {
        setLoading(true);
        console.log("Payment success:", reference);

        // ── Server-side conflict guard ──────────────────────────────
        const { data: conflicts } = await supabase
            .from('bookings')
            .select('id')
            .eq('property_id', property.id)
            .eq('status', 'confirmed')
            .lt('check_in', checkOut)
            .gt('check_out', checkIn);

        if (conflicts && conflicts.length > 0) {
            alert('Sorry — these dates were just booked by someone else. Please go back and select different dates.');
            setLoading(false);
            navigate(`/property/${property.id}`);
            return;
        }
        // ───────────────────────────────────────────────────────────

        const { error } = await supabase
            .from('bookings')
            .insert([{
                property_id: property.id,
                guest_name: user.email ?? 'Guest User',
                guest_user_id: user.id,
                check_in: checkIn,
                check_out: checkOut,
                guests: guests,
                total_price: grandTotal,
                status: 'confirmed',
                payment_reference: reference.reference
            }]);

        if (error) {
            console.error('Error creating booking:', error);
            alert('Payment successful, but booking failed to save. Please contact support.');
            setLoading(false);
            return;
        }

        // ── Send emails via Edge Function (best-effort) ─────────────
        try {
            // Fetch host email from their user profile
            let hostEmail: string | null = null;
            if (property.host_user_id) {
                const { data: hostProfile } = await supabase
                    .from('profiles')
                    .select('email')
                    .eq('id', property.host_user_id)
                    .single();
                hostEmail = hostProfile?.email ?? null;
            }

            await supabase.functions.invoke('send-booking-email', {
                body: {
                    guestEmail: user.email,
                    hostEmail,
                    propertyTitle: property.title,
                    propertyLocation: property.location,
                    checkIn,
                    checkOut,
                    nights,
                    guests,
                    grandTotal,
                    paymentReference: reference.reference,
                },
            });
        } catch (emailErr) {
            // Email failure should not block the user — booking is already saved
            console.warn('Email notification failed (non-critical):', emailErr);
        }
        // ───────────────────────────────────────────────────────────

        navigate('/trips', { state: { bookingSuccess: true } });
        setLoading(false);
    };

    const onClose = () => {
        alert('Payment cancelled');
        setLoading(false);
    };

    const handlePayment = () => {
        if (paymentMethod === 'card' || paymentMethod === 'momo') {
            // Check if key is set
            if (!import.meta.env.VITE_PAYSTACK_PUBLIC_KEY || import.meta.env.VITE_PAYSTACK_PUBLIC_KEY.includes('xxxx')) {
                alert('Paystack Public Key is not set in .env file!');
                return;
            }
            initializePayment({ onSuccess, onClose });
        } else {
            alert("Please select a payment method");
        }
    };

    return (
        <div className="pt-28 pb-12 px-6 sm:px-8 lg:px-20 max-w-7xl mx-auto">
            <h1 className="text-3xl font-bold mb-10 text-main-text flex items-center gap-3">
                <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-full">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
                    </svg>
                </button>
                Confirm and Pay
            </h1>

            <div className="flex flex-col md:flex-row gap-16">

                {/* Left Column: Payment Details */}
                <div className="md:w-1/2">
                    <h2 className="text-xl font-semibold mb-6">Pay with</h2>

                    {/* Payment Tabs */}
                    <div className="flex gap-4 mb-8">
                        <button
                            onClick={() => setPaymentMethod('card')}
                            className={`flex-1 py-3 px-4 rounded-xl border flex items-center justify-center gap-2 transition-all ${paymentMethod === 'card'
                                ? 'border-black ring-1 ring-black bg-gray-50'
                                : 'border-gray-300 hover:border-gray-400'
                                }`}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25v10.5A2.25 2.25 0 0 0 4.5 19.5Z" />
                            </svg>
                            <span className="font-medium">Card</span>
                        </button>
                        <button
                            onClick={() => setPaymentMethod('momo')}
                            className={`flex-1 py-3 px-4 rounded-xl border flex items-center justify-center gap-2 transition-all ${paymentMethod === 'momo'
                                ? 'border-black ring-1 ring-black bg-gray-50'
                                : 'border-gray-300 hover:border-gray-400'
                                }`}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 0 0 6 3.75v16.5a2.25 2.25 0 0 0 2.25 2.25h7.5A2.25 2.25 0 0 0 18 20.25V3.75a2.25 2.25 0 0 0-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" />
                            </svg>
                            <span className="font-medium">Mobile Money</span>
                        </button>
                    </div>

                    {/* Forms */}
                    {paymentMethod === 'card' ? (
                        <div className="space-y-4">
                            <input type="text" placeholder="Card Number" className="w-full p-4 border border-gray-300 rounded-lg outline-none focus:ring-1 focus:ring-black" />
                            <div className="flex gap-4">
                                <input type="text" placeholder="Expiration" className="w-1/2 p-4 border border-gray-300 rounded-lg outline-none focus:ring-1 focus:ring-black" />
                                <input type="text" placeholder="CVV" className="w-1/2 p-4 border border-gray-300 rounded-lg outline-none focus:ring-1 focus:ring-black" />
                            </div>
                            <input type="text" placeholder="ZIP Code" className="w-full p-4 border border-gray-300 rounded-lg outline-none focus:ring-1 focus:ring-black" />
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="relative">
                                <select
                                    value={network}
                                    onChange={(e) => setNetwork(e.target.value)}
                                    className="w-full p-4 border border-gray-300 rounded-lg outline-none focus:ring-1 focus:ring-black appearance-none bg-white font-medium"
                                >
                                    <option value="MTN">MTN Mobile Money</option>
                                    <option value="Telecel">Telecel Cash</option>
                                    <option value="AirtelTigo">AirtelTigo Money</option>
                                </select>
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-gray-500">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                                    </svg>
                                </div>
                            </div>
                            <input type="tel" placeholder="Mobile Number" className="w-full p-4 border border-gray-300 rounded-lg outline-none focus:ring-1 focus:ring-black" />
                        </div>
                    )}

                    <button
                        onClick={handlePayment}
                        disabled={loading}
                        className={`w-full bg-action-blue text-white py-4 rounded-lg font-bold text-lg hover:bg-blue-700 transition-colors mt-8 shadow-md hover:shadow-lg ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        {loading ? 'Processing...' : `Pay GHS ${grandTotal}`}
                    </button>

                </div>

                {/* Right Column: Order Summary */}
                <div className="md:w-1/2">
                    <div className="border border-gray-200 rounded-xl p-6 bg-white shadow-sm sticky top-28">
                        <div className="flex gap-4 border-b border-gray-100 pb-6 mb-6">
                            <img src={property.image_url} alt={property.title} className="w-28 h-24 object-cover rounded-lg" />
                            <div>
                                <p className="text-xs text-gray-500 mb-1">Entire home</p>
                                <h3 className="font-semibold text-sm mb-1">{property.title}</h3>
                                <div className="flex items-center gap-1 text-xs">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3 text-black">
                                        <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006Z" clipRule="evenodd" />
                                    </svg>
                                    <span>{property.rating}</span>
                                </div>
                            </div>
                        </div>

                        <div className="border-b border-gray-100 pb-6 mb-6">
                            <div className="flex justify-between text-sm mb-2">
                                <span className="text-gray-600">Dates</span>
                                <span className="font-medium">{checkIn} – {checkOut}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Guests</span>
                                <span className="font-medium">{guests} guest{guests > 1 ? 's' : ''}</span>
                            </div>
                        </div>

                        <h3 className="text-xl font-semibold mb-6">Price details</h3>
                        <div className="flex flex-col gap-3 text-gray-600">
                            <div className="flex justify-between">
                                <span>GHS {property.price} x {nights} nights</span>
                                <span>GHS {total}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Cleaning fee</span>
                                <span>GHS {cleaningFee}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Service fee</span>
                                <span>GHS {serviceFee}</span>
                            </div>
                            <div className="border-t border-gray-200 pt-4 flex justify-between font-bold text-gray-900 text-lg">
                                <span>Total (GHS)</span>
                                <span>GHS {grandTotal}</span>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default Checkout;
