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

  // Fetch group users using the backend API
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const backendUrl = process.env.NEXT_PUBLIC_API_BACKEND_URL || 'http://localhost:8000';
        
        // Using the displayuser endpoint from your backend
        const response = await fetch(`${backendUrl}/user/displayuser?groupId=${groupId}`, {
          headers: {
            'x-api-key': process.env.NEXT_PUBLIC_USERSERVICES_API_KEY || '',
            'Content-Type': 'application/json',
          }
        });

        if (response.ok) {
          const data = await response.json();
          // Map the backend response to frontend format
          const mappedUsers = data.map(user => ({
            userId: user._id,
            userName: user.name,
            userEmail: user.email,
            role: user.role
          }));
          setUsers(mappedUsers);
        } else {
          console.error('Failed to fetch users');
        }
      } catch (error) {
        console.error('Error fetching users:', error);
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
      
      // Using the searchuser endpoint from your backend
      const response = await fetch(`${backendUrl}/user/searchuser/${encodeURIComponent(searchQuery)}`, {
        headers: {
          'x-api-key': process.env.NEXT_PUBLIC_USERSERVICES_API_KEY || '',
          'Content-Type': 'application/json',
        }
      });

      if (response.ok) {
        const data = await response.json();
        // Map the backend response to frontend format
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
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [userSearchTerm]);

  // Filter users based on search term
  const filteredUsers = users.filter(user =>
    user.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.userEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.userId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Get role display info
  const getRoleDisplay = (role) => {
    const roleUpper = role.toUpperCase();
    switch (roleUpper) {
      case 'OWNER':
        return {
          icon: Crown,
          text: 'Owner',
          bgColor: 'bg-gradient-to-r from-yellow-400 to-yellow-600',
          textColor: 'text-yellow-800'
        };
      case 'ADMIN':
        return {
          icon: Shield,
          text: 'Admin',
          bgColor: 'bg-gradient-to-r from-purple-400 to-purple-600',
          textColor: 'text-purple-800'
        };
      case 'EDITOR':
        return {
          icon: Pencil,
          text: 'Editor',
          bgColor: 'bg-gradient-to-r from-green-400 to-green-600',
          textColor: 'text-green-800'
        };
      case 'VIEWER':
        return {
          icon: Eye,
          text: 'Viewer',
          bgColor: 'bg-gradient-to-r from-gray-300 to-gray-500',
          textColor: 'text-gray-800'
        };
      default:
        return {
          icon: User,
          text: 'Member',
          bgColor: 'bg-gradient-to-r from-gray-400 to-gray-600',
          textColor: 'text-gray-800'
        };
    }
  };

  // Add user to selection
  const addToSelection = (user) => {
    if (!selectedUsers.find(u => u.userId === user.userId)) {
      setSelectedUsers([...selectedUsers, { ...user, role: 'viewer' }]);
    }
  };

  // Remove user from selection
  const removeFromSelection = (userId) => {
    setSelectedUsers(selectedUsers.filter(u => u.userId !== userId));
  };

  // Update selected user role
  const updateSelectedUserRole = (userId, newRole) => {
    setSelectedUsers(selectedUsers.map(u => 
      u.userId === userId ? { ...u, role: newRole } : u
    ));
  };

  // Add selected users to group using the backend API
  const addUsersToGroup = async () => {
    try {
      const backendUrl = process.env.NEXT_PUBLIC_API_BACKEND_URL || 'http://localhost:8000';
      
      // Prepare users data according to backend format
      const usersData = selectedUsers.map(user => ({
        userId: user.userId,
        groupId: groupId,
        role: user.role
      }));

      // Using the adduser endpoint from your backend
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
      } else {
        console.error('Failed to add users to group');
      }
    } catch (error) {
      console.error('Error adding users:', error);
    }
  };

  // Updated removeUser function for the React component
  const removeUser = async (userId) => {
    // Confirmation dialog before deletion
    const userToDelete = users.find(user => user.userId === userId);
    if (!userToDelete) {
      console.error('User not found');
      return;
    }

    // Prevent owner from being removed
    if (userToDelete.role.toLowerCase() === 'owner') {
      alert('Cannot remove the group owner');
      return;
    }

    // Confirm deletion
    const confirmDelete = window.confirm(
      `Are you sure you want to remove ${userToDelete.userName} from this group?`
    );
    
    if (!confirmDelete) {
      return;
    }

    try {
      const backendUrl = process.env.NEXT_PUBLIC_API_BACKEND_URL || 'http://localhost:8000';
      
      // Using the exitgroup endpoint from your backend
      const response = await fetch(`${backendUrl}/user/exitgroup`, {
        method: 'POST',
        headers: {
          'x-api-key': process.env.NEXT_PUBLIC_USERSERVICES_API_KEY || '',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          groupId: groupId,
          userId: userId,
          role: userToDelete.role.toLowerCase() // Ensure role is lowercase as expected by backend
        })
      });

      if (response.ok) {
        const result = await response.json();
        console.log('User removed successfully:', result.message);
        
        // Remove user from local state
        setUsers(users.filter(user => user.userId !== userId));
        
        // Show success message (you can replace this with a toast notification)
        alert(`${userToDelete.userName} has been removed from the group successfully`);
      } else {
        const errorData = await response.json();
        console.error('Failed to remove user from group:', errorData);
        alert(`Failed to remove user: ${errorData.detail || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error removing user:', error);
      alert('An error occurred while removing the user. Please try again.');
    }
  };

  // Delete group function (for owner only)
  const deleteGroup = async () => {
    try {
      const currentUserId = localStorage.getItem('userId');
      const backendUrl = process.env.NEXT_PUBLIC_API_BACKEND_URL || 'http://localhost:8000';
      
      const response = await fetch(`${backendUrl}/user/deletegroup`, {
        method: 'POST',
        headers: {
          'x-api-key': process.env.NEXT_PUBLIC_USERSERVICES_API_KEY || '',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          groupId: groupId,
          userId: currentUserId
        })
      });

      if (response.ok) {
        // Redirect to groups page or show success message
        window.location.href = '/groups';
      } else {
        console.error('Failed to delete group');
      }
    } catch (error) {
      console.error('Error deleting group:', error);
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
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border-b border-orange-200 px-6 py-4 shadow-sm">
        <div className="flex items-center justify-between">
          
          {/* Left Section: Icon + Text */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center">
              <User className="w-6 h-6 text-white" />
            </div>
            <div className="flex flex-col">
              <h2 className="text-lg font-semibold text-orange-900">Group Users</h2>
              <p className="text-sm text-orange-600">Manage users in this group</p>
            </div>
          </div>

          {/* Right Section: Search Bar */}
          <div className="relative max-w-md w-full sm:w-auto">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-orange-400 w-4 h-4" />
            <Input
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 border-orange-200 focus:ring-orange-500 focus:border-orange-500"
            />
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl shadow-lg border border-orange-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold">User</th>
                <th className="px-6 py-4 text-left text-sm font-semibold hidden sm:table-cell">Email</th>
                <th className="px-6 py-4 text-left text-sm font-semibold">Role</th>
                <th className="px-6 py-4 text-center text-sm font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-orange-100">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-6 py-12 text-center text-orange-600">
                    {searchTerm ? 'No users found matching your search.' : 'No users in this group yet.'}
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user, index) => {
                  const roleDisplay = getRoleDisplay(user.role);
                  const RoleIcon = roleDisplay.icon;
                  
                  return (
                    <tr key={user.userId} className="hover:bg-orange-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <ProfilePicture userName={user.userName} size="40" />
                          <div>
                            <div className="font-semibold text-orange-900">{user.userName}</div>
                            <div className="text-sm text-orange-600 sm:hidden">{user.userEmail}</div>
                            <div className="text-xs text-orange-500">{user.userId}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-orange-700 hidden sm:table-cell">
                        {user.userEmail}
                      </td>
                      <td className="px-6 py-4">
                        <div className={`inline-flex items-center space-x-2 px-3 py-1.5 rounded-full ${roleDisplay.bgColor} shadow-md`}>
                          <RoleIcon className="w-4 h-4 text-white" />
                          <span className="text-white font-semibold text-sm">
                            {roleDisplay.text}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeUser(user.userId)}
                          className="text-red-600 hover:text-red-800 hover:bg-red-50"
                          disabled={user.role.toLowerCase() === 'owner'}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add User Button */}
      <div className="fixed bottom-6 right-6">
        <Dialog open={addUserDialog} onOpenChange={setAddUserDialog}>
          <DialogTrigger asChild>
            <Button
              size="lg"
              className="rounded-full w-14 h-14 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 shadow-lg transform hover:scale-110 transition-all duration-200"
            >
              <Plus className="w-6 h-6" />
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-hidden flex flex-col">
            <DialogHeader>
              <DialogTitle>Add Users to Group</DialogTitle>
              <DialogDescription>
                Search for users and add them to your group with appropriate roles.
              </DialogDescription>
            </DialogHeader>
            
            <div className="flex-1 overflow-hidden flex flex-col space-y-4">
              {/* User Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-orange-400 w-4 h-4" />
                <Input
                  placeholder="Search users by name..."
                  value={userSearchTerm}
                  onChange={(e) => setUserSearchTerm(e.target.value)}
                  className="pl-10 border-orange-200 focus:ring-orange-500 focus:border-orange-500"
                />
              </div>

              {/* Search Results */}
              <div className="space-y-2 max-h-48 overflow-y-auto">
                <Label className="text-sm font-medium text-orange-900">Search Results</Label>
                {searchLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-600"></div>
                  </div>
                ) : searchResults.length > 0 ? (
                  <div className="space-y-2">
                    {searchResults.map((user) => (
                      <div
                        key={user.userId}
                        onClick={() => addToSelection(user)}
                        className="flex items-center space-x-3 p-3 border border-orange-200 rounded-lg hover:bg-orange-50 cursor-pointer transition-colors"
                      >
                        <ProfilePicture userName={user.userName} size="32" />
                        <div className="flex-1">
                          <div className="font-medium text-orange-900">{user.userName}</div>
                          <div className="text-sm text-orange-600">{user.userId}</div>
                        </div>
                        <Plus className="w-4 h-4 text-orange-600" />
                      </div>
                    ))}
                  </div>
                ) : userSearchTerm && !searchLoading ? (
                  <div className="text-center py-8 text-orange-600">
                    No users found matching "{userSearchTerm}"
                  </div>
                ) : null}
              </div>

              {/* Selected Users */}
              <div className="space-y-2 flex-1 overflow-hidden">
                <Label className="text-sm font-medium text-orange-900">
                  Selected Users ({selectedUsers.length})
                </Label>
                <div className="border border-orange-200 rounded-lg max-h-48 overflow-y-auto">
                  {selectedUsers.length === 0 ? (
                    <div className="text-center py-8 text-orange-600">
                      No users selected yet
                    </div>
                  ) : (
                    <div className="space-y-2 p-3">
                      {selectedUsers.map((user) => (
                        <div key={user.userId} className="flex items-center space-x-3 p-2 bg-orange-50 rounded-lg">
                          <ProfilePicture userName={user.userName} size="32" />
                          <div className="flex-1">
                            <div className="font-medium text-orange-900">{user.userName}</div>
                            <div className="text-sm text-orange-600">{user.userId}</div>
                          </div>
                          <Select
                            value={user.role}
                            onValueChange={(value) => updateSelectedUserRole(user.userId, value)}
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="viewer">Viewer</SelectItem>
                              <SelectItem value="editor">Editor</SelectItem>
                              <SelectItem value="admin">Admin</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFromSelection(user.userId)}
                            className="text-red-600 hover:text-red-800 hover:bg-red-50"
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

            <DialogFooter>
              <Button variant="outline" onClick={() => setAddUserDialog(false)}>
                Cancel
              </Button>
              <Button 
                onClick={addUsersToGroup}
                disabled={selectedUsers.length === 0}
                className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700"
              >
                Add {selectedUsers.length} User{selectedUsers.length !== 1 ? 's' : ''}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default UsersPage;