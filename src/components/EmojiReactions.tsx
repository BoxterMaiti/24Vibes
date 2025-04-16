import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PlusCircle, X } from 'lucide-react';
import { EMOJI_REACTIONS, Reaction } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { useEmojiMenu } from '../contexts/EmojiMenuContext';
import { addReaction, removeReaction } from '../services/vibeService';

interface EmojiReactionsProps {
  vibeId: string;
  reactions: Reaction[];
  onReactionChange: () => void;
  showReactButton: boolean;
  type?: 'sent' | 'received';
}

const EmojiReactions: React.FC<EmojiReactionsProps> = ({ 
  vibeId, 
  reactions,
  onReactionChange,
  showReactButton,
  type = 'received'
}) => {
  const [hoveredEmoji, setHoveredEmoji] = useState<string | null>(null);
  const { currentUser } = useAuth();
  const { openVibeId, setOpenVibeId } = useEmojiMenu();
  const menuRef = useRef<HTMLDivElement>(null);

  const isOpen = openVibeId === vibeId;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpenVibeId(null);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [setOpenVibeId]);

  const handleReactionClick = async (emoji: string) => {
    if (!currentUser || type === 'sent') return;

    const userReactions = reactions.filter(r => r.userId === currentUser.uid);
    const existingReaction = userReactions[0];

    try {
      if (existingReaction) {
        if (existingReaction.emoji === emoji) {
          await removeReaction(vibeId, currentUser.uid, existingReaction.emoji);
        } else {
          await removeReaction(vibeId, currentUser.uid, existingReaction.emoji);
          await addReaction(vibeId, currentUser.uid, emoji);
        }
      } else {
        await addReaction(vibeId, currentUser.uid, emoji);
      }
      onReactionChange();
      setOpenVibeId(null); // Close menu only after selecting an emoji
    } catch (error) {
      console.error('Error handling reaction:', error);
    }
  };

  const getReactionCount = (emoji: string) => {
    return reactions.filter(r => r.emoji === emoji).length;
  };

  const hasUserReacted = (emoji: string) => {
    return currentUser && reactions.some(r => r.userId === currentUser.uid && r.emoji === emoji);
  };

  const userHasReacted = currentUser && reactions.some(r => r.userId === currentUser.uid);
  const hasAnyReactions = reactions.length > 0;
  const canShowReactButton = (!openVibeId || openVibeId === vibeId) && type === 'received';
  const shouldShowReactButton = (showReactButton || isOpen) && canShowReactButton;

  return (
    <div className="relative" ref={menuRef}>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
            className="absolute right-0 bottom-full mb-2 py-1 px-2 bg-white rounded-full shadow-xl border border-gray-100 flex space-x-1 z-10"
            style={{
              boxShadow: '0 -4px 24px -4px rgba(0, 0, 0, 0.1), 0 -2px 8px -2px rgba(0, 0, 0, 0.05)'
            }}
          >
            {EMOJI_REACTIONS.map(({ emoji, label }) => (
              <motion.button
                key={emoji}
                onClick={() => handleReactionClick(emoji)}
                className="w-12 h-12 flex items-center justify-center hover:bg-gray-50 rounded-full transition-colors duration-200"
                whileHover={{ 
                  scale: 1.3,
                  transition: { 
                    type: "spring",
                    stiffness: 400,
                    damping: 17
                  }
                }}
                whileTap={{ scale: 0.95 }}
                title={label}
              >
                <div className="w-8 h-8 flex items-center justify-center text-2xl select-none will-change-transform">
                  {emoji}
                </div>
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-center space-x-2">
        {EMOJI_REACTIONS.map(({ emoji }) => {
          const count = getReactionCount(emoji);
          if (count > 0) {
            const isUserReaction = hasUserReacted(emoji);
            const canRemove = type === 'received' && isUserReaction;
            return (
              <motion.button
                key={emoji}
                onClick={() => canRemove && handleReactionClick(emoji)}
                onMouseEnter={() => canRemove && setHoveredEmoji(emoji)}
                onMouseLeave={() => setHoveredEmoji(null)}
                className={`flex items-center space-x-1 px-3 py-1.5 rounded-full text-sm font-medium bg-white shadow-lg transition-all duration-200 ${
                  isUserReaction
                    ? hoveredEmoji === emoji && canRemove
                      ? 'bg-red-50 text-red-800 hover:bg-red-100'
                      : 'text-blue-800 ring-1 ring-blue-100'
                    : 'text-gray-700 ring-1 ring-gray-100'
                } ${canRemove ? 'cursor-pointer hover:shadow-xl' : 'cursor-default'}`}
                style={{
                  boxShadow: '0 4px 12px -2px rgba(0, 0, 0, 0.08), 0 2px 6px -1px rgba(0, 0, 0, 0.05)'
                }}
              >
                {canRemove && hoveredEmoji === emoji ? (
                  <>
                    <X size={14} className="mr-1" />
                    <span>Remove</span>
                  </>
                ) : (
                  <>
                    <div className="flex items-center justify-center select-none will-change-transform">
                      <span className="text-base">{emoji}</span>
                    </div>
                    <span>{count}</span>
                  </>
                )}
              </motion.button>
            );
          }
          return null;
        })}
        
        <AnimatePresence>
          {!userHasReacted && shouldShowReactButton && (
            <motion.button
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.2 }}
              onClick={() => setOpenVibeId(isOpen ? null : vibeId)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white shadow-lg hover:bg-gray-50 text-sm font-medium text-gray-700 transition-colors ring-1 ring-gray-100 ${
                hasAnyReactions ? 'ml-2' : ''
              }`}
              style={{
                boxShadow: '0 4px 12px -2px rgba(0, 0, 0, 0.08), 0 2px 6px -1px rgba(0, 0, 0, 0.05)'
              }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <PlusCircle size={16} />
              <span>React</span>
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default EmojiReactions;