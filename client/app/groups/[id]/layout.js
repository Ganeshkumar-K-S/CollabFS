'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname, useParams } from 'next/navigation';
import { Search, MoreVertical, Trash2, LogOut, Edit3, Files, Users, MessageCircle, Activity, ArrowLeft } from 'lucide-react';
import ProfilePicture from '@/components/ProfilePicture';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const GroupLayout = ({ children }) => {
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [groupData, setGroupData] = useState({
    name: "",
    description: "",
    userRole: "",
    loading: true
  });
  const [dialogState, setDialogState] = useState({
    rename: false,
    exit: false,
    delete: false
  });
  const [renameForm, setRenameForm] = useState({
    name: "",
    description: ""
  });

  const groupId = params.id;

  // Fetch group data and user role
  useEffect(() => {
    const fetchGroupData = async () => {
      try {
        // Get user ID from localStorage or your auth context
        const userId = localStorage.getItem('userId'); // Adjust this based on your auth system
        
        if (!userId) {
          console.error('User ID not found');
          router.push('/login');
          return;
        }

        // Direct call to your FastAPI backend
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';
        
        const response = await fetch(`${backendUrl}/group/getgroup/${userId}/${groupId}`, {
          headers: {
            'x-api-key': process.env.NEXT_PUBLIC_GROUP_API_KEY || '',
            'Content-Type': 'application/json',
          }
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        setGroupData({
          name: data.groupName,
          description: data.description || "",
          userRole: data.role,
          loading: false
        });
        setRenameForm({
          name: data.groupName,
          description: data.description || ""
        });
      } catch (error) {
        console.error('Error fetching group data:', error);
        setGroupData(prev => ({ 
          ...prev, 
          name: 'Error loading group',
          description: '',
          userRole: 'Unknown',
          loading: false 
        }));
      }
    };

    if (groupId) {
      fetchGroupData();
    }
  }, [groupId, router]);

  const sidebarItems = [
    { name: 'Files', icon: Files, path: 'files' },
    { name: 'Users', icon: Users, path: 'users' },
    { name: 'Chat', icon: MessageCircle, path: 'chat' },
    { name: 'Activity', icon: Activity, path: 'activity' }
  ];

  const getCurrentActiveItem = () => {
    const currentPath = pathname.split('/').pop();
    return currentPath;
  };

  const handleSidebarClick = (path) => {
    router.push(`/groups/${groupId}/${path}`);
  };

  const handleGoBack = () => {
    router.push('/home'); // Navigate back to groups list
  };

  const openDialog = (type) => {
    setShowDropdown(false);
    setDialogState(prev => ({ ...prev, [type]: true }));
  };

  const closeDialog = (type) => {
    setDialogState(prev => ({ ...prev, [type]: false }));
  };

  const handleRenameSubmit = async () => {
    try {
      const userId = localStorage.getItem('userId');
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';
      const apiKey = process.env.NEXT_PUBLIC_GROUP_API_KEY;

      const response = await fetch(`${backendUrl}/group/rename/${groupId}`, {
        method: 'PUT',
        headers: {
          'x-api-key': apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          groupName: renameForm.name,
          description: renameForm.description
        })
      });

      if (response.ok) {
        setGroupData(prev => ({
          ...prev,
          name: renameForm.name,
          description: renameForm.description
        }));
        closeDialog('rename');
      } else {
        throw new Error('Failed to rename group');
      }
    } catch (error) {
      console.error('Error renaming group:', error);
    }
  };

  const handleExitGroup = async () => {
    try {
      const userId = localStorage.getItem('userId');
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';
      const apiKey = process.env.NEXT_PUBLIC_GROUP_API_KEY;

      const response = await fetch(`${backendUrl}/group/exit/${userId}/${groupId}`, {
        method: 'DELETE',
        headers: {
          'x-api-key': apiKey,
          'Content-Type': 'application/json',
        }
      });

      if (response.ok) {
        closeDialog('exit');
        router.push('/home');
      } else {
        throw new Error('Failed to exit group');
      }
    } catch (error) {
      console.error('Error exiting group:', error);
    }
  };

  const handleDeleteGroup = async () => {
    try {
      const userId = localStorage.getItem('userId');
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';
      const apiKey = process.env.NEXT_PUBLIC_GROUP_API_KEY;

      const response = await fetch(`${backendUrl}/group/delete/${groupId}`, {
        method: 'DELETE',
        headers: {
          'x-api-key': apiKey,
          'Content-Type': 'application/json',
        }
      });

      if (response.ok) {
        closeDialog('delete');
        router.push('/home');
      } else {
        throw new Error('Failed to delete group');
      }
    } catch (error) {
      console.error('Error deleting group:', error);
    }
  };

  const handleDropdownAction = (action) => {
    openDialog(action);
  };

  return (
    <div className="min-h-screen bg-orange-50">
      {/* Header */}
      <header className="bg-orange-100 shadow-sm border-b border-orange-200">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Left side - Back button and Group info */}
            <div className="flex items-center space-x-4">
              {/* Back button */}
              <button
                onClick={handleGoBack}
                className="p-2 hover:bg-orange-200 rounded-lg transition-colors group"
                title="Go back to home"
              >
                <ArrowLeft className="w-5 h-5 text-orange-700 group-hover:text-orange-900" />
              </button>
              
              <div className="relative">
                <ProfilePicture userName={groupData.name} size="40" />
              </div>
              <div className="flex-1">
                <h1 className="text-xl font-semibold text-orange-900">
                  {groupData.loading ? 'Loading...' : groupData.name}
                </h1>
                <p className="text-sm text-orange-600">
                  {groupData.loading ? 'Loading...' : groupData.userRole}
                </p>
                {groupData.description && !groupData.loading && (
                  <p className="text-sm text-orange-700 mt-1 max-w-2xl leading-relaxed">
                    {groupData.description}
                  </p>
                )}
              </div>
            </div>

            {/* Right side - Search and options */}
            <div className="flex items-center space-x-4">
              {/* Search bar */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-orange-500 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 w-64 border border-orange-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none bg-white"
                />
              </div>

              {/* Vertical menu */}
              <div className="relative">
                <button
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="p-2 hover:bg-orange-200 rounded-lg transition-colors"
                >
                  <MoreVertical className="w-5 h-5 text-orange-700" />
                </button>

                {/* Dropdown menu */}
                {showDropdown && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-orange-200 py-2 z-50">
                    <button
                      onClick={() => handleDropdownAction('rename')}
                      className="flex items-center space-x-3 px-4 py-2 text-sm text-orange-800 hover:bg-orange-50 w-full text-left"
                    >
                      <Edit3 className="w-4 h-4" />
                      <span>Rename Group</span>
                    </button>
                    <button
                      onClick={() => handleDropdownAction('exit')}
                      className="flex items-center space-x-3 px-4 py-2 text-sm text-orange-800 hover:bg-orange-50 w-full text-left"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Exit Group</span>
                    </button>
                    <button
                      onClick={() => handleDropdownAction('delete')}
                      className="flex items-center space-x-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full text-left"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Delete Group</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 bg-orange-50 shadow-sm border-r border-orange-200 min-h-[calc(100vh-73px)]">
          <nav className="p-4">
            <ul className="space-y-2">
              {sidebarItems.map((item) => {
                const Icon = item.icon;
                const isActive = getCurrentActiveItem() === item.path;
                
                return (
                  <li key={item.path}>
                    <button
                      onClick={() => handleSidebarClick(item.path)}
                      className={`flex items-center space-x-3 w-full px-4 py-3 rounded-lg text-left transition-colors ${
                        isActive
                          ? 'bg-orange-200 text-orange-900 border border-orange-300'
                          : 'text-orange-800 hover:bg-orange-100'
                      }`}
                    >
                      <Icon className={`w-5 h-5 ${isActive ? 'text-orange-900' : 'text-orange-600'}`} />
                      <span className="font-medium">{item.name}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>
        </aside>

        {/* Main content area */}
        <main className="flex-1 p-6 bg-orange-50">
          {children}
        </main>
      </div>

      {/* Dialogs */}
      
      {/* Rename Group Dialog */}
      <Dialog open={dialogState.rename} onOpenChange={(open) => !open && closeDialog('rename')}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Rename Group</DialogTitle>
            <DialogDescription>
              Update the group name and description. Changes will be visible to all members.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="group-name" className="text-right">
                Name
              </Label>
              <Input
                id="group-name"
                value={renameForm.name}
                onChange={(e) => setRenameForm(prev => ({ ...prev, name: e.target.value }))}
                className="col-span-3"
                placeholder="Enter group name"
              />
            </div>
            <div className="grid grid-cols-4 items-start gap-4">
              <Label htmlFor="group-description" className="text-right mt-2">
                Description
              </Label>
              <Textarea
                id="group-description"
                value={renameForm.description}
                onChange={(e) => setRenameForm(prev => ({ ...prev, description: e.target.value }))}
                className="col-span-3"
                placeholder="Enter group description (optional)"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => closeDialog('rename')}>
              Cancel
            </Button>
            <Button 
              onClick={handleRenameSubmit}
              disabled={!renameForm.name.trim()}
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Exit Group Dialog */}
      <Dialog open={dialogState.exit} onOpenChange={(open) => !open && closeDialog('exit')}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Exit Group</DialogTitle>
            <DialogDescription>
              Are you sure you want to leave "{groupData.name}"? You will no longer have access to this group's files, chats, and activities.
            </DialogDescription>
          </DialogHeader>
          {groupData.description && (
            <div className="py-2">
              <p className="text-sm text-gray-600">
                <strong>Group Description:</strong> {groupData.description}
              </p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => closeDialog('exit')}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleExitGroup}>
              Exit Group
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Group Dialog */}
      <Dialog open={dialogState.delete} onOpenChange={(open) => !open && closeDialog('delete')}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Delete Group</DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete "{groupData.name}" and remove all members, files, chats, and activities.
            </DialogDescription>
          </DialogHeader>
          {groupData.description && (
            <div className="py-2">
              <p className="text-sm text-gray-600">
                <strong>Group Description:</strong> {groupData.description}
              </p>
            </div>
          )}
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 my-2">
            <p className="text-sm text-red-800">
              <strong>Warning:</strong> All group data will be permanently lost. This includes:
            </p>
            <ul className="text-sm text-red-700 mt-2 ml-4 list-disc">
              <li>All uploaded files</li>
              <li>Chat history</li>
              <li>Activity logs</li>
              <li>Member information</li>
            </ul>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => closeDialog('delete')}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteGroup}>
              Delete Group Permanently
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Click outside to close dropdown */}
      {showDropdown && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowDropdown(false)}
        />
      )}
    </div>
  );
};

export default GroupLayout;