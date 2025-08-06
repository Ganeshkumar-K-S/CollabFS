'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {Folder, Clock, StarIcon, Crown, User, Eye, Shield, Pencil} from 'lucide-react';
import CustomTooltip from '@/components/CustomTooltip';
import { getData } from '@/utils/localStorage';

// Groups Table Component
const GroupsTable = ({ 
  isSmall = false, 
  starred = false, 
  groups = [], 
  onToggleStar,
  onGroupsUpdate // Callback to update parent component's groups state
}) => {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const userId = getData('userId'); // Get userId from localStorage
  const apiKey = process.env.NEXT_PUBLIC_GROUP_API_KEY; // Get API key from environment variable
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BACKEND_URL || 'http://localhost:8000';
  
  const getRoleIcon = (role) => {
    switch (role.toLowerCase()) {
      case 'owner':
        return <Crown className="h-3 w-3 text-yellow-500" />;
      case 'admin':
        return <Shield className="h-3 w-3 text-purple-500" />;
      case 'editor':
        return <Pencil className="h-3 w-3 text-green-500" />;
      case 'member':
        return <User className="h-3 w-3 text-gray-500" />;
      case 'viewer':
        return <Eye className="h-3 w-3 text-gray-500" />;
      default:
        return <User className="h-3 w-3 text-gray-500" />;
    }
  };

  const getRoleColor = (role) => {
    switch (role.toLowerCase()) {
      case 'owner':
        return 'text-yellow-600 bg-yellow-50';
      case 'admin':
        return 'text-purple-600 bg-purple-50';
      case 'editor':
        return 'text-green-600 bg-green-50';
      case 'member':
        return 'text-gray-600 bg-gray-50';
      case 'viewer':
        return 'text-gray-600 bg-gray-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  // Function to handle group row click for navigation
  const handleGroupClick = (groupId) => {
    router.push(`/groups/${groupId}`);
  };

  // Function to handle starring a group
  const handleStar = async (groupId) => {
    if (!userId || !apiKey) {
      console.error('Missing userId or apiKey for star operation');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/group/staragroup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
        },
        body: JSON.stringify({
          userId: userId,
          groupId: groupId
        })
      });

      const data = await response.json();

      if (response.ok) {
        // Update the local groups state
        const updatedGroups = groups.map(group => 
          group.groupId === groupId 
            ? { ...group, starred: true }
            : group
        );
        
        // Call parent callback to update groups
        if (onGroupsUpdate) {
          onGroupsUpdate(updatedGroups);
        }
        
        // Call the original toggle function if provided
        if (onToggleStar) {
          onToggleStar(groupId);
        }

        console.log('Group starred successfully:', data.message);
        window.location.reload(); // Refresh the page to reflect changes
      } else {
        console.error('Failed to star group:', data.detail || data.message);
      }
    } catch (error) {
      console.error('Error starring group:', error);
    } finally {
      setLoading(false);
    }
  };

  // Function to handle unstarring a group
  const handleUnstar = async (groupId) => {
    if (!userId || !apiKey) {
      console.error('Missing userId or apiKey for unstar operation');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/group/unstaragroup`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
        },
        body: JSON.stringify({
          userId: userId,
          groupId: groupId
        })
      });

      const data = await response.json();

      if (response.ok) {
        // Update the local groups state
        const updatedGroups = groups.map(group => 
          group.groupId === groupId 
            ? { ...group, starred: false }
            : group
        );
        
        // Call parent callback to update groups
        if (onGroupsUpdate) {
          onGroupsUpdate(updatedGroups);
        }
        
        // Call the original toggle function if provided
        if (onToggleStar) {
          onToggleStar(groupId);
        }

        console.log('Group unstarred successfully:', data.message);
        window.location.reload(); // Refresh the page to reflect changes
      } else {
        console.error('Failed to unstar group:', data.detail || data.message);
      }
    } catch (error) {
      console.error('Error unstarring group:', error);
    } finally {
      setLoading(false);
    }
  };

  // Combined toggle function that decides whether to star or unstar
  const handleToggleStar = async (groupId) => {
    const group = groups.find(g => g.groupId === groupId);
    if (!group) return;

    if (group.starred) {
      await handleUnstar(groupId);
    } else {
      await handleStar(groupId);
    }
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
      <div className="overflow-x-auto">
        <table className="w-full min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className={`px-3 md:px-6 ${isSmall ? 'py-2' : 'py-3'} text-left text-xs font-medium text-gray-500 uppercase tracking-wider`}>Name</th>
              <th className={`px-3 md:px-6 ${isSmall ? 'py-2' : 'py-3'} text-left text-xs font-medium text-gray-500 uppercase tracking-wider`}>Role</th>
              <th className={`px-3 md:px-6 ${isSmall ? 'py-2' : 'py-3'} text-left text-xs font-medium text-gray-500 uppercase tracking-wider`}>Last Modified</th>
              <th className={`px-3 md:px-6 ${isSmall ? 'py-2' : 'py-3'} text-right text-xs font-medium text-gray-500 uppercase tracking-wider`}>Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredGroups.map((group) => (
              <tr 
                key={group.groupId} 
                className="hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() => handleGroupClick(group.groupId)}
              >
                <td className={`px-3 md:px-6 ${isSmall ? 'py-3' : 'py-4'} whitespace-nowrap`}>
                  <div className="flex items-center min-w-0">
                    <Folder className={`${isSmall ? 'h-4 w-4' : 'h-5 w-5'} text-orange-500 mr-2 md:mr-3 flex-shrink-0`} />
                    <span className={`${isSmall ? 'text-xs' : 'text-sm'} font-medium text-gray-900 truncate`}>{group.groupName}</span>
                  </div>
                </td>
                <td className={`px-3 md:px-6 ${isSmall ? 'py-3' : 'py-4'} whitespace-nowrap`}>
                  <div className="flex items-center min-w-0">
                    {getRoleIcon(group.role)}
                    <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleColor(group.role)}`}>
                      {group.role.charAt(0).toUpperCase() + group.role.slice(1)}
                    </span>
                  </div>
                </td>
                <td className={`px-3 md:px-6 ${isSmall ? 'py-3' : 'py-4'} whitespace-nowrap text-gray-500`}>
                  <div className="flex items-center min-w-0">
                    <Clock className={`${isSmall ? 'h-3 w-3' : 'h-4 w-4'} mr-1 md:mr-2 flex-shrink-0`} />
                    <span className={`${isSmall ? 'text-xs' : 'text-sm'} truncate`}>{group.lastModified}</span>
                  </div>
                </td>
                <td className={`px-3 md:px-6 ${isSmall ? 'py-3' : 'py-4'} whitespace-nowrap text-right text-sm font-medium`}>
                  <div className="flex items-center justify-end space-x-1 md:space-x-2">
                    <CustomTooltip content={group.starred ? "Remove from starred" : "Add to starred"}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation(); // Prevent row click navigation when clicking star
                          handleToggleStar(group.groupId);
                        }}
                        disabled={loading}
                        className={`p-1 rounded hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                          group.starred ? 'text-orange-500' : 'text-gray-400'
                        }`}
                      >
                        <StarIcon className={`${isSmall ? 'h-3 w-3' : 'h-4 w-4'} ${group.starred ? 'fill-current' : ''}`} />
                      </button>
                    </CustomTooltip>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Loading indicator */}
      {loading && (
        <div className="absolute inset-0 bg-white bg-opacity-50 flex items-center justify-center">
          <div className="text-sm text-gray-500">Updating...</div>
        </div>
      )}
    </div>
  );
};

export default GroupsTable;