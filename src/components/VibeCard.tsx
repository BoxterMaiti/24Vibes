import React, { useState, useEffect } from 'react';
import { Users } from 'lucide-react';
import { motion } from 'framer-motion';
import { Vibe, CardTemplate, CategoryType, categoryBackgroundColors, categoryColors, categoryIcons } from '../types';
import { getTemplateById } from '../services/vibeService';

interface VibeCardProps {
  vibe: Vibe;
  type: 'received' | 'sent';
}

const VibeCard: React.FC<VibeCardProps> = ({ vibe, type }) => {
  const [template, setTemplate] = useState<CardTemplate | null>(null);
  
  useEffect(() => {
    // If the vibe has a templateId, fetch the template
    if (vibe.templateId) {
      getTemplateById(vibe.templateId)
        .then(templateData => {
          if (templateData) {
            setTemplate(templateData);
          }
        })
        .catch(error => {
          console.error('Error fetching template:', error);
        });
    }
  }, [vibe.templateId]);

  const formattedDate = new Date(vibe.createdAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  // Determine the background color based on the category
  const category = vibe.category as CategoryType;
  const bgColorClass = category && categoryBackgroundColors[category] 
    ? categoryBackgroundColors[category] 
    : 'bg-white';
  
  // Determine the category label color
  const categoryColorClass = category && categoryColors[category]
    ? categoryColors[category]
    : 'bg-gray-100 text-gray-700';
    
  // Get the appropriate icon for the category
  const CategoryIcon = category && categoryIcons[category] 
    ? categoryIcons[category] 
    : Users;

  return (
    <motion.div 
      className={`${bgColorClass} rounded-lg shadow-md p-6 mb-4 border border-gray-100 relative min-h-[180px] sm:min-h-0`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Category icon - positioned differently on mobile vs desktop */}
      <div className="absolute top-6 right-6 opacity-20 hidden sm:block">
        <CategoryIcon className="w-16 h-16 text-gray-800" />
      </div>
      
      {/* Mobile category icon - positioned at bottom right */}
      <div className="absolute bottom-6 right-6 opacity-20 block sm:hidden">
        <CategoryIcon className="w-16 h-16 text-gray-800" />
      </div>
      
      <div className="mb-4">
        <p className="text-gray-800 text-lg font-medium mb-2">{vibe.message}</p>
        {vibe.personalMessage && (
          <p className="text-gray-600 italic">"{vibe.personalMessage}"</p>
        )}
      </div>
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center text-sm text-gray-500 gap-2">
        <div className="flex items-center">
          {type === 'received' ? (
            'From: Anonymous'
          ) : (
            <div className="flex items-center">
              <span className="mr-2">To:</span>
              {vibe.recipientAvatar ? (
                <img 
                  src={vibe.recipientAvatar} 
                  alt={vibe.recipientName || vibe.recipient}
                  className="w-6 h-6 rounded-full mr-2"
                  onError={(e) => {
                    // Replace with placeholder if image fails to load
                    (e.target as HTMLImageElement).src = 'https://via.placeholder.com/24';
                  }}
                />
              ) : (
                <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center mr-2">
                  <Users size={12} className="text-gray-500" />
                </div>
              )}
              <span>{vibe.recipientName || vibe.recipient}</span>
            </div>
          )}
        </div>
        <div className="flex items-center">
          {vibe.category && (
            <span className={`inline-block px-2 py-1 rounded-full text-xs mr-3 ${categoryColorClass}`}>
              {vibe.category}
            </span>
          )}
          <span>{formattedDate}</span>
        </div>
      </div>
    </motion.div>
  );
};

export default VibeCard;