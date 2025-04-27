import React from 'react';
import { Trophy } from 'lucide-react';

interface TabNavigationProps {
  activeTab: 'received' | 'sent' | 'leaderboard';
  setActiveTab: (tab: 'received' | 'sent' | 'leaderboard') => void;
  receivedCount: number;
  sentCount: number;
  showLeaderboard?: boolean;
}

const TabNavigation: React.FC<TabNavigationProps> = ({ 
  activeTab, 
  setActiveTab,
  receivedCount,
  sentCount,
  showLeaderboard = true
}) => {
  return (
    <div className="flex justify-between items-center mb-6">
      <div className="flex space-x-2">
        <button
          className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
            activeTab === 'received'
              ? 'bg-gray-800 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
          onClick={() => setActiveTab('received')}
        >
          Received ({receivedCount})
        </button>
        <button
          className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
            activeTab === 'sent'
              ? 'bg-gray-800 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
          onClick={() => setActiveTab('sent')}
        >
          Sent ({sentCount})
        </button>
      </div>
      {showLeaderboard && (
        <button
          className={`px-4 py-2 rounded-full text-sm font-medium transition-colors flex items-center gap-2 ${
            activeTab === 'leaderboard'
              ? 'bg-gray-800 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
          onClick={() => setActiveTab('leaderboard')}
        >
          <Trophy size={16} />
          Leaderboard
        </button>
      )}
    </div>
  );
};

export default TabNavigation;