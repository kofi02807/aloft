export interface Property {
    id: number;
    image_url: string; // Changed from 'image' to match DB column
    title: string;
    location: string;
    price: number;
    rating: number;
    isGuestFavorite: boolean;
    description: string;
    amenities: string[];
}
// Keeping the interface, but we will likely fetch this data instead of using the constant array in the future.
export const PROPERTIES: Property[] = [];
