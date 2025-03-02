import React from 'react';
import { Stamp } from 'lucide-react';

interface EmptyStateProps {
  type: 'received' | 'sent';
}

const EmptyState: React.FC<EmptyStateProps> = ({ type }) => {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="w-20 h-20 mb-6 flex items-center justify-center rounded-full bg-blue-100">
        <Stamp className="w-10 h-10 text-blue-600" />
      </div>
      <h3 className="text-xl font-semibold text-gray-800 mb-2">
        Celebrate a peer with 24Vibes
      </h3>
      <p className="text-gray-600 max-w-md">
        {type === 'received' 
          ? "You haven't received any vibes yet. When someone sends you a vibe, it will appear here."
          : "Send them a kind word and make their day."}
      </p>
    </div>
  );
};

export default EmptyState;