import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const RentYourHome: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        location: '',
        price: '',
        host_subaccount_code: '',
    });

    const [images, setImages] = useState<string[]>([]);

    const [amenities, setAmenities] = useState<string[]>([]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        try {
            setUploading(true);
            setError(null);

            if (!e.target.files || e.target.files.length === 0) {
                return;
            }

            const files = Array.from(e.target.files);
            const newImageUrls: string[] = [];

            for (const file of files) {
                const fileExt = file.name.split('.').pop();
                const fileName = `${Math.random()}.${fileExt}`;
                const filePath = `${fileName}`;

                const { error: uploadError } = await supabase.storage
                    .from('property-images')
                    .upload(filePath, file);

                if (uploadError) {
                    throw uploadError;
                }

                const { data } = supabase.storage
                    .from('property-images')
                    .getPublicUrl(filePath);

                newImageUrls.push(data.publicUrl);
            }

            setImages(prev => [...prev, ...newImageUrls]);
        } catch (error: any) {
            setError(error.message);
        } finally {
            setUploading(false);
        }
    };

    const removeImage = (index: number) => {
        setImages(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        if (!user) {
            setError("You must be logged in to list a property.");
            setLoading(false);
            return;
        }

        if (images.length === 0) {
            setError("Please upload at least one image of your property.");
            setLoading(false);
            return;
        }

        try {
            const { error } = await supabase
                .from('properties')
                .insert([
                    {
                        title: formData.title,
                        description: formData.description,
                        location: formData.location,
                        price: parseFloat(formData.price),
                        image_url: images[0], // Use first image as cover
                        images: images,
                        amenities: amenities,
                        rating: 0,
                        is_guest_favorite: false,
                        host_user_id: user.id,
                        host_subaccount_code: formData.host_subaccount_code.trim() || null,
                    }
                ]);

            if (error) throw error;

            alert('Property listed successfully!');
            navigate('/');
        } catch (error: any) {
            console.error('Error listing property:', error);
            setError(error.message || 'Failed to list property.');
        } finally {
            setLoading(false);
        }
    };

    const toggleAmenity = (amenity: string) => {
        setAmenities(prev =>
            prev.includes(amenity)
                ? prev.filter(a => a !== amenity)
                : [...prev, amenity]
        );
    };

    const commonAmenities = ["Wifi", "Kitchen", "Air conditioning", "Pool", "Washer", "Free parking"];

    return (
        <div className="pt-28 pb-12 px-6 max-w-3xl mx-auto">
            <h1 className="text-3xl font-bold mb-8">Rent your home</h1>

            {error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6">
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Property Title</label>
                    <input
                        type="text"
                        name="title"
                        value={formData.title}
                        onChange={handleInputChange}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black outline-none"
                        placeholder="Cozy apartment in Accra"
                        required
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                    <input
                        type="text"
                        name="location"
                        value={formData.location}
                        onChange={handleInputChange}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black outline-none"
                        placeholder="East Legon, Accra"
                        required
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleInputChange}
                        rows={4}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black outline-none"
                        placeholder="Describe your property..."
                        required
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Price per night (GHS)</label>
                    <input
                        type="number"
                        name="price"
                        value={formData.price}
                        onChange={handleInputChange}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black outline-none"
                        placeholder="500"
                        required
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Paystack Subaccount Code
                        <span className="ml-1 text-gray-400 font-normal">(for receiving payments)</span>
                    </label>
                    <input
                        type="text"
                        name="host_subaccount_code"
                        value={formData.host_subaccount_code}
                        onChange={handleInputChange}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black outline-none font-mono"
                        placeholder="ACCT_xxxxxxxxxx"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                        Create a subaccount at{' '}
                        <a
                            href="https://dashboard.paystack.com/#/subaccounts"
                            target="_blank"
                            rel="noreferrer"
                            className="text-action-blue underline"
                        >
                            Paystack Dashboard → Settings → Subaccounts
                        </a>{' '}
                        to receive 90% of each booking directly to your bank account.
                    </p>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Photos</label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:bg-gray-50 transition-colors cursor-pointer relative">
                        <input
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={handleImageUpload}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                            disabled={uploading}
                        />
                        <div className="space-y-1">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 mx-auto text-gray-400">
                                <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
                            </svg>
                            <p className="text-gray-500">
                                {uploading ? 'Uploading...' : 'Click or drop photos here'}
                            </p>
                        </div>
                    </div>

                    {/* Image Previews */}
                    {images.length > 0 && (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-4">
                            {images.map((url, index) => (
                                <div key={index} className="relative aspect-video rounded-lg overflow-hidden group">
                                    <img src={url} alt={`Property ${index + 1}`} className="w-full h-full object-cover" />
                                    <button
                                        type="button"
                                        onClick={() => removeImage(index)}
                                        className="absolute top-2 right-2 bg-white p-1 rounded-full shadow-md text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">Amenities</label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {commonAmenities.map((amenity) => (
                            <label key={amenity} className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={amenities.includes(amenity)}
                                    onChange={() => toggleAmenity(amenity)}
                                    className="w-4 h-4 text-black border-gray-300 rounded focus:ring-black"
                                />
                                <span className="text-sm text-gray-600">{amenity}</span>
                            </label>
                        ))}
                    </div>
                </div>

                <div className="pt-4">
                    <button
                        type="submit"
                        disabled={loading || uploading}
                        className="w-full bg-action-blue text-white py-3.5 rounded-lg font-bold hover:bg-blue-700 transition-colors disabled:opacity-50"
                    >
                        {loading ? 'Listing Property...' : 'List Your Home'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default RentYourHome;
