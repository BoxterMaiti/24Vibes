import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Crown, Trophy, Users, Calendar, MapPin } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { LeaderboardEntry, VIBER_LEVELS, TimeFilter, TimeRange, TimeFilterState, LOCATIONS } from '../types';
import { getAllVibes } from '../services/vibeService';
import { getAllUsers } from '../services/colleagueService';
import Card3D from './Card3D';
import LevelProgressModal from './LevelProgressModal';

const Leaderboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'makers' | 'catchers'>('makers');
  const [timeFilter, setTimeFilter] = useState<TimeFilterState>({ type: 'all' });
  const [selectedLocation, setSelectedLocation] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [userRank, setUserRank] = useState<LeaderboardEntry | null>(null);
  const [showLevelProgress, setShowLevelProgress] = useState(false);
  const { currentUser } = useAuth();

  // Get time range based on filter
  const getTimeRange = (filter: TimeFilterState): TimeRange => {
    const now = new Date();
    const start = new Date();
    
    switch (filter.type) {
      case 'month':
        if (filter.selectedYear && filter.selectedMonth !== undefined) {
          start.setFullYear(filter.selectedYear, filter.selectedMonth, 1);
          const end = new Date(start);
          end.setMonth(end.getMonth() + 1);
          end.setDate(0); // Last day of the selected month
          return { start, end };
        }
        return { start: now, end: now }; // Invalid state, return current date
      case 'year':
        if (filter.selectedYear) {
          start.setFullYear(filter.selectedYear, 0, 1);
          const end = new Date(start);
          end.setFullYear(end.getFullYear() + 1, 0, 0);
          return { start, end };
        }
        return { start: now, end: now }; // Invalid state, return current date
      default:
        start.setFullYear(2000); // Far enough in the past to include all vibes
        return { start, end: now };
    }
  };

  useEffect(() => {
    async function loadLeaderboard() {
      try {
        setLoading(true);
        setError(null);

        const [vibes, users] = await Promise.all([
          getAllVibes(),
          getAllUsers()
        ]);

        const timeRange = getTimeRange(timeFilter);

        // Create a map of user data
        const userMap = new Map(users.map(user => [
          user.email,
          {
            name: user.colleague?.name || user.colleague?.["display name"] || user.email.split('@')[0],
            avatar: user.colleague?.avatar,
            department: user.colleague?.department,
            location: user.colleague?.location || 'Unknown'
          }
        ]));

        // Count vibes for each user within the time range and location filter
        const vibeCounts = new Map<string, number>();
        vibes.forEach(vibe => {
          const vibeDate = new Date(vibe.createdAt);
          if (vibeDate >= timeRange.start && vibeDate <= timeRange.end) {
            const key = activeTab === 'makers' ? vibe.sender : vibe.recipient;
            const userData = userMap.get(key);
            
            // Apply location filter
            if (selectedLocation === 'all' || userData?.location === selectedLocation) {
              vibeCounts.set(key, (vibeCounts.get(key) || 0) + 1);
            }
          }
        });

        // Create leaderboard entries
        const entries: LeaderboardEntry[] = Array.from(vibeCounts.entries())
          .map(([email, count]) => {
            const userData = userMap.get(email) || { 
              name: email.split('@')[0],
              location: 'Unknown'
            };
            const level = VIBER_LEVELS.reduce((current, next) => 
              count >= next.requirement ? next : current
            );
            const nextLevel = VIBER_LEVELS[VIBER_LEVELS.indexOf(level) + 1];
            const progress = nextLevel ? 
              ((count - level.requirement) / (nextLevel.requirement - level.requirement)) * 100 : 
              100;

            return {
              userId: email,
              email,
              name: userData.name,
              avatar: userData.avatar,
              department: userData.department,
              location: userData.location,
              count,
              level,
              progress: Math.min(progress, 100)
            };
          })
          .sort((a, b) => b.count - a.count);

        setLeaderboard(entries);

        // Set user rank
        if (currentUser?.email) {
          const userEntry = entries.find(entry => entry.email === currentUser.email);
          if (userEntry) {
            setUserRank(userEntry);
          }
        }
      } catch (err) {
        console.error('Error loading leaderboard:', err);
        setError('Failed to load leaderboard data');
      } finally {
        setLoading(false);
      }
    }

    loadLeaderboard();
  }, [activeTab, timeFilter, selectedLocation, currentUser]);

  const mvp = leaderboard[0];
  const topContenders = leaderboard.slice(1, 11);

  const getTimeFilterLabel = (filter: TimeFilterState): string => {
    switch (filter.type) {
      case 'month':
        if (filter.selectedYear && filter.selectedMonth !== undefined) {
          return new Date(filter.selectedYear, filter.selectedMonth).toLocaleString('default', { 
            month: 'long', 
            year: 'numeric' 
          });
        }
        return 'Select Month';
      case 'year':
        return filter.selectedYear?.toString() || 'Select Year';
      default:
        return 'All Time';
    }
  };

  // Generate month options
  const months = Array.from({ length: 12 }, (_, i) => ({
    value: i,
    label: new Date(2000, i).toLocaleString('default', { month: 'long' })
  }));

  // Generate year options (from 2020 to current year)
  const currentYear = new Date().getFullYear();
  const years = Array.from(
    { length: currentYear - 2020 + 1 }, 
    (_, i) => 2020 + i
  ).reverse();

  const handleTimeFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    if (value === 'all') {
      setTimeFilter({ type: 'all' });
    } else if (value === 'month') {
      setTimeFilter({ 
        type: 'month', 
        selectedMonth: new Date().getMonth(),
        selectedYear: new Date().getFullYear()
      });
    } else if (value === 'year') {
      setTimeFilter({ 
        type: 'year',
        selectedYear: new Date().getFullYear()
      });
    }
  };

  const handleLocationChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedLocation(e.target.value);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div className="flex space-x-4">
          <button
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              activeTab === 'makers'
                ? 'bg-gray-800 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
            onClick={() => setActiveTab('makers')}
          >
            Vibe Makers
          </button>
          <button
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              activeTab === 'catchers'
                ? 'bg-gray-800 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
            onClick={() => setActiveTab('catchers')}
          >
            Vibe Catchers
          </button>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 bg-white rounded-lg shadow-sm border border-gray-200 p-2">
            <Calendar size={16} className="text-gray-500" />
            <select
              value={timeFilter.type}
              onChange={handleTimeFilterChange}
              className="bg-transparent border-none text-sm font-medium text-gray-700 focus:ring-0 cursor-pointer pr-8"
            >
              <option value="all">All Time</option>
              <option value="month">Choose Month</option>
              <option value="year">Choose Year</option>
            </select>
          </div>

          <div className="flex items-center gap-2 bg-white rounded-lg shadow-sm border border-gray-200 p-2">
            <MapPin size={16} className="text-gray-500" />
            <select
              value={selectedLocation}
              onChange={handleLocationChange}
              className="bg-transparent border-none text-sm font-medium text-gray-700 focus:ring-0 cursor-pointer pr-8"
            >
              <option value="all">Global</option>
              {LOCATIONS.map(location => (
                <option key={location} value={location}>{location}</option>
              ))}
            </select>
          </div>

          {timeFilter.type === 'month' && (
            <div className="flex gap-2">
              <select
                value={timeFilter.selectedMonth}
                onChange={(e) => setTimeFilter({
                  ...timeFilter,
                  selectedMonth: parseInt(e.target.value)
                })}
                className="bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 focus:ring-0 cursor-pointer p-2"
              >
                {months.map((month) => (
                  <option key={month.value} value={month.value}>
                    {month.label}
                  </option>
                ))}
              </select>
              <select
                value={timeFilter.selectedYear}
                onChange={(e) => setTimeFilter({
                  ...timeFilter,
                  selectedYear: parseInt(e.target.value)
                })}
                className="bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 focus:ring-0 cursor-pointer p-2"
              >
                {years.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>
          )}

          {timeFilter.type === 'year' && (
            <select
              value={timeFilter.selectedYear}
              onChange={(e) => setTimeFilter({
                ...timeFilter,
                selectedYear: parseInt(e.target.value)
              })}
              className="bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 focus:ring-0 cursor-pointer p-2"
            >
              {years.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      ) : error ? (
        <div className="bg-red-100 text-red-700 p-4 rounded-lg">
          {error}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* MVP Card */}
          {mvp && (
            <Card3D className="lg:col-span-2">
              <motion.div 
                className="bg-gradient-to-br from-amber-100 to-yellow-100 rounded-xl p-6 shadow-lg border border-amber-200 h-[190px]"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <div className="flex items-center gap-4">
                  <div className="relative">
                    {mvp.avatar ? (
                      <img 
                        src={mvp.avatar} 
                        alt={mvp.name}
                        className="w-20 h-20 rounded-full border-4 border-amber-300"
                      />
                    ) : (
                      <div className="w-20 h-20 rounded-full bg-amber-200 flex items-center justify-center border-4 border-amber-300">
                        <Users className="w-10 h-10 text-amber-500" />
                      </div>
                    )}
                    <Crown className="absolute -top-2 -right-2 w-8 h-8 text-amber-500" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-gray-800">{mvp.name}</div>
                    <div className="text-gray-600">{mvp.department || 'MVP Viber'}</div>
                    <div className="mt-2 flex items-center gap-2">
                      <Trophy className="w-5 h-5 text-amber-500" />
                      <span className="font-medium text-amber-700">
                        {mvp.count} {activeTab === 'makers' ? 'Vibes Sent' : 'Vibes Received'}
                      </span>
                    </div>
                    <div className="mt-1 text-sm font-medium text-amber-600">
                      Level {VIBER_LEVELS.indexOf(mvp.level) + 1}: {mvp.level.name}
                    </div>
                  </div>
                </div>
                <div className="mt-4 text-sm text-amber-700">
                  {selectedLocation === 'all' ? 'Global' : selectedLocation} • {getTimeFilterLabel(timeFilter)}
                </div>
              </motion.div>
            </Card3D>
          )}

          {/* User Stats Card */}
          {userRank && (
            <Card3D>
              <motion.div 
                className={`${userRank.level.color.replace('bg-', 'bg-opacity-15 bg-')} rounded-xl p-6 shadow-lg border border-gray-200 cursor-pointer h-[190px]`}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                onClick={() => setShowLevelProgress(true)}
              >
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Your Stats</h3>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    {userRank.avatar ? (
                      <img 
                        src={userRank.avatar} 
                        alt={userRank.name}
                        className="w-12 h-12 rounded-full"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
                        <Users className="w-6 h-6 text-gray-500" />
                      </div>
                    )}
                    <div>
                      <div className="font-medium">{userRank.name}</div>
                      <div className="text-sm text-gray-500">
                        Rank #{leaderboard.findIndex(e => e.email === userRank.email) + 1}
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium">{userRank.level.name}</span>
                      <span className="text-gray-500">
                        {userRank.count} {activeTab === 'makers' ? 'Sent' : 'Received'}
                      </span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${userRank.level.color} transition-all duration-500`}
                        style={{ width: `${userRank.progress}%` }}
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
            </Card3D>
          )}

          {/* Level Progress Modal */}
          {userRank && (
            <LevelProgressModal
              isOpen={showLevelProgress}
              onClose={() => setShowLevelProgress(false)}
              userStats={userRank}
            />
          )}

          {/* Top Contenders */}
          <motion.div 
            className="lg:col-span-3 bg-white rounded-xl shadow-lg border border-gray-200"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800">Top Contenders</h3>
              <div className="text-sm text-gray-500 mt-1">
                {selectedLocation === 'all' ? 'Global' : selectedLocation} • {getTimeFilterLabel(timeFilter)}
              </div>
            </div>
            <div className="divide-y divide-gray-200">
              {topContenders.map((entry, index) => (
                <div key={entry.email} className="p-4 flex items-center gap-4">
                  <div className="w-8 text-center font-medium text-gray-500">
                    {index + 2}
                  </div>
                  <div className="flex-1 flex items-center gap-3">
                    {entry.avatar ? (
                      <img 
                        src={entry.avatar} 
                        alt={entry.name}
                        className="w-10 h-10 rounded-full"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                        <Users className="w-5 h-5 text-gray-500" />
                      </div>
                    )}
                    <div>
                      <div className="font-medium">{entry.name}</div>
                      <div className="text-sm text-gray-500">{entry.department}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">
                      {entry.count} {activeTab === 'makers' ? 'Sent' : 'Received'}
                    </div>
                    <div className="text-sm text-gray-500">Level {VIBER_LEVELS.indexOf(entry.level) + 1}</div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default Leaderboard;