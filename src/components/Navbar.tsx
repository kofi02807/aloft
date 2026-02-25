import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import logo from '../assets/aloft-logo-01.png';
const Navbar: React.FC = () => {
    const { user, signOut } = useAuth();
    const navigate = useNavigate();
    const [isMenuOpen, setIsMenuOpen] = React.useState(false);
    const [searchParams] = useSearchParams();
    const [searchQuery, setSearchQuery] = React.useState(searchParams.get('q') ?? '');

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        const q = searchQuery.trim();
        navigate(q ? `/?q=${encodeURIComponent(q)}` : '/');
    };

    const handleLogout = async () => {
        await signOut();
        setIsMenuOpen(false);
        navigate('/');
    };

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 bg-main-bg border-b border-gray-100 shadow-sm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-20">

                    {/* Logo */}
                    <div className="flex-shrink-0 flex items-center cursor-pointer" onClick={() => navigate('/')}>
                        <img src={logo} alt="Aloft" className="w-[200px] h-[200px]" />
                    </div>

                    {/* Search Bar */}
                    <div className="hidden md:flex flex-1 justify-center px-8">
                        <form onSubmit={handleSearch} className="flex items-center border border-gray-300 rounded-full py-2 px-4 shadow-sm hover:shadow-md transition-shadow bg-white w-full max-w-md gap-2">
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search by location or property name..."
                                className="flex-1 text-sm outline-none bg-transparent text-gray-700 placeholder-gray-400"
                            />
                            <button type="submit" className="bg-action-blue p-2 rounded-full text-white flex-shrink-0 hover:bg-blue-700 transition-colors">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                                </svg>
                            </button>
                        </form>
                    </div>

                    {/* User Menu */}
                    <div className="flex-shrink-0 flex items-center gap-4 relative">
                        <Link to="/rent" className="hidden md:block text-sm font-medium hover:bg-gray-50 px-3 py-2 rounded-full cursor-pointer transition-colors">
                            Rent your home
                        </Link>


                        <div
                            className="flex items-center border border-gray-300 rounded-full p-1 pl-3 hover:shadow-md transition-shadow cursor-pointer gap-2"
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                            </svg>
                            <div className="bg-gray-500 rounded-full p-0.5 text-white">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-gray-400">
                                    <path fillRule="evenodd" d="M18.685 19.097A9.723 9.723 0 0 0 21.75 12c0-5.385-4.365-9.75-9.75-9.75S2.25 6.615 2.25 12a9.723 9.723 0 0 0 3.065 7.097A9.716 9.716 0 0 0 12 21.75a9.716 9.716 0 0 0 6.685-2.653Zm-12.54-1.285A7.486 7.486 0 0 1 12 15a7.486 7.486 0 0 1 5.855 2.812A8.224 8.224 0 0 1 12 20.25a8.224 8.224 0 0 1-5.855-2.438ZM12 15a5.25 5.25 0 0 1 5.25-5.25h.008c.026.162.042.327.042.5 0 2.862-2.35 5.178-5.25 5.178-2.9 0-5.25-2.316-5.25-5.178 0-.173.016-.339.042-.5H12Z" clipRule="evenodd" />
                                </svg>
                            </div>
                        </div>

                        {/* Dropdown Menu */}
                        {isMenuOpen && (
                            <div className="absolute top-12 right-0 w-60 bg-white rounded-xl shadow-xl border border-gray-100 py-2 flex flex-col z-50">
                                {user ? (
                                    <>
                                        <div className="px-4 py-2 border-b border-gray-100">
                                            <p className="font-semibold text-sm truncate">{user.email}</p>
                                        </div>
                                        <Link to="/trips" className="px-4 py-3 hover:bg-gray-50 text-sm font-medium text-left">My Trips</Link>
                                        <Link to="/host" className="px-4 py-3 hover:bg-gray-50 text-sm font-medium text-left">Host Dashboard</Link>
                                        <Link to="/wishlists" className="px-4 py-3 hover:bg-gray-50 text-sm md:hidden text-left">Wishlists</Link>
                                        <div className="border-t border-gray-100 my-1"></div>
                                        <button
                                            onClick={handleLogout}
                                            className="px-4 py-3 hover:bg-gray-50 text-sm text-left text-red-600 font-medium w-full"
                                        >
                                            Log out
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <Link to="/login" className="px-4 py-3 hover:bg-gray-50 text-sm font-semibold text-left">Log in</Link>
                                        <Link to="/signup" className="px-4 py-3 hover:bg-gray-50 text-sm text-left">Sign up</Link>
                                        <div className="border-t border-gray-100 my-1"></div>
                                        <div className="px-4 py-3 hover:bg-gray-50 text-sm text-left">Rent your home</div>
                                        <div className="px-4 py-3 hover:bg-gray-50 text-sm text-left">Help Center</div>
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
