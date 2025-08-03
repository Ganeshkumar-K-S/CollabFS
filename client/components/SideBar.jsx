'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Home, Star, HardDrive } from 'lucide-react';
import CustomTooltip from '@/components/CustomTooltip';
import { getData } from '@/utils/localStorage';

// Sidebar Component
const Sidebar = ({ activeSection, setActiveSection, isCollapsed = false}) => {
  const router = useRouter();
  const pathname = usePathname();
  const userId = getData('userId');
  const [storageData, setStorageData] = useState({
    storageUsed: 0,
    storageLimit: 15 * 1024 * 1024 * 1024, // 15GB in bytes
    loading: true,
    error: null
  });

  const sectionItems = [
    { id: 'home', icon: Home, label: 'Home', route: '/home' },
    { id: 'starred', icon: Star, label: 'Starred', route: '/starred' },
    { id: 'storage', icon: HardDrive, label: 'Storage', route: '/storage' }
  ];

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BACKEND_URL || 'http://localhost:8000';
  const API_KEY = process.env.NEXT_PUBLIC_GROUP_API_KEY;

  // Fetch user storage data
  useEffect(() => {
    const fetchUserStorage = async () => {
      if (!userId) {
        console.warn('Sidebar: No userId provided');
        setStorageData(prev => ({ ...prev, loading: false, error: 'No user ID provided' }));
        return;
      }

      if (!API_KEY) {
        console.warn('Sidebar: No API key provided');
        setStorageData(prev => ({ ...prev, loading: false, error: 'No API key configured' }));
        return;
      }

      try {
        console.log('Fetching storage for user:', userId);
        setStorageData(prev => ({ ...prev, loading: true, error: null }));

        const url = `${API_BASE_URL}/group/userstorage/${userId}`;
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
        console.log('Storage data received:', data);
        
        setStorageData(prev => ({
          ...prev,
          storageUsed: data.storageUsed || 0,
          loading: false,
          error: null
        }));

      } catch (error) {
        console.error('Error fetching user storage:', error);
        setStorageData(prev => ({
          ...prev,
          loading: false,
          error: error.message
        }));
      }
    };

    fetchUserStorage();
  }, [userId, API_KEY, API_BASE_URL]);

  const handleNavigation = (item) => {
    // Update active section
    setActiveSection(item.id);
    // Navigate to the route
    router.push(item.route);
  };

  // Determine active section from current pathname if not provided
  const getCurrentActiveSection = () => {
    if (activeSection) return activeSection;
    
    const currentItem = sectionItems.find(item => pathname === item.route);
    return currentItem ? currentItem.id : 'home';
  };

  // Helper function to format bytes to human readable format
  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Calculate storage percentage
  const getStoragePercentage = () => {
    if (storageData.storageLimit === 0) return 0;
    return Math.min(parseFloat(((storageData.storageUsed / storageData.storageLimit) * 100).toFixed(2)), 100);
  };

  const currentActive = getCurrentActiveSection();
  const storagePercentage = getStoragePercentage();
  const formattedUsed = formatBytes(storageData.storageUsed);
  const formattedLimit = formatBytes(storageData.storageLimit);

  return (
    <div className={`${isCollapsed ? 'w-12 md:w-16' : 'w-48 md:w-64'} bg-[#fdfbf7] border-r border-gray-200 min-h-screen transition-all duration-300 flex-shrink-0`}>
      <div className={`p-2 ${isCollapsed ? 'md:p-4' : 'md:p-4'}`}>
        <nav className="space-y-2 md:space-y-3">
          {sectionItems.map((item) => {
            const Icon = item.icon;
            return (
              <CustomTooltip key={item.id} content={item.label} side={isCollapsed ? "right" : "bottom"}>
                <button
                  onClick={() => handleNavigation(item)}
                  className={`w-full flex items-center ${isCollapsed ? 'justify-center px-1 md:px-2' : 'px-2 md:px-4'} py-2 text-sm font-medium rounded-lg transition-colors ${
                    currentActive === item.id
                      ? 'bg-orange-50 text-orange-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Icon className={`${isCollapsed ? '' : 'mr-2 md:mr-3'} h-4 w-4 md:h-5 md:w-5 flex-shrink-0`} />
                  {!isCollapsed && <span className="truncate">{item.label}</span>}
                </button>
              </CustomTooltip>
            );
          })}
        </nav>
        
        {/* Storage indicator - Expanded version */}
        {!isCollapsed && (
          <div className="mt-6 md:mt-8 p-3 md:p-4 bg-gray-100 rounded-lg">
            <div className="flex items-center justify-between text-xs md:text-sm text-gray-600 mb-2">
              <span>Storage</span>
              {storageData.loading ? (
                <span className="animate-pulse">Loading...</span>
              ) : storageData.error ? (
                <CustomTooltip content={storageData.error} side="top">
                  <span className="text-red-500 text-xs cursor-help">Error</span>
                </CustomTooltip>
              ) : (
                <>
                  <span className="hidden md:inline">{formattedUsed} of {formattedLimit} used</span>
                  <span className="md:hidden">{storagePercentage}%</span>
                </>
              )}
            </div>
            {storageData.error ? (
              <div className="w-full bg-red-100 border border-red-200 rounded p-2 mb-2">
                <p className="text-red-600 text-xs truncate">{storageData.error}</p>
                <button 
                  onClick={() => window.location.reload()} 
                  className="text-red-700 text-xs underline hover:no-underline"
                >
                  Retry
                </button>
              </div>
            ) : (
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-300 ${
                    storagePercentage > 90 ? 'bg-red-500' : 
                    storagePercentage > 75 ? 'bg-yellow-500' : 'bg-orange-500'
                  }`} 
                  style={{ width: `${storagePercentage}%` }}
                ></div>
              </div>
            )}
            <button className="mt-2 md:mt-3 text-xs md:text-sm text-orange-600 hover:underline block">
              Get more storage
            </button>
          </div>
        )}

        {/* Storage indicator - Collapsed version */}
        {isCollapsed && (
          <CustomTooltip 
            content={
              storageData.loading ? "Loading storage..." :
              storageData.error ? "Error loading storage" :
              `Storage: ${storagePercentage}% used (${formattedUsed} of ${formattedLimit})`
            } 
            side="right"
          >
            <div className="mt-6 md:mt-8 p-2 bg-gray-100 rounded-lg">
              <div className="flex flex-col items-center space-y-2">
                <HardDrive className="h-4 w-4 text-gray-600" />
                <div className="w-full bg-gray-200 rounded-full h-1.5">
                  <div 
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      storagePercentage > 90 ? 'bg-red-500' : 
                      storagePercentage > 75 ? 'bg-yellow-500' : 'bg-orange-500'
                    }`} 
                    style={{ width: `${storagePercentage}%` }}
                  ></div>
                </div>
                <span className="text-xs text-gray-600">
                  {storageData.loading ? '...' : 
                   storageData.error ? 'Err' : 
                   `${storagePercentage}%`}
                </span>
              </div>
            </div>
          </CustomTooltip>
        )}
      </div>
    </div>
  );
};

export default Sidebar;