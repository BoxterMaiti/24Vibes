import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Header from '../components/Header';
import TabNavigation from '../components/TabNavigation';
import EmptyState from '../components/EmptyState';
import VibeCard from '../components/VibeCard';
import PageTransition from '../components/PageTransition';
import { Vibe } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { getReceivedVibes, getSentVibes } from '../services/vibeService';

const HomePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'received' | 'sent'>('received');
  const [receivedVibes, setReceivedVibes] = useState<Vibe[]>([]);
  const [sentVibes, setSentVibes] = useState<Vibe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { currentUser } = useAuth();
  
  useEffect(() => {
    async function loadVibes() {
      if (!currentUser || !currentUser.email) return;
      
      try {
        setLoading(true);
        setError(null);
        
        const [received, sent] = await Promise.all([
          getReceivedVibes(currentUser.email),
          getSentVibes(currentUser.email)
        ]);
        
        setReceivedVibes(received);
        setSentVibes(sent);
      } catch (error) {
        console.error('Error loading vibes:', error);
        setError('Failed to load vibes. Please try again later.');
      } finally {
        setLoading(false);
      }
    }
    
    loadVibes();
  }, [currentUser]);

  return (
    <PageTransition>
      <div className="min-h-screen bg-gray-50 pt-4">
        <div className="max-w-4xl mx-auto">
          <Header />
          
          <main className="px-6 md:px-8 py-6">
            <TabNavigation 
              activeTab={activeTab} 
              setActiveTab={setActiveTab}
              receivedCount={receivedVibes.length}
              sentCount={sentVibes.length}
            />
            
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              {error && (
                <div className="bg-red-100 text-red-700 p-4 rounded-md mb-4">
                  {error}
                </div>
              )}
              
              {loading ? (
                <div className="py-8 flex justify-center">
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mr-3"></div>
                    <p className="text-gray-500">Loading vibes...</p>
                  </div>
                </div>
              ) : (
                <>
                  {activeTab === 'received' && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.3 }}
                    >
                      {receivedVibes.length > 0 ? (
                        receivedVibes.map(vibe => (
                          <VibeCard key={vibe.id} vibe={vibe} type="received" />
                        ))
                      ) : (
                        <EmptyState type="received" />
                      )}
                    </motion.div>
                  )}
                  
                  {activeTab === 'sent' && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.3 }}
                    >
                      {sentVibes.length > 0 ? (
                        sentVibes.map(vibe => (
                          <VibeCard key={vibe.id} vibe={vibe} type="sent" />
                        ))
                      ) : (
                        <EmptyState type="sent" />
                      )}
                    </motion.div>
                  )}
                </>
              )}
            </div>
          </main>
        </div>
      </div>
    </PageTransition>
  );
};

export default HomePage;