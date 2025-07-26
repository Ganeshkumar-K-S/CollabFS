'use client';
import React from 'react'
import { Settings, LogOut } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import ProfilePicture from './ProfilePicture'

// ProfileDropdown component using shadcn/ui
const ProfileDropdown = ({ userName }) => {
  const handleLogout = () => {
    console.log('Logging out...')
    window.location.href = '/auth/login'
  }

  const handleSettings = () => {
    window.location.href = '/profile'
  }

  // Function to truncate username if too long (for dropdown display)
  const truncateUsername = (name) => {
    if (!name) return '';
    if (name.length <= 20) return name;
    return name.substring(0, 17) + '...';
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="focus:outline-none focus:ring-2 focus:ring-gray-100 focus:ring-offset-2 rounded-full">
          <ProfilePicture userName={userName} />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex items-center gap-3">
            <div style={{ transform: 'scale(0.6)', transformOrigin: 'left center' }}>
              <ProfilePicture userName={userName} />
            </div>
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">
                {truncateUsername(userName)}
              </p>
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSettings} className="cursor-pointer">
          <Settings className="mr-2 h-4 w-4" />
          <span>Settings</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
          <LogOut className="mr-2 h-4 w-4" />
          <span>Logout</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
export default ProfileDropdown;