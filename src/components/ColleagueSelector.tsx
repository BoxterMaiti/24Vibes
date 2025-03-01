import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Users } from 'lucide-react';
import { Colleague } from '../types';

interface ColleagueSelectorProps {
  colleagues: Colleague[];
  onSelect: (colleague: Colleague | null) => void;
  selectedColleague: Colleague | null;
}

const ColleagueSelector: React.FC<ColleagueSelectorProps> = ({ 
  colleagues, 
  onSelect,
  selectedColleague
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [filteredColleagues, setFilteredColleagues] = useState<Colleague[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Filter colleagues based on search term
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredColleagues(colleagues.slice(0, 20)); // Show first 20 by default
      return;
    }
    
    const searchTermLower = searchTerm.toLowerCase();
    
    const filtered = colleagues.filter(colleague => {
      if (!colleague) return false;
      
      // Safely check each property before calling toLowerCase()
      const nameMatch = colleague.name ? colleague.name.toLowerCase().includes(searchTermLower) : false;
      const displayNameMatch = colleague["display name"] ? colleague["display name"].toLowerCase().includes(searchTermLower) : false;
      const displayNameCapMatch = colleague["Display name"] ? colleague["Display name"].toLowerCase().includes(searchTermLower) : false;
      const emailMatch = colleague.email ? colleague.email.toLowerCase().includes(searchTermLower) : false;
      const emailCapMatch = colleague.Email ? colleague.Email.toLowerCase().includes(searchTermLower) : false;
      const departmentMatch = colleague.department ? colleague.department.toLowerCase().includes(searchTermLower) : false;
      const departmentCapMatch = colleague.Department ? colleague.Department.toLowerCase().includes(searchTermLower) : false;
      
      return nameMatch || displayNameMatch || displayNameCapMatch || emailMatch || emailCapMatch || departmentMatch || departmentCapMatch;
    });
    
    setFilteredColleagues(filtered);
  }, [searchTerm, colleagues]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setIsDropdownOpen(true);
  };

  const handleColleagueSelect = (colleague: Colleague) => {
    // Ensure the colleague has a valid email before selecting
    if (!colleague.email && !colleague.Email && !colleague['email address']) {
      console.error("Selected colleague has no email:", colleague);
      // You could show an error message here
      return;
    }
    
    // Log the colleague being selected to help with debugging
    console.log("Selecting colleague:", colleague);
    
    onSelect(colleague);
    setSearchTerm('');
    setIsDropdownOpen(false);
  };

  const clearSelection = () => {
    onSelect(null);
  };

  // Helper function to get the display name from various possible fields
  const getDisplayName = (colleague: Colleague): string => {
    if (!colleague) return "Unknown";
    
    return colleague.name || 
           colleague["display name"] || 
           colleague["Display name"] || 
           (colleague.email ? colleague.email.split('@')[0] : "Unknown");
  };

  // Helper function to get the job title from various possible fields
  const getJobTitle = (colleague: Colleague): string => {
    if (!colleague) return "Team Member";
    
    return colleague.position || 
           colleague["job title"] || 
           colleague["Job title"] || 
           'Team Member';
  };

  // Helper function to get the department from various possible fields
  const getDepartment = (colleague: Colleague): string => {
    if (!colleague) return "";
    
    return colleague.department || 
           colleague.Department || 
           '';
  };

  // Helper function to get the email from various possible fields
  const getEmail = (colleague: Colleague): string => {
    if (!colleague) return "";
    
    return colleague.email || 
           colleague.Email || 
           colleague['email address'] || 
           '';
  };

  // Helper function to get the avatar from various possible fields
  const getAvatar = (colleague: Colleague): string | undefined => {
    if (!colleague) return undefined;
    
    return colleague.avatar || 
           colleague["Avatar URL"] || 
           colleague["avatar_url"] || 
           undefined;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {selectedColleague && selectedColleague.id ? (
        <div className="flex items-center p-3 border border-gray-300 rounded-lg">
          {getAvatar(selectedColleague) ? (
            <img 
              src={getAvatar(selectedColleague)} 
              alt={getDisplayName(selectedColleague)}
              className="w-8 h-8 rounded-full mr-3"
              onError={(e) => {
                // Replace with placeholder if image fails to load
                (e.target as HTMLImageElement).src = 'https://via.placeholder.com/40';
              }}
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center mr-3">
              <Users size={16} className="text-gray-500" />
            </div>
          )}
          <div className="flex-1">
            <div className="font-medium">{getDisplayName(selectedColleague)}</div>
            <div className="text-sm text-gray-500">{getEmail(selectedColleague)}</div>
          </div>
          <button 
            onClick={clearSelection}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={18} />
          </button>
        </div>
      ) : (
        <>
          <div className="relative">
            <input
              type="text"
              placeholder="Search colleagues by name or email"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 pl-10"
              value={searchTerm}
              onChange={handleInputChange}
              onFocus={() => setIsDropdownOpen(true)}
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={20} className="text-gray-400" />
            </div>
          </div>
          
          {isDropdownOpen && (
            <div className="absolute z-10 mt-1 w-full bg-white rounded-md shadow-lg max-h-60 overflow-auto">
              {filteredColleagues.length > 0 ? (
                <ul className="py-1">
                  {filteredColleagues.map(colleague => (
                    <li 
                      key={colleague.id}
                      className="px-4 py-2 hover:bg-gray-100 cursor-pointer flex items-center"
                      onClick={() => handleColleagueSelect(colleague)}
                    >
                      {getAvatar(colleague) ? (
                        <img 
                          src={getAvatar(colleague)} 
                          alt={getDisplayName(colleague)}
                          className="w-8 h-8 rounded-full mr-3"
                          onError={(e) => {
                            // Replace with placeholder if image fails to load
                            (e.target as HTMLImageElement).src = 'https://via.placeholder.com/40';
                          }}
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center mr-3">
                          <Users size={16} className="text-gray-500" />
                        </div>
                      )}
                      <div>
                        <div className="font-medium">{getDisplayName(colleague)}</div>
                        <div className="text-sm text-gray-500">
                          {getDepartment(colleague) ? `${getDepartment(colleague)} • ` : ''}
                          {getJobTitle(colleague)}
                        </div>
                        <div className="text-xs text-gray-400">
                          {getEmail(colleague)}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="px-4 py-3 text-sm text-gray-500">
                  No colleagues found
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ColleagueSelector;