import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Users, Search, Shield, ShieldOff, UserCheck, RefreshCw, MessageSquare, MoreVertical } from 'lucide-react';
import PageTransition from '../components/PageTransition';
import { useAuth } from '../contexts/AuthContext';
import { getAllUsers, updateUserAdminStatus } from '../services/colleagueService';
import { Colleague } from '../types';
import ConfirmationDialog from '../components/ConfirmationDialog';
import UserVibesModal from '../components/UserVibesModal';

interface UserData {
  userId: string;
  email: string;
  colleagueId: string;
  isAdmin: boolean;
  colleague: Colleague | null;
}

interface ConfirmationState {
  isOpen: boolean;
  userId: string;
  currentStatus: boolean;
  userName: string;
}

const ManagePeoplePage: React.FC = () => {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [processingUser, setProcessingUser] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<{
    email: string;
    colleague: Colleague | null;
  } | null>(null);
  const [confirmation, setConfirmation] = useState<ConfirmationState>({
    isOpen: false,
    userId: '',
    currentStatus: false,
    userName: ''
  });
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  useEffect(() => {
    if (!isAdmin) {
      navigate('/');
    }
  }, [isAdmin, navigate]);

  useEffect(() => {
    async function loadUsers() {
      try {
        setLoading(true);
        setError(null);
        const allUsers = await getAllUsers();
        setUsers(allUsers);
      } catch (err) {
        console.error('Error loading users:', err);
        setError('Failed to load users. Please try again.');
      } finally {
        setLoading(false);
      }
    }
    
    loadUsers();
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (openMenuId && !(event.target as Element).closest('.action-menu')) {
        setOpenMenuId(null);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [openMenuId]);

  const filteredUsers = users.filter(user => {
    if (!user.email) return false;
    
    const searchLower = searchTerm.toLowerCase();
    const email = user.email.toLowerCase();
    const name = user.colleague?.name?.toLowerCase() || 
                user.colleague?.["display name"]?.toLowerCase() || 
                user.colleague?.["Display name"]?.toLowerCase() || '';
    const department = user.colleague?.department?.toLowerCase() || 
                      user.colleague?.Department?.toLowerCase() || '';
    
    return email.includes(searchLower) || 
           name.includes(searchLower) || 
           department.includes(searchLower);
  });

  const openConfirmation = (userId: string, currentStatus: boolean) => {
    const user = users.find(u => u.userId === userId);
    if (!user) return;
    
    const userName = getDisplayName(user);
    setConfirmation({
      isOpen: true,
      userId,
      currentStatus,
      userName
    });
    setOpenMenuId(null);
  };

  const closeConfirmation = () => {
    setConfirmation(prev => ({
      ...prev,
      isOpen: false
    }));
  };

  const handleToggleAdmin = async () => {
    try {
      const { userId, currentStatus, userName } = confirmation;
      closeConfirmation();
      setProcessingUser(userId);
      setSuccessMessage(null);
      setError(null);
      
      const newStatus = !currentStatus;
      const success = await updateUserAdminStatus(userId, newStatus);
      
      if (success) {
        setUsers(prevUsers => 
          prevUsers.map(user => 
            user.userId === userId 
              ? { ...user, isAdmin: newStatus } 
              : user
          )
        );
        
        setSuccessMessage(`${userName}'s admin status updated successfully to ${newStatus ? 'admin' : 'regular user'}.`);
        setTimeout(() => {
          setSuccessMessage(null);
        }, 3000);
      } else {
        setError('Failed to update user admin status. Please try again.');
      }
    } catch (err) {
      console.error('Error updating admin status:', err);
      setError('An error occurred while updating admin status.');
    } finally {
      setProcessingUser(null);
    }
  };

  const handleRefresh = async () => {
    try {
      setLoading(true);
      setError(null);
      setSuccessMessage(null);
      
      const allUsers = await getAllUsers();
      setUsers(allUsers);
      
      setSuccessMessage('User list refreshed successfully.');
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
    } catch (err) {
      console.error('Error refreshing users:', err);
      setError('Failed to refresh users. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getDisplayName = (user: UserData): string => {
    if (user.colleague) {
      return user.colleague.name || 
             user.colleague["display name"] || 
             user.colleague["Display name"] || 
             (user.email ? user.email.split('@')[0] : 'Unknown User');
    }
    return user.email ? user.email.split('@')[0] : 'Unknown User';
  };

  return (
    <PageTransition>
      <div className="min-h-screen bg-gray-50 pt-4">
        <div className="max-w-[90rem] mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Link to="/" className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-6">
            <ArrowLeft size={20} className="mr-2" />
            Back to home
          </Link>
          
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
              <div className="flex items-center">
                <Users size={24} className="text-blue-600 mr-2" />
                <h2 className="text-2xl font-bold text-gray-800">Manage People</h2>
              </div>
              
              <div className="flex items-center gap-2 w-full md:w-auto">
                <div className="relative flex-1 md:flex-initial">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search size={16} className="text-gray-400" />
                  </div>
                  <input
                    type="text"
                    placeholder="Search users..."
                    className="w-full md:w-64 pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                
                <button
                  onClick={handleRefresh}
                  disabled={loading}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50 whitespace-nowrap"
                >
                  <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
                  <span className="hidden sm:inline">Refresh</span>
                </button>
              </div>
            </div>
            
            {error && (
              <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
                {error}
              </div>
            )}
            
            {successMessage && (
              <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-md">
                {successMessage}
              </div>
            )}
            
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
              </div>
            ) : (
              <>
                {filteredUsers.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    {searchTerm ? 'No users match your search.' : 'No users found.'}
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-gray-50">
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/4">
                            User
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/4">
                            Email
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/4">
                            Department
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/8">
                            Status
                          </th>
                          <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-1/8">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {filteredUsers.map((user) => (
                          <tr key={user.userId} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="flex-shrink-0 h-10 w-10">
                                  {user.colleague?.avatar ? (
                                    <img 
                                      className="h-10 w-10 rounded-full" 
                                      src={user.colleague.avatar} 
                                      alt={getDisplayName(user)} 
                                      onError={(e) => {
                                        (e.target as HTMLImageElement).src = 'https://via.placeholder.com/40';
                                      }}
                                    />
                                  ) : (
                                    <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                                      <UserCheck size={20} className="text-gray-500" />
                                    </div>
                                  )}
                                </div>
                                <div className="ml-4">
                                  <div className="text-sm font-medium text-gray-900">
                                    {getDisplayName(user)}
                                  </div>
                                  {user.isAdmin && (
                                    <div className="text-xs text-blue-600 flex items-center mt-1">
                                      <Shield size={12} className="mr-1" />
                                      Admin
                                    </div>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">{user.email || 'No email'}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">
                                {user.colleague?.department || 
                                 user.colleague?.Department || 
                                 'Not specified'}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                user.isAdmin 
                                  ? 'bg-blue-100 text-blue-800' 
                                  : 'bg-gray-100 text-gray-800'
                              }`}>
                                {user.isAdmin ? 'Admin' : 'Regular User'}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <div className="flex items-center justify-end space-x-2">
                                <button
                                  onClick={() => setSelectedUser({
                                    email: user.email,
                                    colleague: user.colleague
                                  })}
                                  className="inline-flex items-center px-3 py-1 rounded-md text-sm font-medium bg-gray-100 text-gray-800 hover:bg-gray-200 transition-colors"
                                >
                                  <MessageSquare size={16} className="mr-1" />
                                  View Vibes
                                </button>
                                <div className="relative action-menu">
                                  <button
                                    onClick={() => setOpenMenuId(openMenuId === user.userId ? null : user.userId)}
                                    className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                                  >
                                    <MoreVertical size={16} className="text-gray-500" />
                                  </button>
                                  {openMenuId === user.userId && (
                                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10 border border-gray-200">
                                      <button
                                        onClick={() => openConfirmation(user.userId, user.isAdmin)}
                                        disabled={processingUser === user.userId}
                                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                                      >
                                        {user.isAdmin ? (
                                          <>
                                            <ShieldOff size={16} className="mr-2" />
                                            Remove Admin
                                          </>
                                        ) : (
                                          <>
                                            <Shield size={16} className="mr-2" />
                                            Make Admin
                                          </>
                                        )}
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        <ConfirmationDialog
          isOpen={confirmation.isOpen}
          title={confirmation.currentStatus ? "Remove Admin Rights" : "Grant Admin Rights"}
          message={confirmation.currentStatus 
            ? `Are you sure you want to remove admin rights from ${confirmation.userName}? They will no longer have access to administrative features.` 
            : `Are you sure you want to grant admin rights to ${confirmation.userName}? This will give them full access to administrative features including managing other users.`}
          confirmText={confirmation.currentStatus ? "Remove Admin" : "Grant Admin"}
          cancelText="Cancel"
          confirmButtonClass={confirmation.currentStatus 
            ? "bg-yellow-600 hover:bg-yellow-700 text-white" 
            : "bg-blue-600 hover:bg-blue-700 text-white"}
          onConfirm={handleToggleAdmin}
          onCancel={closeConfirmation}
        />

        <UserVibesModal
          isOpen={selectedUser !== null}
          onClose={() => setSelectedUser(null)}
          user={selectedUser}
        />
      </div>
    </PageTransition>
  );
};

export default ManagePeoplePage;