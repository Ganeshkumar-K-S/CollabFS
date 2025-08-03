'use client';

import React, { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Search } from 'lucide-react';
import { getData } from '@/utils/localStorage';

// Search Bar Component
const SearchBar = ({ isSmall = false, groups, setGroups }) => {
  const [searchValue, setSearchValue] = useState('');
  const pathname = usePathname();
  const id = getData('userId');

  const API_KEY = process.env.NEXT_PUBLIC_GROUP_API_KEY;
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BACKEND_URL || 'http://localhost:8000';

  // Get the appropriate search endpoint based on current route
  const getSearchEndpoint = (searchString) => {
    switch (pathname) {
      case '/home':
        return `${API_BASE_URL}/group/search/${id}/${searchString}`;
      case '/starred':
        // Use the same search endpoint but we'll filter starred groups in the response
        return `${API_BASE_URL}/group/search/${id}/${searchString}`;
      case '/storage':
        // Fixed: Use the correct groupstorage endpoint
        return `${API_BASE_URL}/group/groupstorage/${id}/${searchString}`;
      default:
        return `${API_BASE_URL}/group/search/${id}/${searchString}`;
    }
  };

  // Transform API data to match component structure
  const transformGroupData = (data, isStorageData = false) => {
    if (!Array.isArray(data)) {
      return [];
    }

    return data.map((group, index) => {
      if (isStorageData) {
        // For storage endpoint response - matches StorageGroup component structure
        return {
          // Properties for StorageGroup component
          id: group.groupId || index,
          name: group.groupName || 'Unnamed Group',
          type: 'group',
          modified: '2 hours ago', // Storage endpoint doesn't provide lastModified
          owner: 'me',
          shared: false,
          starred: false, // Storage endpoint doesn't provide starred info
          
          // Properties for GroupsTable component compatibility
          groupId: group.groupId || index,
          groupName: group.groupName || 'Unnamed Group',
          role: 'owner', // Default role for storage data since user owns the groups they can see storage for
          lastModified: '2 hours ago',
          
          // Storage information
          storage: {
            used: group.storageUsed || 0,
            total: 15 * 1024 * 1024 * 1024, // 15GB default
            files: {
              documents: group.frequency?.documents?.count || 0,
              photos: group.frequency?.photos?.count || 0,
              videos: group.frequency?.videos?.count || 0,
              audio: group.frequency?.audio?.count || 0,
              others: group.frequency?.others?.count || 0
            }
          }
        };
      } else {
        // For regular search endpoint response - matches GroupsTable component structure
        return {
          // Properties for StorageGroup component
          id: group.groupId || index,
          name: group.groupName || 'Unnamed Group',
          type: 'group',
          modified: group.lastModified || '2 hours ago',
          owner: 'me',
          shared: false,
          starred: group.starred || false,
          
          // Properties for GroupsTable component (primary structure)
          groupId: group.groupId || index,
          groupName: group.groupName || 'Unnamed Group',
          role: group.role || 'member', // Include role from API response with fallback
          lastModified: group.lastModified || '2 hours ago',
          
          // Storage information (default values for non-storage endpoints)
          storage: {
            used: 0,
            total: 15 * 1024 * 1024 * 1024, // 15GB default
            files: {
              documents: 0,
              photos: 0,
              videos: 0,
              audio: 0,
              others: 0
            }
          }
        };
      }
    });
  };

  useEffect(() => {
    const searchString = searchValue.trim() || '__empty__';
    
    const handleSearch = async () => {
      if (!id || !API_KEY) {
        console.warn('SearchBar: Missing userId or API key');
        return;
      }

      try {
        const endpoint = getSearchEndpoint(searchString);
        console.log('Making search request to:', endpoint);

        const response = await fetch(endpoint, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': `${API_KEY}`
          }
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('Search API Error:', errorText);
          throw new Error(`HTTP ${response.status}: ${errorText}`);
        }

        const data = await response.json();
        console.log('Search results received:', data);

        // Transform the data based on the current route
        let transformedData;
        
        if (pathname === '/storage') {
          // For storage route, use storage-specific transformation
          transformedData = transformGroupData(data || [], true);
        } else if (pathname === '/starred') {
          // For starred route, filter only starred groups
          const allGroups = transformGroupData(data || [], false);
          transformedData = allGroups.filter(group => group.starred === true);
        } else {
          // For home route, show all groups
          transformedData = transformGroupData(data || [], false);
        }

        console.log('Transformed data:', transformedData);
        setGroups(transformedData);

      } catch (error) {
        console.error('Error fetching search results:', error);
        // On error, set empty array to show no results
        setGroups([]);
      }
    };

    // Debounce the search to avoid too many API calls
    const debounceTimer = setTimeout(() => {
      handleSearch();
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [searchValue, id, API_BASE_URL, API_KEY, pathname, setGroups]);

  // Get placeholder text based on current route
  const getPlaceholder = () => {
    switch (pathname) {
      case '/home':
        return 'Search in your groups';
      case '/starred':
        return 'Search in starred groups';
      case '/storage':
        return 'Search group storage';
      default:
        return 'Search in CollabFS';
    }
  };

  return (
    <div className={`relative ${isSmall ? 'max-w-md' : 'max-w-2xl'} mx-auto`}>
      <div className="relative flex items-center">
        <Search className={`absolute left-4 ${isSmall ? 'h-3 w-3' : 'h-4 w-4'} text-gray-500`} />
        <input
          type="text"
          placeholder={getPlaceholder()}
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          className={`w-full ${isSmall ? 'pl-10 pr-4 py-2 text-sm' : 'pl-12 pr-4 py-3'} bg-gray-50 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent transition-all duration-200 hover:bg-gray-100`}
        />
        {searchValue && (
          <button
            onClick={() => setSearchValue('')}
            className={`absolute right-4 ${isSmall ? 'text-xs' : 'text-sm'} text-gray-400 hover:text-gray-600 transition-colors`}
          >
            ✕
          </button>
        )}
      </div>
      {searchValue && (
        <div className={`mt-2 ${isSmall ? 'text-xs' : 'text-sm'} text-gray-500`}>
          {searchValue.trim() ? `Searching for "${searchValue}"...` : 'Showing all groups'}
        </div>
      )}
    </div>
  );
};

export default SearchBar;