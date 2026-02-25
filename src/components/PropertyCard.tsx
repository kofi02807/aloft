

import { Link } from 'react-router-dom';

interface PropertyCardProps {
    id: number;
    image: string;
    title: string;
    location: string;
    price: string;
    rating: number;
    isGuestFavorite?: boolean;
}

const PropertyCard: React.FC<PropertyCardProps> = ({ id, image, title, location, price, rating, isGuestFavorite }) => {
    return (
        <Link to={`/property/${id}`} className="group cursor-pointer flex flex-col gap-2">
            <div className="relative aspect-square overflow-hidden rounded-xl bg-gray-200">
                <img
                    src={image}
                    alt={title}
                    className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300 ease-in-out"
                />

                {/* Guest Favorite Badge */}
                {isGuestFavorite && (
                    <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-semibold shadow-sm">
                        Guest favorite
                    </div>
                )}

                {/* Heart Icon */}
                <button className="absolute top-3 right-3 text-white/70 hover:text-white transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
                    </svg>
                </button>
            </div>

            <div className="flex flex-col gap-0.5 mt-1">
                <div className="flex justify-between items-start">
                    <h3 className="font-semibold text-gray-900 group-hover:underline-offset-4 line-clamp-1">{title}</h3>
                    <div className="flex items-center gap-1 text-sm font-medium">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5">
                            <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006Z" clipRule="evenodd" />
                        </svg>
                        <span>{rating}</span>
                    </div>
                </div>
                <p className="text-gray-500 text-sm">{location}</p>
                <p className="text-gray-500 text-sm">Nov 15 - 20</p>
                <div className="flex items-center gap-1 mt-1 text-sm">
                    <span className="font-semibold text-gray-900">{price}</span>
                    <span className="font-light">night</span>
                </div>
            </div>
        </Link>
    );
};

export default PropertyCard;
