'use client';

import React, { useState } from 'react';
import {Settings, LogOut } from 'lucide-react';
import ProfilePicture from '@/components/ProfilePicture';
import ProfileDropdown from '@/components/ProfileDropDown';
import SearchBar from '@/components/SearchBar';
import Sidebar from '@/components/SideBar';
import GroupsTable from '@/components/GroupsTable';
import CustomTooltip from '@/components/CustomTooltip';
import Image from 'next/image';
import logo from '@/assets/logo.svg'; 

// Header Component
const Header = ({ isSmall = false }) => {
  
  return (
    <div className="flex items-center justify-center w-full min-w-0">
      <div className="flex items-center space-x-2 md:space-x-4 min-w-0">
        {/* Logo and Title */}
        <Image src={logo} alt="CollabFS Logo" height={isSmall ? 24 : 60} width={isSmall ? 24 : 60} />
        <span className={`${isSmall ? 'text-lg md:text-xl' : 'text-4xl md:text-6xl'} font-serif font-normal text-black tracking-tight truncate`}>
          CollabFS
        </span>
      </div>
    </div>
  );
};

// Main Drive Home Page Component
const DriveHomePage = () => {
  const [activeSection, setActiveSection] = useState('home');
  const [isMobile, setIsMobile] = useState(false);
  const userName = 'Harivansh B';

  // Check screen size
  React.useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 1024); 
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  return (
    <div className="min-h-screen bg-[#fdfbf7] overflow-x-hidden">
      {/* Header */}
      <header className={`bg-[#fdfbf7] border-b border-gray-200 px-4 md:px-6 ${isMobile ? 'py-4' : 'py-8'}`}>
        <div className="flex items-center justify-between max-w-full">
          <div className="flex-shrink min-w-0">
            <Header isSmall={isMobile} />
          </div>
          
          {/* Right side icons */}
          <div className="flex items-center space-x-2 md:space-x-4 flex-shrink-0">
            {!isMobile ? (
              <>
                <CustomTooltip content="Settings">
                  <button className="p-2 rounded-full hover:bg-gray-100 transition-colors">
                    <Settings className="h-5 w-5 text-gray-600" />
                  </button>
                </CustomTooltip>
                
                <CustomTooltip content="Sign out">
                  <button className="p-2 rounded-full hover:bg-gray-100 transition-colors">
                    <LogOut className="h-5 w-5 text-gray-600" />
                  </button>
                </CustomTooltip>
                
                <CustomTooltip content={userName}>
                  <div>
                    <ProfilePicture userName={userName} size={40} />
                  </div>
                </CustomTooltip>
              </>
            ) : (
              <ProfileDropdown userName={userName} size={28} />
            )}
          </div>
        </div>
      </header>

      <div className="flex min-h-0">
        {/* Sidebar */}
        <div className="flex-shrink-0">
          <Sidebar activeSection={activeSection} setActiveSection={setActiveSection} isCollapsed={isMobile} />
        </div>
        
        {/* Main Content */}
        <div className={`flex-1 min-w-0 ${isMobile ? 'p-4' : 'p-8'} bg-[#fdfbf7]`}>
          {/* Search Bar */}
          <div className={`${isMobile ? 'mb-6' : 'mb-8'}`}>
            <SearchBar isSmall={isMobile} />
          </div>
          
          {/* Welcome Section */}
          <div className={`${isMobile ? 'mb-6' : 'mb-8'}`}>
            <h2 className={`${isMobile ? 'text-xl' : 'text-2xl'} font-normal text-gray-900 mb-2`}>Welcome to CollabFS</h2>
            <p className={`text-gray-600 ${isMobile ? 'text-sm' : ''}`}>Manage your groups and files securely</p>
          </div>
          
          {/* Groups Table */}
          <GroupsTable isSmall={isMobile} />
        </div>
      </div>
    </div>
  );
};

export default DriveHomePage;