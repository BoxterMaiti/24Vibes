import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MessageSquarePlus, LogOut, UserCircle, ChevronDown, Users, Settings, MessageCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';

const Header: React.FC = () => {
  const { currentUser, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLogout = async () => {
    try {
      setDropdownOpen(false);
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Failed to log out', error);
    }
  };

  // Animation variants for the dropdown
  const dropdownVariants = {
    hidden: { 
      opacity: 0,
      y: -10,
      scale: 0.95,
      transition: {
        duration: 0.2,
        ease: "easeInOut"
      }
    },
    visible: { 
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.2,
        ease: "easeOut"
      }
    },
    exit: {
      opacity: 0,
      y: -10,
      scale: 0.95,
      transition: {
        duration: 0.15,
        ease: "easeInOut"
      }
    }
  };

  return (
    <header className="flex justify-between items-center py-6 px-6 md:px-8 mt-4">
      <div className="flex items-center">
        <Link to="/">
          <img 
            src="https://i.postimg.cc/Prm0LcST/24viibes-logo-0-00-00-00.png" 
            alt="24Vibes Logo" 
            className="h-10"
          />
        </Link>
      </div>
      <div className="flex items-center gap-4">
        {currentUser && (
          <div className="relative" ref={dropdownRef}>
            <button 
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2 hover:bg-gray-100 rounded-full p-1 transition-colors"
            >
              {currentUser.photoURL ? (
                <img 
                  src={currentUser.photoURL} 
                  alt={currentUser.displayName || currentUser.email || "Profile"} 
                  className="w-8 h-8 rounded-full border border-gray-200"
                />
              ) : (
                <UserCircle size={32} className="text-gray-600" />
              )}
              <span className="text-sm text-gray-600 hidden md:inline">
                {currentUser.displayName || currentUser.email?.split('@')[0]}
              </span>
              <motion.div
                animate={{ rotate: dropdownOpen ? 180 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <ChevronDown size={16} className="text-gray-500" />
              </motion.div>
            </button>
            
            {/* Dropdown Menu */}
            <AnimatePresence>
              {dropdownOpen && (
                <motion.div 
                  className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10 origin-top"
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  variants={dropdownVariants}
                >
                  <Link 
                    to="/profile" 
                    className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    onClick={() => setDropdownOpen(false)}
                  >
                    <UserCircle size={16} className="mr-2" />
                    View Profile
                  </Link>
                  
                  {isAdmin && (
                    <>
                      <Link 
                        to="/manage-people" 
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setDropdownOpen(false)}
                      >
                        <Users size={16} className="mr-2" />
                        Manage People
                      </Link>
                      <Link 
                        to="/slack-messenger" 
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setDropdownOpen(false)}
                      >
                        <MessageCircle size={16} className="mr-2" />
                        Slack Messenger
                      </Link>
                    </>
                  )}
                  
                  <button
                    onClick={handleLogout}
                    className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                  >
                    <LogOut size={16} className="mr-2" />
                    Log Out
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
        <Link 
          to="/create" 
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
        >
          <MessageSquarePlus size={20} />
          <span>Create card</span>
        </Link>
      </div>
    </header>
  );
};

export default Header;