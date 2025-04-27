import React, { useState } from 'react';
import { Users } from 'lucide-react';
import { motion } from 'framer-motion';
import { Vibe, CardTemplate, CategoryType, categoryBackgroundColors, categoryColors, categoryIcons } from '../types';
import { getTemplateById } from '../services/vibeService';
import EmojiReactions from './EmojiReactions';

interface VibeCardProps {
  vibe: Vibe;
  type: 'received' | 'sent';
  onReactionChange?: () => void;
}

const VibeCard: React.FC<VibeCardProps> = ({ vibe, type, onReactionChange }) => {
  const [template, setTemplate] = useState<CardTemplate | null>(null);
  const [showReactButton, setShowReactButton] = useState(false);
  
  React.useEffect(() => {
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

  const category = vibe.category as CategoryType;
  const bgColorClass = category && categoryBackgroundColors[category] 
    ? categoryBackgroundColors[category] 
    : 'bg-white';
  
  const categoryColorClass = category && categoryColors[category]
    ? categoryColors[category]
    : 'bg-gray-100 text-gray-700';
    
  const CategoryIcon = category && categoryIcons[category] 
    ? categoryIcons[category] 
    : Users;

  const handleReactionChange = () => {
    if (onReactionChange) {
      onReactionChange();
    }
  };

  return (
    <motion.div 
      className={`${bgColorClass} rounded-lg shadow-md p-6 mb-4 border border-gray-100 relative min-h-[180px] sm:min-h-0 group`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      onMouseEnter={() => setShowReactButton(true)}
      onMouseLeave={() => setShowReactButton(false)}
    >
      <div className="absolute top-6 right-6 opacity-20 hidden sm:block">
        <CategoryIcon className="w-16 h-16 text-gray-800" />
      </div>
      
      <div className="absolute bottom-6 right-6 opacity-20 block sm:hidden">
        <CategoryIcon className="w-16 h-16 text-gray-800" />
      </div>
      
      <div className="relative z-10">
        <div className="mb-4 pr-20">
          <p className="text-gray-800 text-lg font-medium mb-2 break-words">{vibe.message}</p>
          {vibe.personalMessage ? (
            <p className="text-gray-600 italic break-words">{`"${vibe.personalMessage}"`}</p>
          ) : (
            <span className="inline-block px-2 py-1 bg-gray-100 text-gray-500 text-xs rounded-md ">
              No message
            </span>
          )}
        </div>
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center text-sm text-gray-500 gap-2">
          <div className="flex items-center gap-4">
            {type === 'received' && (
              <div className="flex items-center">
                <span className="mr-2">From:</span>
                {vibe.senderAvatar ? (
                  <img 
                    src={vibe.senderAvatar} 
                    alt={vibe.senderName || vibe.sender}
                    className="w-6 h-6 rounded-full mr-2"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://via.placeholder.com/24';
                    }}
                  />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center mr-2">
                    <Users size={12} className="text-gray-500" />
                  </div>
                )}
                <span className="truncate max-w-[150px]">{vibe.senderName || vibe.sender.split('@')[0]}</span>
              </div>
            )}

            {type === 'sent' && (
              <div className="flex items-center">
                <span className="mr-2">To:</span>
                {vibe.recipientAvatar ? (
                  <img 
                    src={vibe.recipientAvatar} 
                    alt={vibe.recipientName || vibe.recipient}
                    className="w-6 h-6 rounded-full mr-2"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://via.placeholder.com/24';
                    }}
                  />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center mr-2">
                    <Users size={12} className="text-gray-500" />
                  </div>
                )}
                <span className="truncate max-w-[150px]">{vibe.recipientName || vibe.recipient.split('@')[0]}</span>
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

        <div className="absolute -bottom-4 -right-4 transform translate-x-1/2 translate-y-1/2">
          <EmojiReactions 
            vibeId={vibe.id} 
            reactions={vibe.reactions || []}
            onReactionChange={handleReactionChange}
            showReactButton={showReactButton}
            type={type}
          />
        </div>
      </div>
    </motion.div>
  );
};

export default VibeCard;