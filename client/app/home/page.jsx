'use client';

import React, { useState } from 'react';
import {Settings, LogOut} from 'lucide-react';
import ProfilePicture from '@/components/ProfilePicture';
import ProfileDropdown from '@/components/ProfileDropDown';
import SearchBar from '@/components/SearchBar';
import Sidebar from '@/components/SideBar';
import GroupsTable from '@/components/GroupsTable';
import CustomTooltip from '@/components/CustomTooltip';
import GroupDailog from '@/components/GroupDailog';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import logo from '@/assets/logo.svg'; 
import { clearUserData } from '@/utils/localStorage'; 
import { getData } from '@/utils/localStorage';

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
const HomePage = () => {
  const [groups , setGroups] = useState([]); // State to hold groups
  const [activeSection, setActiveSection] = useState('home');
  const [isMobile, setIsMobile] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [groupDescription, setGroupDescription] = useState('');
  const userName = getData('username') || 'User'; // Get username from localStorage
  const userEmail = getData('email') || 'Email';
  const router = useRouter();

  // Check screen size
  React.useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 1024); 
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // Handle navigation
  const handleSettingsClick = () => {
    router.push('/profile');
  };

  const handleLogoutClick = () => {
      clearUserData();              
      router.push('/auth/login');
  };

  // Handle dialog close
  const handleDialogClose = () => {
    setGroupName('');
    setGroupDescription('');
    setIsDialogOpen(false);
  };
  
  // Calculate profile picture size based on screen size
  const getProfileSize = () => {
    if (typeof window !== 'undefined') {
      const width = window.innerWidth;
      if (width < 640) return 28; // Mobile
      if (width < 768) return 32; // Small tablet
      if (width < 1024) return 36; // Tablet
      return 40; // Desktop
    }
    return 40; // Default fallback
  };

  const profileSize = getProfileSize();

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
                  <button 
                    onClick={handleSettingsClick}
                    className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                  >
                    <Settings className="h-5 w-5 text-gray-600" />
                  </button>
                </CustomTooltip>
                
                <CustomTooltip content="Sign out">
                  <button 
                    onClick={handleLogoutClick}
                    className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                  >
                    <LogOut className="h-5 w-5 text-gray-600" />
                  </button>
                </CustomTooltip>
                
                <CustomTooltip content={userName}>
                  <div>
                    <ProfilePicture userName={userName} size={profileSize} />
                  </div>
                </CustomTooltip>
              </>
            ) : (
              <ProfileDropdown 
                userName={userName} 
                size={profileSize} 
                handleSettings={handleSettingsClick}
                handleLogout={handleLogoutClick}
              />
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
            <SearchBar isSmall={isMobile} groups={groups} setGroups={setGroups} />
          </div>
          
          {/* Welcome Section */}
          <div className={`${isMobile ? 'mb-6' : 'mb-8'}`}>
            <h2 className={`${isMobile ? 'text-xl' : 'text-2xl'} font-normal text-gray-900 mb-2`}>Welcome to CollabFS</h2>
            <p className={`text-gray-600 ${isMobile ? 'text-sm' : ''}`}>Manage your groups and files securely</p>
          </div>
          
          {/* Groups Table */}
          <GroupsTable isSmall={isMobile} groups={groups}/>
        </div>
      </div>

      <GroupDailog 
        isDialogOpen={isDialogOpen}
        setIsDialogOpen={setIsDialogOpen}
        groupName={groupName}
        setGroupName={setGroupName}
        groupDescription={groupDescription}
        setGroupDescription={setGroupDescription}
        handleDialogClose={handleDialogClose}
      />
    </div>
  );
};

export default HomePage;