'use client';

import React , { useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import {getData} from '@/utils/localStorage';

// Search Bar Component
const SearchBar = ({ isSmall = false , groups , setGroups }) => {
  const [searchValue, setSearchValue] = useState('');
  const id = getData('userId');

  const API_KEY = process.env.NEXT_PUBLIC_GROUP_API_KEY;
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BACKEND_URL || 'http://localhost:8000';
  useEffect(() => {
    const searchString = searchValue.trim() || '__empty__';
    const handleSearch = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/group/search/${id}/${searchString}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': `${API_KEY}`
          }
        });
        if (!response.ok) throw new Error('Network response was not ok');
        const data = await response.json();
        setGroups(data || []);
      } catch (error) {
        console.error('Error fetching search results:', error);
      }
    };
    handleSearch();
  }, [searchValue, id, API_BASE_URL, API_KEY]);

  return (
    <div className={`relative ${isSmall ? 'max-w-md' : 'max-w-2xl'} mx-auto`}>
      <div className="relative flex items-center">
        <Search className={`absolute left-4 ${isSmall ? 'h-3 w-3' : 'h-4 w-4'} text-gray-500`} />
        <input
          type="text"
          placeholder="Search in CollabFS"
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          className={`w-full ${isSmall ? 'pl-10 pr-4 py-2 text-sm' : 'pl-12 pr-4 py-3'} bg-gray-50 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent transition-all duration-200 hover:bg-gray-100`}
        />
      </div>
    </div>
  );
};

export default SearchBar;