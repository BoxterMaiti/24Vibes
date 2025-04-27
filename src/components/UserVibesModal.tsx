import React, { useState, useEffect } from 'react';
import { X, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import TabNavigation from './TabNavigation';
import VibeCard from './VibeCard';
import { Vibe, Colleague } from '../types';
import { getUserVibes } from '../services/vibeService';

interface UserVibesModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: {
    email: string;
    colleague: Colleague | null;
  } | null;
  showLeaderboard?: boolean;
}

const UserVibesModal: React.FC<UserVibesModalProps> = ({ 
  isOpen, 
  onClose, 
  user,
  showLeaderboard = false
}) => {
  const [activeTab, setActiveTab] = useState<'received' | 'sent'>('received');
  const [vibes, setVibes] = useState<Vibe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadVibes() {
      if (!user?.email) return;
      
      try {
        setLoading(true);
        setError(null);
        
        const userVibes = await getUserVibes(user.email);
        setVibes(userVibes);
      } catch (err) {
        console.error('Error loading vibes:', err);
        setError('Failed to load vibes. Please try again.');
      } finally {
        setLoading(false);
      }
    }
    
    if (isOpen && user) {
      loadVibes();
    }
  }, [isOpen, user]);

  const filteredVibes = vibes.filter(vibe => 
    activeTab === 'received' ? vibe.recipient === user?.email : vibe.sender === user?.email
  );

  const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
    exit: { opacity: 0, transition: { duration: 0.2 } }
  };

  const modalVariants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: { 
      opacity: 1, 
      scale: 1,
      transition: { 
        type: "spring", 
        damping: 25, 
        stiffness: 300
      }
    },
    exit: { 
      opacity: 0, 
      scale: 0.9,
      transition: { 
        duration: 0.2
      }
    }
  };

  if (!user) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center z-50 p-4 overflow-y-auto"
          initial="hidden"
          animate="visible"
          exit="exit"
          variants={backdropVariants}
        >
          <motion.div 
            className="bg-white rounded-lg shadow-xl w-full max-w-4xl my-8"
            variants={modalVariants}
          >
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  {user.colleague?.avatar ? (
                    <img 
                      src={user.colleague.avatar} 
                      alt={user.colleague.name || user.email}
                      className="w-12 h-12 rounded-full mr-4"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://via.placeholder.com/48';
                      }}
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center mr-4">
                      <Users className="w-6 h-6 text-gray-500" />
                    </div>
                  )}
                  <div>
                    <h2 className="text-xl font-bold text-gray-800">
                      {user.colleague?.name || user.colleague?.["display name"] || user.email.split('@')[0]}
                    </h2>
                    <p className="text-sm text-gray-600">
                      {user.colleague?.department || user.colleague?.position || user.email}
                    </p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <X size={24} />
                </button>
              </div>
            </div>
            
            <div className="p-6">
              <TabNavigation 
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                receivedCount={vibes.filter(v => v.recipient === user.email).length}
                sentCount={vibes.filter(v => v.sender === user.email).length}
                showLeaderboard={showLeaderboard}
              />
              
              {error && (
                <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
                  {error}
                </div>
              )}
              
              {loading ? (
                <div className="py-8 flex justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredVibes.length > 0 ? (
                    filteredVibes.map(vibe => (
                      <VibeCard 
                        key={vibe.id} 
                        vibe={vibe} 
                        type={activeTab}
                      />
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      No {activeTab} vibes found.
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default UserVibesModal;