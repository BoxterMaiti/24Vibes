import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Building, Briefcase, Save, Camera } from 'lucide-react';
import PageTransition from '../components/PageTransition';
import { useAuth } from '../contexts/AuthContext';
import { getColleagueByUserId, updateColleagueProfile } from '../services/colleagueService';
import { Colleague } from '../types';

const ProfilePage: React.FC = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Profile data
  const [displayName, setDisplayName] = useState('');
  const [department, setDepartment] = useState('');
  const [position, setPosition] = useState('');
  const [colleague, setColleague] = useState<Colleague | null>(null);
  
  // Load user profile data
  useEffect(() => {
    async function loadProfile() {
      if (!currentUser) {
        navigate('/login');
        return;
      }
      
      try {
        setLoading(true);
        setError(null);
        
        // Get colleague data for the current user
        const colleagueData = await getColleagueByUserId(currentUser.uid);
        setColleague(colleagueData);
        
        if (colleagueData) {
          // Set form values from colleague data
          setDisplayName(colleagueData.name || colleagueData["display name"] || colleagueData["Display name"] || '');
          setDepartment(colleagueData.department || colleagueData.Department || '');
          setPosition(colleagueData.position || colleagueData["job title"] || colleagueData["Job title"] || '');
        } else {
          // Use data from Firebase Auth as fallback
          setDisplayName(currentUser.displayName || '');
        }
      } catch (err) {
        console.error('Error loading profile:', err);
        setError('Failed to load profile data. Please try again.');
      } finally {
        setLoading(false);
      }
    }
    
    loadProfile();
  }, [currentUser, navigate]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentUser) {
      navigate('/login');
      return;
    }
    
    try {
      setSaving(true);
      setError(null);
      setSuccess(false);
      
      // Update colleague profile
      await updateColleagueProfile(
        currentUser.uid, 
        {
          name: displayName,
          "display name": displayName,
          department: department,
          position: position,
          // Use Google profile photo URL if available
          avatar: currentUser.photoURL || undefined
        }
      );
      
      setSuccess(true);
      
      // Reset success message after 3 seconds
      setTimeout(() => {
        setSuccess(false);
      }, 3000);
    } catch (err) {
      console.error('Error updating profile:', err);
      setError('Failed to update profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };
  
  // Get profile picture from Google account or use placeholder
  const profilePicture = currentUser?.photoURL || 'https://via.placeholder.com/150';
  
  return (
    <PageTransition>
      <div className="min-h-screen bg-gray-50 pt-4">
        <div className="max-w-4xl mx-auto px-6 md:px-8 py-6">
          <Link to="/" className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-6">
            <ArrowLeft size={20} className="mr-2" />
            Back to home
          </Link>
          
          <div className="bg-white rounded-lg border border-gray-200 p-6 md:p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Your Profile</h2>
            
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              </div>
            ) : (
              <>
                <div className="flex flex-col md:flex-row gap-8 mb-8">
                  {/* Profile Picture Section */}
                  <div className="flex flex-col items-center">
                    <div className="relative mb-4">
                      <img 
                        src={profilePicture} 
                        alt="Profile" 
                        className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-md"
                      />
                      {currentUser?.photoURL && (
                        <div className="absolute bottom-0 right-0 bg-blue-100 text-blue-800 rounded-full p-1">
                          <Camera size={16} />
                        </div>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 text-center max-w-xs">
                      {currentUser?.photoURL 
                        ? "Your Google profile picture is being used" 
                        : "Sign in with Google to use your profile picture"}
                    </p>
                  </div>
                  
                  {/* Profile Form */}
                  <div className="flex-1">
                    {error && (
                      <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
                        {error}
                      </div>
                    )}
                    
                    {success && (
                      <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-md">
                        Profile updated successfully!
                      </div>
                    )}
                    
                    <form onSubmit={handleSubmit}>
                      <div className="mb-4">
                        <label htmlFor="displayName" className="block text-gray-700 font-medium mb-2">
                          Display Name
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <User size={18} className="text-gray-400" />
                          </div>
                          <input
                            type="text"
                            id="displayName"
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
                            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="How should we call you?"
                            required
                          />
                        </div>
                      </div>
                      
                      <div className="mb-4">
                        <label htmlFor="department" className="block text-gray-700 font-medium mb-2">
                          Department
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Building size={18} className="text-gray-400" />
                          </div>
                          <input
                            type="text"
                            id="department"
                            value={department}
                            onChange={(e) => setDepartment(e.target.value)}
                            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Your department (e.g., Engineering, Marketing)"
                          />
                        </div>
                      </div>
                      
                      <div className="mb-6">
                        <label htmlFor="position" className="block text-gray-700 font-medium mb-2">
                          Job Title
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Briefcase size={18} className="text-gray-400" />
                          </div>
                          <input
                            type="text"
                            id="position"
                            value={position}
                            onChange={(e) => setPosition(e.target.value)}
                            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Your job title (e.g., Software Engineer)"
                          />
                        </div>
                      </div>
                      
                      <div className="flex justify-end">
                        <button
                          type="submit"
                          disabled={saving}
                          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
                        >
                          {saving ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                              <span>Saving...</span>
                            </>
                          ) : (
                            <>
                              <Save size={18} />
                              <span>Save Profile</span>
                            </>
                          )}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
                
                <div className="border-t border-gray-200 pt-6">
                  <h3 className="text-lg font-medium text-gray-800 mb-2">Account Information</h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-500">Email</p>
                        <p className="font-medium">{currentUser?.email}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Account ID</p>
                        <p className="font-medium text-gray-700">{currentUser?.uid.substring(0, 8)}...</p>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </PageTransition>
  );
};

export default ProfilePage;