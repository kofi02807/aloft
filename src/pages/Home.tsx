import { useEffect, useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import PropertyCard from '../components/PropertyCard';
import { supabase } from '../lib/supabase';
import type { Property } from '../data/properties';

const AMENITY_OPTIONS = ['Wifi', 'Pool', 'Kitchen', 'Air conditioning', 'Free parking', 'Washer'];

const Home: React.FC = () => {
    const [searchParams] = useSearchParams();
    const query = searchParams.get('q') ?? '';

    const [properties, setProperties] = useState<Property[]>([]);
    const [loading, setLoading] = useState(true);

    // ── Filter state ────────────────────────────────────────────
    const [maxPrice, setMaxPrice] = useState<number>(5000);
    const [selectedAmenities, setAmenities] = useState<string[]>([]);
    const [guestFavOnly, setGuestFavOnly] = useState(false);
    const [sortBy, setSortBy] = useState<'default' | 'price_asc' | 'price_desc' | 'rating'>('default');
    const [filterOpen, setFilterOpen] = useState(false);

    useEffect(() => {
        const fetchProperties = async () => {
            const { data, error } = await supabase
                .from('properties')
                .select('*')
                .order('id', { ascending: true });

            if (error) console.error('Error fetching properties:', error);
            else setProperties(data || []);
            setLoading(false);
        };
        fetchProperties();
    }, []);

    // ── Derived filtered + sorted list ──────────────────────────
    const filtered = useMemo(() => {
        let list = [...properties];

        // Text search (location or title)
        if (query) {
            const q = query.toLowerCase();
            list = list.filter(p =>
                p.location?.toLowerCase().includes(q) ||
                p.title?.toLowerCase().includes(q)
            );
        }

        // Max price
        list = list.filter(p => p.price <= maxPrice);

        // Amenities
        if (selectedAmenities.length > 0) {
            list = list.filter(p =>
                selectedAmenities.every(a => p.amenities?.includes(a))
            );
        }

        // Guest favourite
        if (guestFavOnly) list = list.filter(p => p.isGuestFavorite);

        // Sort
        if (sortBy === 'price_asc') list.sort((a, b) => a.price - b.price);
        if (sortBy === 'price_desc') list.sort((a, b) => b.price - a.price);
        if (sortBy === 'rating') list.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));

        return list;
    }, [properties, query, maxPrice, selectedAmenities, guestFavOnly, sortBy]);

    const toggleAmenity = (a: string) =>
        setAmenities(prev => prev.includes(a) ? prev.filter(x => x !== a) : [...prev, a]);

    const clearFilters = () => {
        setMaxPrice(5000);
        setAmenities([]);
        setGuestFavOnly(false);
        setSortBy('default');
    };

    const hasActiveFilters = maxPrice < 5000 || selectedAmenities.length > 0 || guestFavOnly || sortBy !== 'default';

    if (loading) {
        return (
            <div className="pt-32 flex justify-center items-center min-h-screen">
                <div className="flex flex-col items-center gap-3 text-gray-400">
                    <svg className="animate-spin w-8 h-8" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                    <span className="text-sm">Loading homes...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="pt-24 pb-12 px-6 sm:px-8 lg:px-12 max-w-[1600px] mx-auto">

            {/* ── Filter Bar ─────────────────────────────────────── */}
            <div className="flex flex-wrap items-center gap-3 mb-8 pt-2">

                {/* Sort */}
                <select
                    value={sortBy}
                    onChange={e => setSortBy(e.target.value as typeof sortBy)}
                    className="text-sm border border-gray-300 rounded-full px-4 py-2 bg-white outline-none cursor-pointer hover:border-gray-400 transition-colors"
                >
                    <option value="default">Sort: Default</option>
                    <option value="price_asc">Price: Low → High</option>
                    <option value="price_desc">Price: High → Low</option>
                    <option value="rating">Top Rated</option>
                </select>

                {/* Max price */}
                <div className="flex items-center gap-2 border border-gray-300 rounded-full px-4 py-2 bg-white text-sm hover:border-gray-400 transition-colors">
                    <span className="text-gray-500 whitespace-nowrap">Max price:</span>
                    <input
                        type="range"
                        min={100}
                        max={5000}
                        step={50}
                        value={maxPrice}
                        onChange={e => setMaxPrice(Number(e.target.value))}
                        className="w-24 accent-action-blue cursor-pointer"
                    />
                    <span className="font-semibold text-gray-800 whitespace-nowrap">GHS {maxPrice.toLocaleString()}</span>
                </div>

                {/* Guest favourite toggle */}
                <button
                    onClick={() => setGuestFavOnly(!guestFavOnly)}
                    className={`flex items-center gap-2 text-sm border rounded-full px-4 py-2 transition-colors cursor-pointer ${guestFavOnly
                            ? 'bg-action-blue text-white border-action-blue'
                            : 'bg-white border-gray-300 text-gray-700 hover:border-gray-400'
                        }`}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5">
                        <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006Z" clipRule="evenodd" />
                    </svg>
                    Guest favourite
                </button>

                {/* More filters toggle */}
                <button
                    onClick={() => setFilterOpen(!filterOpen)}
                    className={`flex items-center gap-2 text-sm border rounded-full px-4 py-2 transition-colors cursor-pointer ${selectedAmenities.length > 0
                            ? 'bg-action-blue text-white border-action-blue'
                            : 'bg-white border-gray-300 text-gray-700 hover:border-gray-400'
                        }`}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-9.75 0h9.75" />
                    </svg>
                    Amenities {selectedAmenities.length > 0 && `(${selectedAmenities.length})`}
                </button>

                {/* Clear filters */}
                {hasActiveFilters && (
                    <button
                        onClick={clearFilters}
                        className="text-sm text-gray-500 underline hover:text-gray-800 transition-colors"
                    >
                        Clear all
                    </button>
                )}

                {/* Result count */}
                <span className="ml-auto text-sm text-gray-400">
                    {filtered.length} {filtered.length === 1 ? 'property' : 'properties'}
                    {query && <span> for "<span className="text-gray-700 font-medium">{query}</span>"</span>}
                </span>
            </div>

            {/* Amenity chips (expanded) */}
            {filterOpen && (
                <div className="flex flex-wrap gap-2 mb-6 p-4 bg-white border border-gray-200 rounded-2xl shadow-sm">
                    <p className="w-full text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Filter by amenity</p>
                    {AMENITY_OPTIONS.map(a => (
                        <button
                            key={a}
                            onClick={() => toggleAmenity(a)}
                            className={`text-sm border rounded-full px-4 py-1.5 transition-colors cursor-pointer ${selectedAmenities.includes(a)
                                    ? 'bg-gray-900 text-white border-gray-900'
                                    : 'bg-white border-gray-300 text-gray-700 hover:border-gray-500'
                                }`}
                        >
                            {a}
                        </button>
                    ))}
                </div>
            )}

            {/* ── Property Grid ───────────────────────────────────── */}
            {filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 text-center">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-7 h-7 text-gray-400">
                            <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                        </svg>
                    </div>
                    <h2 className="text-xl font-semibold text-gray-800 mb-2">No properties found</h2>
                    <p className="text-gray-500 mb-4">Try adjusting your search or filters.</p>
                    <button onClick={clearFilters} className="text-action-blue underline text-sm">Clear filters</button>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-10">
                    {filtered.map((property) => (
                        <PropertyCard
                            key={property.id}
                            id={property.id}
                            image={property.image_url}
                            title={property.title}
                            location={property.location}
                            price={`GHS ${property.price}`}
                            rating={property.rating}
                            isGuestFavorite={property.isGuestFavorite}
                        />
                    ))}
                </div>
            )}

            {filtered.length > 0 && (
                <div className="mt-16 text-center">
                    <h2 className="text-xl font-semibold mb-4">Continue exploring unique homes</h2>
                    <button className="bg-black text-white px-8 py-3.5 rounded-lg font-semibold hover:bg-gray-800 transition-all hover:scale-105 active:scale-95">
                        Show more
                    </button>
                </div>
            )}
        </div>
    );
};

export default Home;
