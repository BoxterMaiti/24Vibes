import React, { useState, useEffect } from 'react';
import { X, Eye, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { CardTemplate, CategoryType, categoryBackgroundColors, categoryIcons, categoryColors, Colleague } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { createVibe } from '../services/vibeService';
import { getAllUsers } from '../services/colleagueService';
import ColleagueSelector from './ColleagueSelector';

interface CardModalProps {
  isOpen: boolean;
  onClose: () => void;
  template: CardTemplate | null;
  category?: string;
}

const CardModal: React.FC<CardModalProps> = ({ isOpen, onClose, template, category }) => {
  const [selectedColleague, setSelectedColleague] = useState<Colleague | null>(null);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [colleagues, setColleagues] = useState<Colleague[]>([]);
  const [loading, setLoading] = useState(true);
  const { currentUser } = useAuth();

  useEffect(() => {
    async function fetchColleagues() {
      try {
        setLoading(true);
        
        // Get users from the same source as the manage people page
        const users = await getAllUsers();
        
        // Convert user data to colleague format
        const colleaguesList = users
          .filter(user => user.colleague) // Only include users with valid colleague data
          .map(user => user.colleague as Colleague); // Type assertion since we filtered out nulls
        
        setColleagues(colleaguesList);
      } catch (error) {
        console.error('Error loading colleagues:', error);
        setError('Failed to load colleagues. Please try again.');
      } finally {
        setLoading(false);
      }
    }

    if (isOpen) {
      fetchColleagues();
    }
  }, [isOpen]);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setSelectedColleague(null);
      setMessage('');
      setError('');
      setSuccess(false);
    }
  }, [isOpen]);

  // For blank card (start from scratch)
  const isBlankCard = !template;
  const cardMessage = isBlankCard 
    ? '' 
    : (template && category ? template[category as keyof CardTemplate] as string : '');
  
  const bgColorClass = category 
    ? categoryBackgroundColors[category as CategoryType] 
    : 'bg-white';

  // Get the appropriate icon for the category
  const CategoryIcon = category ? categoryIcons[category as CategoryType] : Users;

  const handleSend = async () => {
    if (!selectedColleague) {
      setError('Please select a recipient');
      return;
    }

    if (!currentUser) {
      setError('You must be logged in to send a vibe');
      return;
    }

    if (!cardMessage && !isBlankCard) {
      setError('Card message is required');
      return;
    }

    try {
      setSending(true);
      setError('');
      setSuccess(false);
      
      // Make sure we have valid data for all required fields
      const senderEmail = currentUser.email || '';
      
      // Debug the selected colleague object
      console.log("Selected colleague:", selectedColleague);
      
      // Ensure we have a valid email - check all possible properties
      let recipientEmail = '';
      if (selectedColleague) {
        if (typeof selectedColleague.email === 'string' && selectedColleague.email.trim() !== '') {
          recipientEmail = selectedColleague.email.trim();
        } else if (typeof selectedColleague.Email === 'string' && selectedColleague.Email.trim() !== '') {
          recipientEmail = selectedColleague.Email.trim();
        } else if (typeof selectedColleague['email address'] === 'string' && selectedColleague['email address'].trim() !== '') {
          recipientEmail = selectedColleague['email address'].trim();
        }
      }
      
      if (!recipientEmail) {
        console.error("No valid email found in colleague object:", selectedColleague);
        setError('Recipient email is missing or invalid. Please select another colleague.');
        setSending(false);
        return;
      }
      
      const categoryValue = category || 'Custom';
      const messageValue = cardMessage || 'Custom message';
      const personalMessageValue = message || '';
      const templateId = template?.id || null;
      
      console.log("Sending vibe with data:", {
        message: messageValue,
        sender: senderEmail,
        recipient: recipientEmail,
        category: categoryValue,
        personalMessage: personalMessageValue,
        templateId: templateId
      });
      
      try {
        // Wrap in try/catch to get detailed error information
        const result = await createVibe(
          messageValue,
          senderEmail,
          recipientEmail,
          categoryValue,
          personalMessageValue,
          templateId
        );
        
        console.log("Vibe created successfully:", result);
        setSuccess(true);
        
        // Close the modal after sending with a slight delay to show success
        setTimeout(() => {
          onClose();
        }, 1500);
      } catch (vibeError: any) {
        // Log the full error object to see what's happening
        console.error("Detailed vibe error:", vibeError);
        console.error("Error message:", vibeError?.message);
        console.error("Error code:", vibeError?.code);
        
        if (vibeError?.code === 'permission-denied') {
          setError('Permission denied. You may not have access to write to the database.');
          return;
        }
        
        // Try a fallback approach with minimal data
        try {
          console.log("Attempting fallback with minimal data");
          const result = await createVibe(
            messageValue,
            senderEmail,
            recipientEmail,
            "Custom",
            "",
            null
          );
          
          console.log("Fallback vibe created successfully:", result);
          setSuccess(true);
          setTimeout(() => {
            onClose();
          }, 1500);
        } catch (fallbackError: any) {
          console.error("Fallback also failed:", fallbackError);
          console.error("Fallback error message:", fallbackError?.message);
          console.error("Fallback error code:", fallbackError?.code);
          
          if (fallbackError?.code === 'permission-denied') {
            setError('Permission denied. You may not have access to write to the database.');
          } else {
            setError(`Failed to send vibe: ${fallbackError?.message || 'Unknown error'}`);
          }
        }
      }
    } catch (error: any) {
      console.error('Error sending vibe:', error);
      setError(`Failed to send vibe: ${error?.message || 'Unknown error'}`);
    } finally {
      setSending(false);
    }
  };

  // Animation variants for the modal
  const modalVariants = {
    hidden: { y: "100%", opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1,
      transition: { 
        type: "spring", 
        damping: 25, 
        stiffness: 300,
        ease: "easeOut" 
      }
    },
    exit: { 
      y: "100%", 
      opacity: 0,
      transition: { 
        ease: "easeIn",
        duration: 0.3
      }
    }
  };

  // Backdrop animation
  const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
    exit: { opacity: 0, transition: { duration: 0.2 } }
  };

  return (
    <AnimatePresence mode="wait">
      {isOpen && (
        <motion.div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          initial="hidden"
          animate="visible"
          exit="exit"
          variants={backdropVariants}
        >
          <motion.div 
            className="bg-white rounded-lg shadow-xl w-full max-w-4xl overflow-hidden"
            variants={modalVariants}
          >
            <div className="flex flex-col md:flex-row">
              {/* Card preview - left side */}
              <div className={`w-full md:w-2/5 p-8 ${bgColorClass} flex flex-col`}>
                <div className="flex-grow">
                  <div className={`inline-block px-3 py-1 rounded-full text-xs mb-4 ${category ? categoryColors[category as CategoryType] : 'bg-gray-200 text-gray-700'}`}>
                    {category || 'Custom'}
                  </div>
                  <h3 className="text-2xl font-medium text-gray-800 mb-4">
                    {cardMessage || 'Write your own message...'}
                  </h3>
                </div>
                
                {/* Category icon at the bottom */}
                <div className="flex justify-center mt-auto">
                  <CategoryIcon className="w-32 h-32 text-gray-800 opacity-20" />
                </div>
              </div>
              
              {/* Form - right side */}
              <div className="w-full md:w-3/5 p-8 relative">
                <button 
                  onClick={onClose}
                  className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
                >
                  <X size={24} />
                </button>
                
                {error && (
                  <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
                    {error}
                  </div>
                )}
                
                {success && (
                  <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-md">
                    Vibe sent successfully!
                  </div>
                )}
                
                <div className="mb-6">
                  <label className="block text-gray-700 text-lg font-medium mb-2">
                    To
                  </label>
                  {loading ? (
                    <div className="flex items-center justify-center p-4">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                      <span className="ml-2 text-gray-600">Loading colleagues...</span>
                    </div>
                  ) : colleagues.length === 0 ? (
                    <div className="p-4 bg-yellow-50 text-yellow-700 rounded-md">
                      No colleagues found. Please try again later.
                    </div>
                  ) : (
                    <ColleagueSelector 
                      colleagues={colleagues}
                      onSelect={setSelectedColleague}
                      selectedColleague={selectedColleague}
                    />
                  )}
                </div>
                
                <div className="mb-6">
                  <label className="block text-gray-700 text-lg font-medium mb-2">
                    Message <span className="text-gray-500 font-normal">(optional)</span>
                  </label>
                  <textarea
                    placeholder="Share how their actions made you feel."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 h-32 resize-none"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                  />
                  <div className="flex items-center mt-2 text-gray-500">
                    <Eye size={16} className="mr-2" />
                    <span className="text-sm">Your message will be visible to your team managers and higher-ups.</span>
                  </div>
                </div>
                
                <div className="flex justify-end space-x-4">
                  <button
                    onClick={onClose}
                    className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50"
                    disabled={sending}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSend}
                    className="px-6 py-2 bg-blue-600 rounded-lg text-white font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={!selectedColleague || sending}
                  >
                    {sending ? (
                      <span className="flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Sending...
                      </span>
                    ) : 'Send'}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CardModal;