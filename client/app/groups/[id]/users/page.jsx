'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { Search, Plus, X, Trash2, Crown, Shield, User, Pencil, Eye } from 'lucide-react';
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const UsersPage = () => {
  const pathname = usePathname();
  const groupId = pathname.split('/')[2]; // Assuming the last segment is the group

  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [addUserDialog, setAddUserDialog] = useState(false);
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);

  // Get role display info
  const getRoleDisplay = (role) => {
    const roleUpper = role?.toUpperCase() || 'MEMBER';
    switch (roleUpper) {
      case 'OWNER':
        return {
          icon: Crown,
          text: 'Owner',
          bgColor: 'bg-gradient-to-r from-yellow-400/80 to-yellow-600/80 backdrop-blur-sm',
          textColor: 'text-yellow-100'
        };
      case 'ADMIN':
        return {
          icon: Shield,
          text: 'Admin',
          bgColor: 'bg-gradient-to-r from-purple-400/80 to-purple-600/80 backdrop-blur-sm',
          textColor: 'text-purple-100'
        };
      case 'EDITOR':
        return {
          icon: Pencil,
          text: 'Editor',
          bgColor: 'bg-gradient-to-r from-green-400/80 to-green-600/80 backdrop-blur-sm',
          textColor: 'text-green-100'
        };
      case 'VIEWER':
        return {
          icon: Eye,
          text: 'Viewer',
          bgColor: 'bg-gradient-to-r from-gray-400/60 to-gray-600/60 backdrop-blur-sm',
          textColor: 'text-gray-100'
        };
      default:
        return {
          icon: User,
          text: 'Member',
          bgColor: 'bg-gradient-to-r from-gray-400/60 to-gray-600/60 backdrop-blur-sm',
          textColor: 'text-gray-100'
        };
    }
  };

  // Fetch group users using the backend API
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const backendUrl = process.env.NEXT_PUBLIC_API_BACKEND_URL || 'http://localhost:8000';
        
        const response = await fetch(`${backendUrl}/user/displayuser?groupId=${groupId}`, {
          headers: {
            'x-api-key': process.env.NEXT_PUBLIC_USERSERVICES_API_KEY || '',
            'Content-Type': 'application/json',
          }
        });

        if (response.ok) {
          const data = await response.json();
          const mappedUsers = data.map(user => ({
            userId: user._id,
            userName: user.name,
            userEmail: user.email,
            role: user.role
          }));
          setUsers(mappedUsers);
        } else {
          console.error('Failed to fetch users');
          setUsers([]);
        }
      } catch (error) {
        console.error('Error fetching users:', error);
        setUsers([]);
      } finally {
        setLoading(false);
      }
    };

    if (groupId) {
      fetchUsers();
    }
  }, [groupId]);

  // Search for users to add using the backend API
  const searchUsers = async (searchQuery) => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    setSearchLoading(true);
    try {
      const backendUrl = process.env.NEXT_PUBLIC_API_BACKEND_URL || 'http://localhost:8000';
      
      const response = await fetch(`${backendUrl}/user/searchuser/${encodeURIComponent(searchQuery)}`, {
        headers: {
          'x-api-key': process.env.NEXT_PUBLIC_USERSERVICES_API_KEY || '',
          'Content-Type': 'application/json',
        }
      });

      if (response.ok) {
        const data = await response.json();
        const mappedResults = data.map(user => ({
          userId: user.userId,
          userName: user.username
        }));
        
        // Filter out users already in the group
        const availableUsers = mappedResults.filter(user => 
          !users.some(groupUser => groupUser.userId === user.userId)
        );
        setSearchResults(availableUsers);
      } else {
        console.error('Failed to search users');
        setSearchResults([]);
      }
    } catch (error) {
      console.error('Error searching users:', error);
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  };

  // Debounced search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (userSearchTerm) {
        searchUsers(userSearchTerm);
      } else {
        setSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [userSearchTerm, users]);

  // Filter users based on search term
  const filteredUsers = users.filter(user =>
    user.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.userEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.userId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Add user to selection
  const addToSelection = (user) => {
    if (!selectedUsers.find(u => u.userId === user.userId)) {
      setSelectedUsers(prev => [...prev, { ...user, role: 'viewer' }]);
    }
  };

  // Remove user from selection
  const removeFromSelection = (userId) => {
    setSelectedUsers(prev => prev.filter(u => u.userId !== userId));
  };

  // Update selected user role
  const updateSelectedUserRole = (userId, newRole) => {
    setSelectedUsers(prev => prev.map(u => 
      u.userId === userId ? { ...u, role: newRole } : u
    ));
  };

  // Add selected users to group using the backend API
  const addUsersToGroup = async () => {
    if (selectedUsers.length === 0) return;

    try {
      const backendUrl = process.env.NEXT_PUBLIC_API_BACKEND_URL || 'http://localhost:8000';
      
      const usersData = selectedUsers.map(user => ({
        userId: user.userId,
        groupId: groupId,
        role: user.role
      }));

      const response = await fetch(`${backendUrl}/user/adduser`, {
        method: 'POST',
        headers: {
          'x-api-key': process.env.NEXT_PUBLIC_USERSERVICES_API_KEY || '',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(usersData)
      });

      if (response.ok) {
        // Refresh users list
        const displayResponse = await fetch(`${backendUrl}/user/displayuser?groupId=${groupId}`, {
          headers: {
            'x-api-key': process.env.NEXT_PUBLIC_USERSERVICES_API_KEY || '',
            'Content-Type': 'application/json',
          }
        });

        if (displayResponse.ok) {
          const data = await displayResponse.json();
          const mappedUsers = data.map(user => ({
            userId: user._id,
            userName: user.name,
            userEmail: user.email,
            role: user.role
          }));
          setUsers(mappedUsers);
        }

        // Reset state
        setSelectedUsers([]);
        setUserSearchTerm('');
        setSearchResults([]);
        setAddUserDialog(false);
        alert(`Successfully added ${selectedUsers.length} user${selectedUsers.length !== 1 ? 's' : ''} to the group`);
      } else {
        const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }));
        console.error('Failed to add users to group:', errorData);
        alert(`Failed to add users: ${errorData.detail || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error adding users:', error);
      alert('An error occurred while adding users. Please try again.');
    }
  };

  // Remove user function
  const removeUser = async (userId) => {
    const userToDelete = users.find(user => user.userId === userId);
    if (!userToDelete) {
      console.error('User not found');
      return;
    }

    if (userToDelete.role?.toLowerCase() === 'owner') {
      alert('Cannot remove the group owner');
      return;
    }

    const confirmDelete = window.confirm(
      `Are you sure you want to remove ${userToDelete.userName} from this group?`
    );
    
    if (!confirmDelete) {
      return;
    }

    try {
      const backendUrl = process.env.NEXT_PUBLIC_API_BACKEND_URL || 'http://localhost:8000';
      
      const response = await fetch(`${backendUrl}/user/exitgroup`, {
        method: 'POST',
        headers: {
          'x-api-key': process.env.NEXT_PUBLIC_USERSERVICES_API_KEY || '',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          groupId: groupId,
          userId: userId,
          role: userToDelete.role?.toLowerCase() || 'member'
        })
      });

      if (response.ok) {
        const result = await response.json();
        console.log('User removed successfully:', result.message);
        
        setUsers(prev => prev.filter(user => user.userId !== userId));
        alert(`${userToDelete.userName} has been removed from the group successfully`);
      } else {
        const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }));
        console.error('Failed to remove user from group:', errorData);
        alert(`Failed to remove user: ${errorData.detail || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error removing user:', error);
      alert('An error occurred while removing the user. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white border-b border-orange-200 px-6 py-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-400/90 to-orange-600/90 backdrop-blur-sm rounded-xl flex items-center justify-center shadow-lg">
                <User className="w-7 h-7 text-white drop-shadow-sm" />
              </div>
              <div className="flex flex-col">
                <h2 className="text-xl font-bold text-orange-900">Group Users</h2>
                <p className="text-sm text-orange-600/80">
                  {filteredUsers.length} user{filteredUsers.length !== 1 ? 's' : ''}
                  {searchTerm && ` matching "${searchTerm}"`}
                </p>
              </div>
            </div>

            <div className="flex-1 max-w-md ml-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-orange-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full rounded-md border border-orange-300 bg-white text-sm focus:border-orange-500 focus:ring-2 focus:ring-orange-500 focus:ring-opacity-20 focus:outline-none transition-colors"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Users Table with Aligned Columns */}
        <div className="bg-white rounded-xl shadow-lg border border-orange-200 overflow-hidden">
          {/* Single Table with Fixed Layout */}
          <div className="overflow-x-auto">
            <table className="w-full table-fixed">
              {/* Table Header */}
              <thead className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
                <tr>
                  <th className="w-2/5 px-6 py-4 text-left text-sm font-semibold">User</th>
                  <th className="w-1/4 px-6 py-4 text-left text-sm font-semibold hidden lg:table-cell">Email</th>
                  <th className="w-1/5 px-6 py-4 text-left text-sm font-semibold hidden sm:table-cell">Role</th>
                  <th className="w-1/5 px-6 py-4 text-center text-sm font-semibold">Actions</th>
                </tr>
              </thead>

              {/* Scrollable Table Body */}
              <tbody className="divide-y divide-orange-100 bg-white">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="px-6 py-12 text-center text-orange-600">
                      <div className="flex flex-col items-center space-y-3">
                        <User className="w-12 h-12 text-orange-300" />
                        <div>
                          {searchTerm ? 'No users found matching your search.' : 'No users in this group yet.'}
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => {
                    const roleDisplay = getRoleDisplay(user.role);
                    const RoleIcon = roleDisplay.icon;
                    const isLongUserName = user.userName?.length > 15;
                    const isLongEmail = user.userEmail?.length > 20;
                    
                    return (
                      <tr key={user.userId} className="hover:bg-orange-50/80 transition-colors duration-200">
                        {/* User Column - Fixed width w-2/5 */}
                        <td className="w-2/5 px-6 py-4">
                          <div className="flex items-center space-x-3">
                            <div className="flex-shrink-0">
                              <ProfilePicture userName={user.userName} size="40" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="font-semibold text-orange-900">
                                {isLongUserName ? (
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <span className="truncate cursor-help block">
                                        {user.userName}
                                      </span>
                                    </TooltipTrigger>
                                    <TooltipContent className="bg-white text-orange-900 border border-orange-200 shadow-lg">
                                      <p>{user.userName}</p>
                                    </TooltipContent>
                                  </Tooltip>
                                ) : (
                                  <span className="truncate block">{user.userName}</span>
                                )}
                              </div>
                              {/* Show email and role on mobile */}
                              <div className="text-sm text-orange-600 lg:hidden truncate">
                                {user.userEmail}
                              </div>
                              <div className="sm:hidden">
                                <span className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs ${roleDisplay.bgColor} mt-1`}>
                                  <RoleIcon className="w-3 h-3 text-white" />
                                  <span className="text-white font-medium">{roleDisplay.text}</span>
                                </span>
                              </div>
                              <div className="text-xs text-orange-500 font-mono truncate mt-1">
                                ID: {user.userId}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Email Column - Fixed width w-1/4, hidden on mobile */}
                        <td className="w-1/4 px-6 py-4 text-orange-700 hidden lg:table-cell">
                          {isLongEmail ? (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="truncate cursor-help">
                                  {user.userEmail}
                                </div>
                              </TooltipTrigger>
                              <TooltipContent className="bg-white text-orange-900 border border-orange-200 shadow-lg">
                                <p>{user.userEmail}</p>
                              </TooltipContent>
                            </Tooltip>
                          ) : (
                            <div className="truncate">{user.userEmail}</div>
                          )}
                        </td>

                        {/* Role Column - Fixed width w-1/5, hidden on mobile */}
                        <td className="w-1/5 px-6 py-4 hidden sm:table-cell">
                          <div className={`inline-flex items-center space-x-2 px-3 py-1.5 rounded-full ${roleDisplay.bgColor} shadow-md`}>
                            <RoleIcon className="w-4 h-4 text-white" />
                            <span className="text-white font-semibold text-sm">
                              {roleDisplay.text}
                            </span>
                          </div>
                        </td>

                        {/* Actions Column - Fixed width w-1/5 */}
                        <td className="w-1/5 px-6 py-4">
                          <div className="flex items-center justify-center">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeUser(user.userId)}
                                  className="text-red-600 hover:text-red-800 hover:bg-red-50 transition-colors duration-200 p-2"
                                  disabled={user.role?.toLowerCase() === 'owner'}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent className="bg-white text-orange-900 border border-orange-200 shadow-lg">
                                <p>{user.role?.toLowerCase() === 'owner' ? 'Cannot remove owner' : 'Remove user'}</p>
                              </TooltipContent>
                            </Tooltip>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          
          {/* Scroll Indicator */}
          {filteredUsers.length > 8 && (
            <div className="bg-gradient-to-r from-orange-100/50 to-orange-200/50 px-4 py-2 text-center text-xs text-orange-600">
              <div className="flex items-center justify-center space-x-2">
                <div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse"></div>
                <span>Scroll to see more users</span>
                <div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse"></div>
              </div>
            </div>
          )}
        </div>

        {/* Add User Button */}
        <div className="fixed bottom-6 right-6">
          <Dialog open={addUserDialog} onOpenChange={setAddUserDialog}>
            <DialogTrigger asChild>
              <Button
                size="lg"
                className="rounded-full w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 shadow-lg transform hover:scale-110 transition-all duration-200"
              >
                <Plus className="w-5 h-5 sm:w-6 sm:h-6" />
              </Button>
            </DialogTrigger>
            <DialogContent className="w-[95vw] max-w-[95vw] sm:max-w-[600px] max-h-[90vh] overflow-hidden flex flex-col">
              <DialogHeader className="border-b border-orange-100/50 pb-4">
                <DialogTitle className="text-xl font-bold text-orange-900">Add Users to Group</DialogTitle>
                <DialogDescription className="text-orange-600/80">
                  Search for users and add them to your group with appropriate roles.
                </DialogDescription>
              </DialogHeader>
              
              <div className="flex-1 overflow-hidden flex flex-col space-y-6 py-4">
                {/* User Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-orange-400/70 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search users by name..."
                    value={userSearchTerm}
                    onChange={(e) => setUserSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-3 w-full rounded-xl border border-orange-200/50 bg-white/60 backdrop-blur-sm text-sm focus:border-orange-400/60 focus:ring-2 focus:ring-orange-400/20 focus:outline-none transition-all duration-300 placeholder-orange-400/60"
                  />
                </div>

                {/* Search Results */}
                <div className="space-y-3 max-h-40 sm:max-h-48 overflow-y-auto scrollbar-thin scrollbar-thumb-orange-300 scrollbar-track-orange-50">
                  <Label className="text-sm font-semibold text-orange-900">Search Results</Label>
                  {searchLoading ? (
                    <div className="flex items-center justify-center py-12 backdrop-blur-sm bg-white/40 rounded-xl">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
                    </div>
                  ) : searchResults.length > 0 ? (
                    <div className="space-y-2">
                      {searchResults.map((user) => (
                        <div
                          key={user.userId}
                          onClick={() => addToSelection(user)}
                          className="flex items-center space-x-3 p-4 border border-orange-200/50 rounded-xl hover:bg-orange-50/60 cursor-pointer transition-all duration-300 backdrop-blur-sm bg-white/40 hover:shadow-md group"
                        >
                          <div className="flex-shrink-0">
                            <ProfilePicture userName={user.userName} size="36" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-orange-900 truncate">{user.userName}</div>
                            <div className="text-sm text-orange-600/70 truncate font-mono">{user.userId}</div>
                          </div>
                          <Plus className="w-5 h-5 text-orange-600 flex-shrink-0 group-hover:scale-110 transition-transform duration-200" />
                        </div>
                      ))}
                    </div>
                  ) : userSearchTerm && !searchLoading ? (
                    <div className="text-center py-12 text-orange-600/70 backdrop-blur-sm bg-white/40 rounded-xl">
                      <User className="w-12 h-12 text-orange-300/50 mx-auto mb-3" />
                      <div>No users found matching "{userSearchTerm}"</div>
                    </div>
                  ) : null}
                </div>

                {/* Selected Users */}
                <div className="space-y-3 flex-1 overflow-hidden">
                  <Label className="text-sm font-semibold text-orange-900">
                    Selected Users ({selectedUsers.length})
                  </Label>
                  <div className="border border-orange-200/50 rounded-xl max-h-40 sm:max-h-48 overflow-y-auto backdrop-blur-sm bg-white/30 scrollbar-thin scrollbar-thumb-orange-300 scrollbar-track-orange-50">
                    {selectedUsers.length === 0 ? (
                      <div className="text-center py-12 text-orange-600/70">
                        <Plus className="w-12 h-12 text-orange-300/50 mx-auto mb-3" />
                        <div>No users selected yet</div>
                      </div>
                    ) : (
                      <div className="space-y-2 p-3">
                        {selectedUsers.map((user) => (
                          <div key={user.userId} className="flex items-center space-x-2 sm:space-x-3 p-3 bg-orange-50/60 backdrop-blur-sm rounded-xl border border-white/40">
                            <div className="flex-shrink-0">
                              <ProfilePicture userName={user.userName} size="32" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-semibold text-orange-900 truncate text-sm sm:text-base">{user.userName}</div>
                              <div className="text-xs sm:text-sm text-orange-600/70 truncate font-mono">{user.userId}</div>
                            </div>
                            <div className="flex-shrink-0">
                              <Select
                                value={user.role}
                                onValueChange={(value) => updateSelectedUserRole(user.userId, value)}
                              >
                                <SelectTrigger className="w-20 sm:w-28 text-xs sm:text-sm backdrop-blur-sm bg-white/60 border-orange-200/50">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="backdrop-blur-md bg-white/90">
                                  <SelectItem value="viewer">Viewer</SelectItem>
                                  <SelectItem value="editor">Editor</SelectItem>
                                  <SelectItem value="admin">Admin</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeFromSelection(user.userId)}
                              className="text-red-500 hover:text-red-700 hover:bg-red-50/60 p-2 flex-shrink-0 rounded-lg transition-all duration-200"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <DialogFooter className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-orange-100/50">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setAddUserDialog(false);
                    setSelectedUsers([]);
                    setUserSearchTerm('');
                    setSearchResults([]);
                  }}
                  className="w-full sm:w-auto order-2 sm:order-1 backdrop-blur-sm bg-white/60 border-orange-200/50 hover:bg-white/80"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={addUsersToGroup}
                  disabled={selectedUsers.length === 0}
                  className="w-full sm:w-auto bg-gradient-to-r from-orange-500/90 to-orange-600/90 hover:from-orange-600/90 hover:to-orange-700/90 order-1 sm:order-2 backdrop-blur-sm border border-white/20 shadow-lg disabled:opacity-50"
                >
                  Add {selectedUsers.length} User{selectedUsers.length !== 1 ? 's' : ''}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </TooltipProvider>
  );
};

export default UsersPage;