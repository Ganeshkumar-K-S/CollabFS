'use client';

import React, { useState } from 'react';
import { MoreHorizontal, Folder, Clock, Users, StarIcon, HardDrive, FileText, Image, Video, Music, Archive } from 'lucide-react';
import CustomTooltip from '@/components/CustomTooltip';

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
      case 'images':
        return <Image className={`${iconSize} text-green-500`} />;
      case 'videos':
        return <Video className={`${iconSize} text-purple-500`} />;
      case 'audio':
        return <Music className={`${iconSize} text-pink-500`} />;
      case 'archives':
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
const StorageGroup = ({ isSmall = false, starred = false }) => {
  const [groups, setGroups] = useState([
    {
      id: 1,
      name: 'Project Alpha',
      type: 'group',
      modified: '2 hours ago',
      owner: 'me',
      shared: false,
      starred: false,
      storage: {
        used: 2500000000, // 2.5 GB
        total: 5000000000, // 5 GB
        files: {
          documents: 45,
          images: 120,
          videos: 8,
          audio: 15,
          archives: 3
        }
      }
    },
    {
      id: 2,
      name: 'Personal Documents',
      type: 'group',
      modified: '1 day ago',
      owner: 'me',
      shared: false,
      starred: true,
      storage: {
        used: 850000000, // 850 MB
        total: 2000000000, // 2 GB
        files: {
          documents: 78,
          images: 25,
          videos: 2,
          audio: 5,
          archives: 1
        }
      }
    },
    {
      id: 3,
      name: 'Team Collaboration',
      type: 'group',
      modified: '3 days ago',
      owner: 'me',
      shared: true,
      starred: false,
      storage: {
        used: 4200000000, // 4.2 GB
        total: 10000000000, // 10 GB
        files: {
          documents: 156,
          images: 89,
          videos: 15,
          audio: 8,
          archives: 12
        }
      }
    },
    {
      id: 4,
      name: 'Archive 2024',
      type: 'group',
      modified: '1 week ago',
      owner: 'me',
      shared: false,
      starred: true,
      storage: {
        used: 7800000000, // 7.8 GB
        total: 10000000000, // 10 GB
        files: {
          documents: 234,
          images: 445,
          videos: 28,
          audio: 67,
          archives: 45
        }
      }
    },
    {
      id: 5,
      name: 'Client Files',
      type: 'group',
      modified: '2 weeks ago',
      owner: 'me',
      shared: true,
      starred: false,
      storage: {
        used: 1200000000, // 1.2 GB
        total: 3000000000, // 3 GB
        files: {
          documents: 67,
          images: 34,
          videos: 5,
          audio: 12,
          archives: 8
        }
      }
    }
  ]);

  const toggleStar = (id) => {
    setGroups(groups.map(group => 
      group.id === id ? { ...group, starred: !group.starred } : group
    ));
  };

  // Filter groups based on starred prop
  const filteredGroups = starred ? groups.filter(group => group.starred) : groups;

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className={`px-4 md:px-6 ${isSmall ? 'py-3' : 'py-4'} border-b border-gray-200`}>
        <h3 className={`${isSmall ? 'text-base' : 'text-lg'} font-medium text-gray-900`}>
          {starred ? 'Starred Groups' : 'My Groups'}
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
                  <FileTypeIcon type="images" count={group.storage.files.images} isSmall={isSmall} />
                  <FileTypeIcon type="videos" count={group.storage.files.videos} isSmall={isSmall} />
                  {!isSmall && (
                    <>
                      <FileTypeIcon type="audio" count={group.storage.files.audio} isSmall={isSmall} />
                      <FileTypeIcon type="archives" count={group.storage.files.archives} isSmall={isSmall} />
                    </>
                  )}
                </div>
                {isSmall && (
                  <div className="grid grid-cols-2 gap-4 mt-2">
                    <FileTypeIcon type="audio" count={group.storage.files.audio} isSmall={isSmall} />
                    <FileTypeIcon type="archives" count={group.storage.files.archives} isSmall={isSmall} />
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