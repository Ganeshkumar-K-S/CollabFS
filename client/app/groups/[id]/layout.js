'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname, useParams } from 'next/navigation';
import { MoreVertical, Trash2, LogOut, Edit3, Files, Eye, Users, MessageCircle, Activity, ArrowLeft, Crown, Shield, User, Pencil } from 'lucide-react';
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
    { name: 'Chat', icon: MessageCircle, path: 'chat' }
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

  // Get role icon and styling
  const getRoleDisplay = (role) => {
    const roleUpper = role.toUpperCase();
    switch (roleUpper) {
        case 'OWNER':
            return {
                icon: Crown,
                text: 'Owner',
                bgColor: 'bg-gradient-to-r from-yellow-400 to-yellow-600',
                textColor: 'text-yellow-800',
                iconColor: 'text-yellow-700'
            };
        case 'ADMIN':
            return {
                icon: Shield,
                text: 'Admin',
                bgColor: 'bg-gradient-to-r from-purple-400 to-purple-600',
                textColor: 'text-purple-800',
                iconColor: 'text-purple-700'
            };
        case 'EDITOR':
            return {
                icon: Pencil,
                text: 'Editor',
                bgColor: 'bg-gradient-to-r from-green-400 to-green-600',
                textColor: 'text-green-800',
                iconColor: 'text-green-700'
            };
        case 'VIEWER':
            return {
                icon: Eye,
                text: 'Viewer',
                bgColor: 'bg-gradient-to-r from-gray-300 to-gray-500',
                textColor: 'text-gray-800',
                iconColor: 'text-gray-700'
            };
        default:
            return {
                icon: User,
                text: 'Member',
                bgColor: 'bg-gradient-to-r from-gray-400 to-gray-600',
                textColor: 'text-gray-800',
                iconColor: 'text-gray-700'
            };
    }
};

  const roleDisplay = getRoleDisplay(groupData.userRole);
  const RoleIcon = roleDisplay.icon;

  return (
    <div className="min-h-screen bg-orange-50">
      {/* Header */}
      <header className="bg-white shadow-lg border-b border-orange-200">
        <div className="px-6 py-6">
          <div className="flex items-center justify-between">
            {/* Left side - Back button and Group info */}
            <div className="flex items-center space-x-6">
              {/* Back button */}
              <button
                onClick={handleGoBack}
                className="p-3 hover:bg-orange-100 rounded-xl transition-all duration-200 transform hover:scale-105 group"
                title="Go back to home"
              >
                <ArrowLeft className="w-5 h-5 text-orange-700 group-hover:text-orange-900" />
              </button>
              
              {/* Group Avatar */}
              <div className="relative">
                <ProfilePicture userName={groupData.name} size="48" />
              </div>

              {/* Group Info */}
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <h1 className="text-2xl font-bold text-orange-900">
                    {groupData.loading ? 'Loading...' : groupData.name}
                  </h1>
                  
                  {/* Role Badge */}
                  {!groupData.loading && (
                    <div className={`inline-flex items-center space-x-2 px-3 py-1.5 rounded-full ${roleDisplay.bgColor} shadow-md`}>
                      <RoleIcon className={`w-4 h-4 text-white`} />
                      <span className="text-white font-semibold text-sm">
                        {roleDisplay.text}
                      </span>
                    </div>
                  )}
                </div>

                {/* Description */}
                {groupData.description && !groupData.loading && (
                  <div className="max-w-3xl">
                    <p className="text-orange-800 leading-relaxed">
                      {groupData.description}
                    </p>
                  </div>
                )}

                {!groupData.description && !groupData.loading && (
                  <p className="text-orange-600 italic">
                    No description available
                  </p>
                )}
              </div>
            </div>

            {/* Right side - Options menu */}
            <div className="flex items-center">
              <div className="relative">
                <button
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="p-3 hover:bg-orange-100 rounded-xl transition-all duration-200 transform hover:scale-105"
                >
                  <MoreVertical className="w-5 h-5 text-orange-700" />
                </button>

                {/* Dropdown menu */}
                {showDropdown && (
                  <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-xl border border-orange-200 py-2 z-50 backdrop-blur-sm">
                    <button
                      onClick={() => handleDropdownAction('rename')}
                      className="flex items-center space-x-3 px-4 py-3 text-sm text-orange-800 hover:bg-orange-50 w-full text-left transition-colors"
                    >
                      <Edit3 className="w-4 h-4" />
                      <span>Rename Group</span>
                    </button>
                    <button
                      onClick={() => handleDropdownAction('exit')}
                      className="flex items-center space-x-3 px-4 py-3 text-sm text-orange-800 hover:bg-orange-50 w-full text-left transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Exit Group</span>
                    </button>
                    <div className="border-t border-orange-100 my-1"></div>
                    <button
                      onClick={() => handleDropdownAction('delete')}
                      className="flex items-center space-x-3 px-4 py-3 text-sm text-red-600 hover:bg-red-50 w-full text-left transition-colors"
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
        <aside className="w-64 bg-white shadow-lg border-r border-orange-200 min-h-[calc(100vh-97px)]">
          <nav className="p-4">
            <ul className="space-y-2">
              {sidebarItems.map((item) => {
                const Icon = item.icon;
                const isActive = getCurrentActiveItem() === item.path;
                
                return (
                  <li key={item.path}>
                    <button
                      onClick={() => handleSidebarClick(item.path)}
                      className={`flex items-center space-x-3 w-full px-4 py-3 rounded-xl text-left transition-all duration-200 transform hover:scale-105 ${
                        isActive
                          ? 'bg-gradient-to-r from-orange-400 to-orange-600 text-white shadow-lg'
                          : 'text-orange-800 hover:bg-orange-100'
                      }`}
                    >
                      <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-orange-600'}`} />
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