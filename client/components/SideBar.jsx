'use client';
import React, { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Home, Star, HardDrive } from 'lucide-react';
import CustomTooltip from '@/components/CustomTooltip';

// Sidebar Component
const Sidebar = ({ activeSection, setActiveSection, isCollapsed = false }) => {
  const router = useRouter();
  const pathname = usePathname();

  const sectionItems = [
    { id: 'home', icon: Home, label: 'Home', route: '/home' },
    { id: 'starred', icon: Star, label: 'Starred', route: '/starred' },
    { id: 'storage', icon: HardDrive, label: 'Storage', route: '/storage' }
  ];

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

  const currentActive = getCurrentActiveSection();

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
        
        {/* Storage indicator */}
        {!isCollapsed && (
          <div className="mt-6 md:mt-8 p-3 md:p-4 bg-gray-100 rounded-lg">
            <div className="flex items-center justify-between text-xs md:text-sm text-gray-600 mb-2">
              <span>Storage</span>
              <span className="hidden md:inline">7.16 GB of 15 GB used</span>
              <span className="md:hidden">47%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-orange-500 h-2 rounded-full" style={{ width: '47.7%' }}></div>
            </div>
            <button className="mt-2 md:mt-3 text-xs md:text-sm text-orange-600 hover:underline">
              Get more storage
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Sidebar;