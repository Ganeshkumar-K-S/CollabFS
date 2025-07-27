'use client';

import React, { useState } from 'react';
import {MoreHorizontal, Folder, Clock, Users, StarIcon} from 'lucide-react';
import CustomTooltip from '@/components/CustomTooltip';

// Groups Table Component
const GroupsTable = ({ isSmall = false }) => {
  const [groups, setGroups] = useState([
    {
      id: 1,
      name: 'Project Alpha',
      type: 'group',
      modified: '2 hours ago',
      owner: 'me',
      shared: false,
      starred: false
    },
    {
      id: 2,
      name: 'Personal Documents',
      type: 'group',
      modified: '1 day ago',
      owner: 'me',
      shared: false,
      starred: true
    },
    {
      id: 3,
      name: 'Team Collaboration',
      type: 'group',
      modified: '3 days ago',
      owner: 'me',
      shared: true,
      starred: false
    },
    {
      id: 4,
      name: 'Archive 2024',
      type: 'group',
      modified: '1 week ago',
      owner: 'me',
      shared: false,
      starred: true
    },
    {
      id: 5,
      name: 'Client Files',
      type: 'group',
      modified: '2 weeks ago',
      owner: 'me',
      shared: true,
      starred: false
    }
  ]);

  const toggleStar = (id) => {
    setGroups(groups.map(group => 
      group.id === id ? { ...group, starred: !group.starred } : group
    ));
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className={`px-4 md:px-6 ${isSmall ? 'py-3' : 'py-4'} border-b border-gray-200`}>
        <h3 className={`${isSmall ? 'text-base' : 'text-lg'} font-medium text-gray-900`}>My Groups</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className={`px-3 md:px-6 ${isSmall ? 'py-2' : 'py-3'} text-left text-xs font-medium text-gray-500 uppercase tracking-wider`}>Name</th>
              {!isSmall && (
                <>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">Owner</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">Shared</th>
                </>
              )}
              <th className={`px-3 md:px-6 ${isSmall ? 'py-2' : 'py-3'} text-left text-xs font-medium text-gray-500 uppercase tracking-wider`}>Last Modified</th>
              <th className={`px-3 md:px-6 ${isSmall ? 'py-2' : 'py-3'} text-right text-xs font-medium text-gray-500 uppercase tracking-wider`}>Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {groups.map((group) => (
              <tr key={group.id} className="hover:bg-gray-50 cursor-pointer">
                <td className={`px-3 md:px-6 ${isSmall ? 'py-3' : 'py-4'} whitespace-nowrap`}>
                  <div className="flex items-center min-w-0">
                    <Folder className={`${isSmall ? 'h-4 w-4' : 'h-5 w-5'} text-orange-500 mr-2 md:mr-3 flex-shrink-0`} />
                    <span className={`${isSmall ? 'text-xs' : 'text-sm'} font-medium text-gray-900 truncate`}>{group.name}</span>
                  </div>
                </td>
                {!isSmall && (
                  <>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 hidden lg:table-cell">
                      {group.owner}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 hidden lg:table-cell">
                      {group.shared ? (
                        <div className="flex items-center text-orange-600">
                          <Users className="h-4 w-4 mr-1" />
                          Shared
                        </div>
                      ) : (
                        <span className="text-gray-400">Private</span>
                      )}
                    </td>
                  </>
                )}
                <td className={`px-3 md:px-6 ${isSmall ? 'py-3' : 'py-4'} whitespace-nowrap text-gray-500`}>
                  <div className="flex items-center min-w-0">
                    <Clock className={`${isSmall ? 'h-3 w-3' : 'h-4 w-4'} mr-1 md:mr-2 flex-shrink-0`} />
                    <span className={`${isSmall ? 'text-xs' : 'text-sm'} truncate`}>{group.modified}</span>
                  </div>
                </td>
                <td className={`px-3 md:px-6 ${isSmall ? 'py-3' : 'py-4'} whitespace-nowrap text-right text-sm font-medium`}>
                  <div className="flex items-center justify-end space-x-1 md:space-x-2">
                    <CustomTooltip content={group.starred ? "Remove from starred" : "Add to starred"}>
                      <button
                        onClick={() => toggleStar(group.id)}
                        className={`p-1 rounded hover:bg-gray-100 transition-colors ${
                          group.starred ? 'text-orange-500' : 'text-gray-400'
                        }`}
                      >
                        <StarIcon className={`${isSmall ? 'h-3 w-3' : 'h-4 w-4'} ${group.starred ? 'fill-current' : ''}`} />
                      </button>
                    </CustomTooltip>
                    <button className="text-gray-400 hover:text-gray-600 p-1 rounded hover:bg-gray-100">
                      <MoreHorizontal className={`${isSmall ? 'h-3 w-3' : 'h-4 w-4'}`} />
                    </button>
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