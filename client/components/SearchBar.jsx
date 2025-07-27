'use client';

import React , { useState } from 'react';
import { Search } from 'lucide-react';

// Search Bar Component
const SearchBar = ({ isSmall = false }) => {
  const [searchValue, setSearchValue] = useState('');

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