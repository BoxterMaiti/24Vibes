import React from 'react';

interface TabNavigationProps {
  activeTab: 'received' | 'sent';
  setActiveTab: (tab: 'received' | 'sent') => void;
  receivedCount: number;
  sentCount: number;
}

const TabNavigation: React.FC<TabNavigationProps> = ({ 
  activeTab, 
  setActiveTab,
  receivedCount,
  sentCount
}) => {
  return (
    <div className="flex space-x-2 mb-6">
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
  );
};

export default TabNavigation;