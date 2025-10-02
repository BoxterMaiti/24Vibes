import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PlusCircle, X, Plus } from 'lucide-react';
import { EmojiPicker } from 'frimousse';
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
  const [showCustomPicker, setShowCustomPicker] = useState(false);
  const { currentUser } = useAuth();
  const { openVibeId, setOpenVibeId } = useEmojiMenu();
  const menuRef = useRef<HTMLDivElement>(null);
  const pickerRef = useRef<HTMLDivElement>(null);

  const isOpen = openVibeId === vibeId;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      const clickedInMenu = menuRef.current && menuRef.current.contains(target);
      const clickedInPicker = pickerRef.current && pickerRef.current.contains(target);
      
      if (!clickedInMenu && !clickedInPicker) {
        setOpenVibeId(null);
        setShowCustomPicker(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [setOpenVibeId, showCustomPicker]);

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
      setOpenVibeId(null);
      setShowCustomPicker(false);
    } catch (error) {
      console.error('Error handling reaction:', error);
    }
  };

  const handleCustomEmojiSelect = async (emoji: any) => {
    console.log('Custom emoji selected via onEmojiSelect!', emoji);
    console.log('Full emoji object:', JSON.stringify(emoji, null, 2));
    
    const emojiChar = emoji.native || emoji.emoji || emoji.char || emoji;
    console.log('Using emoji char:', emojiChar);
    
    if (emojiChar && typeof emojiChar === 'string') {
      console.log('Calling handleReactionClick with:', emojiChar);
      await handleReactionClick(emojiChar);
    } else {
      console.error('No valid emoji character found!', emoji);
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
  const shouldShowReactButton = (showReactButton || isOpen || showCustomPicker) && canShowReactButton;

  return (
    <div className="relative">
      <AnimatePresence>
        {isOpen && !showCustomPicker && (
          <motion.div
            ref={menuRef}
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
            className="absolute right-0 bottom-full mb-2 py-1 px-2 bg-white rounded-full shadow-xl border border-gray-100 flex items-center space-x-1 z-10"
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
            <div className="w-px h-8 bg-gray-200 mx-1" />
            <motion.button
              onClick={() => setShowCustomPicker(true)}
              className="w-12 h-12 flex items-center justify-center hover:bg-gray-50 rounded-full transition-colors duration-200"
              whileHover={{ 
                scale: 1.1,
                transition: { 
                  type: "spring",
                  stiffness: 400,
                  damping: 17
                }
              }}
              whileTap={{ scale: 0.95 }}
              title="More emojis"
            >
              <Plus className="w-5 h-5 text-gray-600" />
            </motion.button>
          </motion.div>
        )}
        
        {showCustomPicker && (
          <motion.div
            ref={pickerRef}
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ 
              type: "spring",
              stiffness: 300,
              damping: 25,
              duration: 0.3
            }}
            className="absolute right-0 bottom-full mb-2 shadow-2xl border border-gray-200 z-20 overflow-hidden rounded-xl bg-white"
            style={{
              boxShadow: '0 -8px 32px -8px rgba(0, 0, 0, 0.15), 0 -4px 16px -4px rgba(0, 0, 0, 0.1)'
            }}
          >
            <EmojiPicker.Root 
              className="isolate flex h-[368px] w-fit flex-col bg-white"
              onEmojiSelect={handleCustomEmojiSelect}
            >
              <EmojiPicker.Search 
                className="z-10 mx-2 mt-2 appearance-none rounded-md bg-neutral-100 px-2.5 py-2 text-sm" 
                placeholder="Search emojis..."
              />
              <EmojiPicker.Viewport className="relative flex-1 outline-hidden">
                <EmojiPicker.Loading className="absolute inset-0 flex items-center justify-center text-neutral-400 text-sm">
                  Loading…
                </EmojiPicker.Loading>
                <EmojiPicker.Empty className="absolute inset-0 flex items-center justify-center text-neutral-400 text-sm">
                  No emoji found.
                </EmojiPicker.Empty>
                <EmojiPicker.List
                  className="select-none pb-1.5"
                  components={{
                    CategoryHeader: ({ category, ...props }) => (
                      <div
                        className="bg-white px-3 pt-3 pb-1.5 font-medium text-neutral-600 text-xs"
                        {...props}
                      >
                        {category.label}
                      </div>
                    ),
                    Row: ({ children, ...props }) => (
                      <div className="scroll-my-1.5 px-1.5" {...props}>
                        {children}
                      </div>
                    ),
                    Emoji: ({ emoji, ...props }) => (
                      <button
                        className="flex size-8 items-center justify-center rounded-md text-lg data-[active]:bg-neutral-100"
                        {...props}
                      >
                        {emoji.native || emoji.emoji}
                      </button>
                    ),
                  }}
                />
              </EmojiPicker.Viewport>
            </EmojiPicker.Root>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-center space-x-2">
        {/* Get all unique emojis from reactions */}
        {Array.from(new Set(reactions.map(r => r.emoji))).map((emoji) => {
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
          {!userHasReacted && shouldShowReactButton && !showCustomPicker && (
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
          
          {!userHasReacted && shouldShowReactButton && showCustomPicker && (
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white shadow-lg text-sm font-medium text-gray-700 ring-1 ring-gray-100 ${
              hasAnyReactions ? 'ml-2' : ''
            }`}
            style={{
              boxShadow: '0 4px 12px -2px rgba(0, 0, 0, 0.08), 0 2px 6px -1px rgba(0, 0, 0, 0.05)'
            }}>
              <PlusCircle size={16} />
              <span>React</span>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default EmojiReactions;