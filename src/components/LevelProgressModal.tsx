import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trophy, Star, Users } from 'lucide-react';
import { VIBER_LEVELS, LeaderboardEntry } from '../types';

interface LevelProgressModalProps {
  isOpen: boolean;
  onClose: () => void;
  userStats: LeaderboardEntry;
}

const LevelProgressModal: React.FC<LevelProgressModalProps> = ({
  isOpen,
  onClose,
  userStats
}) => {
  const currentLevelIndex = VIBER_LEVELS.findIndex(level => level.name === userStats.level.name);
  const nextLevel = VIBER_LEVELS[currentLevelIndex + 1];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div 
            className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
          >
            <div className="p-6 border-b border-gray-200 flex-shrink-0">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <Trophy className="w-6 h-6 text-blue-500" />
                  <h2 className="text-xl font-bold text-gray-800">Your Level Progress</h2>
                </div>
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-500 transition-colors"
                >
                  <X size={24} />
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto">
              {/* Current Level */}
              <div className="mb-8">
                <div className="flex items-center gap-4 mb-4">
                  {userStats.avatar ? (
                    <img 
                      src={userStats.avatar} 
                      alt={userStats.name}
                      className="w-16 h-16 rounded-full"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center">
                      <Users className="w-8 h-8 text-gray-500" />
                    </div>
                  )}
                  <div>
                    <div className="text-lg font-medium">{userStats.name}</div>
                    <div className="text-gray-500">{userStats.department}</div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-100">
                  <div className="flex items-center gap-2 mb-2">
                    <Star className="w-5 h-5 text-blue-500" />
                    <span className="font-medium text-blue-700">Current Level: {userStats.level.name}</span>
                  </div>
                  <div className="text-sm text-blue-600 mb-3">
                    {userStats.count} vibes {nextLevel ? `/ ${nextLevel.requirement} needed for next level` : '(Max level reached!)'}
                  </div>
                  <div className="h-2 bg-blue-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-blue-500 transition-all duration-500"
                      style={{ width: `${userStats.progress}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Level Progress List */}
              <div className="space-y-4">
                {VIBER_LEVELS.map((level, index) => {
                  const isCurrentLevel = level.name === userStats.level.name;
                  const isCompleted = userStats.count >= level.requirement;
                  const isNextLevel = index === currentLevelIndex + 1;

                  return (
                    <div 
                      key={level.name}
                      className={`p-4 rounded-lg border transition-colors ${
                        isCurrentLevel
                          ? 'bg-blue-50 border-blue-200'
                          : isCompleted
                          ? 'bg-green-50 border-green-200'
                          : 'bg-gray-50 border-gray-200'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            isCompleted
                              ? 'bg-green-100 text-green-600'
                              : isCurrentLevel
                              ? 'bg-blue-100 text-blue-600'
                              : 'bg-gray-200 text-gray-500'
                          }`}>
                            {index + 1}
                          </div>
                          <div>
                            <div className="font-medium">{level.name}</div>
                            <div className="text-sm text-gray-500">
                              {level.requirement} vibes required
                            </div>
                          </div>
                        </div>
                        {isCompleted && (
                          <Trophy className="w-5 h-5 text-green-500" />
                        )}
                        {isNextLevel && (
                          <div className="text-sm font-medium text-blue-600">
                            Next level!
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default LevelProgressModal;