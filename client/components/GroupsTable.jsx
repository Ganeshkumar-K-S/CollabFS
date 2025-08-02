'use client';

import React from 'react';
import {MoreHorizontal, Folder, Clock, Users, StarIcon, Crown, User, Eye} from 'lucide-react';
import CustomTooltip from '@/components/CustomTooltip';

// Groups Table Component
const GroupsTable = ({ isSmall = false, starred = false, groups = [], onToggleStar }) => {
  const getRoleIcon = (role) => {
    switch (role.toLowerCase()) {
      case 'owner':
        return <Crown className="h-3 w-3 text-orange-500" />;
      case 'admin':
        return <Users className="h-3 w-3 text-blue-500" />;
      case 'editor':
        return <User className="h-3 w-3 text-green-500" />;
      case 'member':
        return <User className="h-3 w-3 text-green-500" />;
      case 'viewer':
        return <Eye className="h-3 w-3 text-gray-500" />;
      default:
        return <User className="h-3 w-3 text-gray-500" />;
    }
  };

  const getRoleColor = (role) => {
    switch (role.toLowerCase()) {
      case 'owner':
        return 'text-orange-600 bg-orange-50';
      case 'admin':
        return 'text-blue-600 bg-blue-50';
      case 'editor':
        return 'text-green-600 bg-green-50';
      case 'member':
        return 'text-green-600 bg-green-50';
      case 'viewer':
        return 'text-gray-600 bg-gray-50';
      default:
        return 'text-gray-600 bg-gray-50';
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
              <tr key={group.groupId} className="hover:bg-gray-50 cursor-pointer">
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
                        onClick={() => onToggleStar && onToggleStar(group.groupId)}
                        className={`p-1 rounded hover:bg-gray-100 transition-colors ${
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
    </div>
  );
};

export default GroupsTable;