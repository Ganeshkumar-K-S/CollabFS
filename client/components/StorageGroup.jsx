'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { MoreHorizontal, Folder, Clock, Users, StarIcon, HardDrive, FileText, Image, Video, Music, Archive } from 'lucide-react';
import CustomTooltip from '@/components/CustomTooltip';
import { getData } from '@/utils/localStorage';

// Helper function to format file size
const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

// Progress bar component
const StorageProgressBar = ({ used, total, isSmall = false }) => {
  const percentage = (used / total) * 100;
  const getColorClass = () => {
    if (percentage > 90) return 'bg-red-500';
    if (percentage > 75) return 'bg-orange-500';
    return 'bg-orange-500';
  };

  return (
    <div className="w-full">
      <div className={`bg-gray-200 rounded-full ${isSmall ? 'h-1.5' : 'h-2'} mb-1`}>
        <div 
          className={`${getColorClass()} ${isSmall ? 'h-1.5' : 'h-2'} rounded-full transition-all duration-300`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
      <div className={`flex justify-between ${isSmall ? 'text-xs' : 'text-sm'} text-gray-600`}>
        <span>{formatFileSize(used)} used</span>
        <span>{formatFileSize(total)} total</span>
      </div>
    </div>
  );
};

// File type icon component
const FileTypeIcon = ({ type, count, isSmall = false }) => {
  const iconSize = isSmall ? 'h-3 w-3' : 'h-4 w-4';
  
  const getIcon = () => {
    switch (type) {
      case 'documents':
        return <FileText className={`${iconSize} text-blue-500`} />;
      case 'photos':
        return <Image className={`${iconSize} text-green-500`} />;
      case 'videos':
        return <Video className={`${iconSize} text-purple-500`} />;
      case 'audio':
        return <Music className={`${iconSize} text-pink-500`} />;
      case 'others':
        return <Archive className={`${iconSize} text-gray-500`} />;
      default:
        return <FileText className={`${iconSize} text-gray-500`} />;
    }
  };

  return (
    <div className="flex items-center space-x-1">
      {getIcon()}
      <span className={`${isSmall ? 'text-xs' : 'text-sm'} text-gray-600`}>{count}</span>
    </div>
  );
};

// StorageGroup Component
const StorageGroup = ({ isSmall = false, starred = false, groups, setGroups }) => {
  const pathname = usePathname();
  const userId = getData('userId');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BACKEND_URL || 'http://localhost:8000';
  const API_KEY = process.env.NEXT_PUBLIC_GROUP_API_KEY;

  // Get the appropriate endpoint based on current route
  const getEndpoint = () => {
    switch (pathname) {
      case '/home':
        return `${API_BASE_URL}/group/groupstorage/${userId}`;
      case '/starred':
        return `${API_BASE_URL}/group/starred/${userId}`;
      case '/storage':
        return `${API_BASE_URL}/group/groupstorage/${userId}`;
      default:
        return `${API_BASE_URL}/group/groupstorage/${userId}`;
    }
  };

  // Get the appropriate title based on current route and starred prop
  const getTitle = () => {
    if (pathname === '/starred' || starred) {
      return 'Starred Groups';
    }
    return 'My Groups';
  };

  // Fetch group storage data
  useEffect(() => {
    const fetchGroupStorage = async () => {
      // Skip fetching if groups are provided via props (from search)
      if (groups && groups.length >= 0) {
        setLoading(false);
        return;
      }

      if (!userId) {
        console.warn('StorageGroup: No userId provided');
        setError('No user ID provided');
        setLoading(false);
        return;
      }

      if (!API_KEY) {
        console.warn('StorageGroup: No API key provided');
        setError('No API key configured');
        setLoading(false);
        return;
      }

      try {
        console.log('Fetching group storage for user:', userId);
        setLoading(true);
        setError(null);

        const url = getEndpoint();
        console.log('Making request to:', url);

        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': API_KEY,
          },
        });

        console.log('Response status:', response.status);

        if (!response.ok) {
          const errorText = await response.text();
          console.error('API Error Response:', errorText);
          throw new Error(`HTTP ${response.status}: ${errorText}`);
        }

        const data = await response.json();
        console.log('Group storage data received:', data);

        // Transform API data to match component structure
        const transformedGroups = data.map((group, index) => ({
          id: group.groupId || index,
          name: group.groupName || 'Unnamed Group',
          type: 'group',
          modified: '2 hours ago', // You might want to add lastModified to your API
          owner: 'me',
          shared: false, // You might want to add this info to your API
          starred: group.starred || false, // You might want to add this info to your API
          storage: {
            used: group.storageUsed || 0,
            total: 15 * 1024 * 1024 * 1024, // 15GB default, you might want to make this configurable
            files: {
              documents: group.frequency?.documents?.count || 0,
              photos: group.frequency?.photos?.count || 0,
              videos: group.frequency?.videos?.count || 0,
              audio: group.frequency?.audio?.count || 0,
              others: group.frequency?.others?.count || 0
            }
          }
        }));

        if (setGroups) {
          setGroups(transformedGroups);
        }
        setLoading(false);

      } catch (error) {
        console.error('Error fetching group storage:', error);
        setError(error.message);
        setLoading(false);
      }
    };

    fetchGroupStorage();
  }, [userId, API_KEY, API_BASE_URL, pathname, groups]);

  const toggleStar = async (id) => {
    const updatedGroups = groups ? [...groups] : [];
    const groupIndex = updatedGroups.findIndex(group => group.id === id);
    
    if (groupIndex !== -1) {
      updatedGroups[groupIndex] = {
        ...updatedGroups[groupIndex],
        starred: !updatedGroups[groupIndex].starred
      };
      
      if (setGroups) {
        setGroups(updatedGroups);
      }

      // Here you might want to make an API call to update the starred status
      try {
        await fetch(`${API_BASE_URL}/group/star/${userId}/${id}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': API_KEY,
          },
          body: JSON.stringify({ starred: updatedGroups[groupIndex].starred })
        });
      } catch (error) {
        console.error('Error updating starred status:', error);
        // Revert the change if API call fails
        updatedGroups[groupIndex].starred = !updatedGroups[groupIndex].starred;
        if (setGroups) {
          setGroups(updatedGroups);
        }
      }
    }
  };

  // Use groups from props if available, otherwise use empty array during loading
  const displayGroups = groups || [];

  // Filter groups based on starred prop and current route
  const filteredGroups = (() => {
    if (pathname === '/starred') {
      return displayGroups.filter(group => group.starred);
    }
    if (starred) {
      return displayGroups.filter(group => group.starred);
    }
    return displayGroups;
  })();

  // Loading state
  if (loading && !groups) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className={`px-4 md:px-6 ${isSmall ? 'py-3' : 'py-4'} border-b border-gray-200`}>
          <h3 className={`${isSmall ? 'text-base' : 'text-lg'} font-medium text-gray-900`}>
            {getTitle()}
          </h3>
        </div>
        <div className={`${isSmall ? 'p-4' : 'p-6'} text-center`}>
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto mb-4"></div>
            <div className="h-3 bg-gray-200 rounded w-1/3 mx-auto"></div>
          </div>
          <p className="text-gray-500 mt-4">Loading groups...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !groups) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className={`px-4 md:px-6 ${isSmall ? 'py-3' : 'py-4'} border-b border-gray-200`}>
          <h3 className={`${isSmall ? 'text-base' : 'text-lg'} font-medium text-gray-900`}>
            {getTitle()}
          </h3>
        </div>
        <div className={`${isSmall ? 'p-4' : 'p-6'} text-center`}>
          <div className="bg-red-100 border border-red-200 rounded p-4">
            <p className="text-red-600 text-sm">{error}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="text-red-700 text-sm underline hover:no-underline mt-2"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Empty state
  if (filteredGroups.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className={`px-4 md:px-6 ${isSmall ? 'py-3' : 'py-4'} border-b border-gray-200`}>
          <h3 className={`${isSmall ? 'text-base' : 'text-lg'} font-medium text-gray-900`}>
            {getTitle()}
          </h3>
        </div>
        <div className={`${isSmall ? 'p-4' : 'p-6'} text-center`}>
          <Folder className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">
            {pathname === '/starred' || starred ? 'No starred groups found' : 'No groups found'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className={`px-4 md:px-6 ${isSmall ? 'py-3' : 'py-4'} border-b border-gray-200`}>
        <h3 className={`${isSmall ? 'text-base' : 'text-lg'} font-medium text-gray-900`}>
          {getTitle()}
        </h3>
      </div>
      
      <div className="divide-y divide-gray-200">
        {filteredGroups.map((group) => (
          <div key={group.id} className={`${isSmall ? 'p-4' : 'p-6'} hover:bg-gray-50 transition-colors`}>
            {/* Group Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center min-w-0 flex-1">
                <Folder className={`${isSmall ? 'h-5 w-5' : 'h-6 w-6'} text-orange-500 mr-3 flex-shrink-0`} />
                <div className="min-w-0 flex-1">
                  <h4 className={`${isSmall ? 'text-sm' : 'text-base'} font-medium text-gray-900 truncate`}>
                    {group.name}
                  </h4>
                  <div className="flex items-center mt-1 space-x-4">
                    <div className="flex items-center text-gray-500">
                      <Clock className={`${isSmall ? 'h-3 w-3' : 'h-4 w-4'} mr-1`} />
                      <span className={`${isSmall ? 'text-xs' : 'text-sm'}`}>{group.modified}</span>
                    </div>
                    {group.shared && (
                      <div className="flex items-center text-gray-500">
                        <Users className={`${isSmall ? 'h-3 w-3' : 'h-4 w-4'} mr-1`} />
                        <span className={`${isSmall ? 'text-xs' : 'text-sm'}`}>Shared</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="flex items-center space-x-1 ml-4">
                <CustomTooltip content={group.starred ? "Remove from starred" : "Add to starred"}>
                  <button
                    onClick={() => toggleStar(group.id)}
                    className={`p-1 rounded hover:bg-gray-100 transition-colors ${
                      group.starred ? 'text-orange-500' : 'text-gray-400'
                    }`}
                  >
                    <StarIcon className={`${isSmall ? 'h-4 w-4' : 'h-5 w-5'} ${group.starred ? 'fill-current' : ''}`} />
                  </button>
                </CustomTooltip>
                <button className="text-gray-400 hover:text-gray-600 p-1 rounded hover:bg-gray-100">
                  <MoreHorizontal className={`${isSmall ? 'h-4 w-4' : 'h-5 w-5'}`} />
                </button>
              </div>
            </div>

            {/* Storage Information */}
            <div className="space-y-4">
              {/* Storage Usage */}
              <div>
                <div className="flex items-center mb-2">
                  <HardDrive className={`${isSmall ? 'h-4 w-4' : 'h-5 w-5'} text-gray-500 mr-2`} />
                  <span className={`${isSmall ? 'text-sm' : 'text-base'} font-medium text-gray-700`}>
                    Storage Usage
                  </span>
                </div>
                <StorageProgressBar 
                  used={group.storage.used} 
                  total={group.storage.total} 
                  isSmall={isSmall}
                />
              </div>

              {/* File Types */}
              <div>
                <div className="flex items-center mb-2">
                  <FileText className={`${isSmall ? 'h-4 w-4' : 'h-5 w-5'} text-gray-500 mr-2`} />
                  <span className={`${isSmall ? 'text-sm' : 'text-base'} font-medium text-gray-700`}>
                    File Distribution
                  </span>
                </div>
                <div className={`grid ${isSmall ? 'grid-cols-3' : 'grid-cols-5'} gap-4`}>
                  <FileTypeIcon type="documents" count={group.storage.files.documents} isSmall={isSmall} />
                  <FileTypeIcon type="photos" count={group.storage.files.photos} isSmall={isSmall} />
                  <FileTypeIcon type="videos" count={group.storage.files.videos} isSmall={isSmall} />
                  {!isSmall && (
                    <>
                      <FileTypeIcon type="audio" count={group.storage.files.audio} isSmall={isSmall} />
                      <FileTypeIcon type="others" count={group.storage.files.others} isSmall={isSmall} />
                    </>
                  )}
                </div>
                {isSmall && (
                  <div className="grid grid-cols-2 gap-4 mt-2">
                    <FileTypeIcon type="audio" count={group.storage.files.audio} isSmall={isSmall} />
                    <FileTypeIcon type="others" count={group.storage.files.others} isSmall={isSmall} />
                  </div>
                )}
              </div>

              {/* Quick Stats */}
              <div className={`flex justify-between ${isSmall ? 'text-xs' : 'text-sm'} text-gray-600 pt-2 border-t border-gray-100`}>
                <span>
                  Total Files: {Object.values(group.storage.files).reduce((a, b) => a + b, 0)}
                </span>
                <span>
                  {((group.storage.used / group.storage.total) * 100).toFixed(1)}% Full
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StorageGroup;