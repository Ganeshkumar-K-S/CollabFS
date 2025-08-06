'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { 
  Search, 
  Plus, 
  Download, 
  Trash2, 
  FileText, 
  Image, 
  Video, 
  Music, 
  File,
  Upload,
  X
} from 'lucide-react';
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

const FilePage = () => {
  const pathname = usePathname();
  const groupId = pathname.split('/')[2]; // Assuming the group ID is in the URL

  const [files, setFiles] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [uploadDialog, setUploadDialog] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);

  // Fetch files using the backend API
  useEffect(() => {
    const fetchFiles = async () => {
      try {
        const backendUrl = process.env.NEXT_PUBLIC_API_BACKEND_URL || 'http://localhost:8000';
        
        const response = await fetch(`${backendUrl}/file/${groupId}`, {
          headers: {
            'x-api-key': process.env.NEXT_PUBLIC_GROUP_API_KEY || '',
            'Content-Type': 'application/json',
          }
        });

        if (response.ok) {
          const data = await response.json();
          // Map the backend response to frontend format
          const mappedFiles = data.map(file => ({
            id: file.file_id,
            fileName: file.name,
            fileType: getFileTypeFromContentType(file.contentType),
            fileSize: formatFileSize(file.size),
            uploadDate: new Date(file.uploadedAt).toLocaleDateString(),
            uploadedBy: file.uploadedBy,
            contentType: file.contentType,
            pinned: file.pinned
          }));
          setFiles(mappedFiles);
        } else {
          console.error('Failed to fetch files');
        }
      } catch (error) {
        console.error('Error fetching files:', error);
      } finally {
        setLoading(false);
      }
    };

    if (groupId) {
      fetchFiles();
    }
  }, [groupId]);

  // Search files using the backend API
  const searchFiles = async (searchQuery) => {
    if (!searchQuery.trim()) {
      // If search is empty, fetch all files
      const backendUrl = process.env.NEXT_PUBLIC_API_BACKEND_URL || 'http://localhost:8000';
      
      const response = await fetch(`${backendUrl}/file/${groupId}`, {
        headers: {
          'x-api-key': process.env.NEXT_PUBLIC_GROUP_API_KEY || '',
          'Content-Type': 'application/json',
        }
      });

      if (response.ok) {
        const data = await response.json();
        const mappedFiles = data.map(file => ({
          id: file.file_id,
          fileName: file.name,
          fileType: getFileTypeFromContentType(file.contentType),
          fileSize: formatFileSize(file.size),
          uploadDate: new Date(file.uploadedAt).toLocaleDateString(),
          uploadedBy: file.uploadedBy,
          contentType: file.contentType,
          pinned: file.pinned
        }));
        setFiles(mappedFiles);
      }
      return;
    }

    setSearchLoading(true);
    try {
      const backendUrl = process.env.NEXT_PUBLIC_API_BACKEND_URL || 'http://localhost:8000';
      
      const response = await fetch(`${backendUrl}/file/search/${encodeURIComponent(searchQuery)}`, {
        headers: {
          'x-api-key': process.env.NEXT_PUBLIC_GROUP_API_KEY || '',
          'Content-Type': 'application/json',
        }
      });

      if (response.ok) {
        const searchResults = await response.json();
        
        // Filter results by groupId since backend search doesn't filter by group
        const groupFilteredResults = searchResults.filter(result => {
          const matchingFile = files.find(file => file.id === result.file_id);
          return matchingFile !== undefined;
        });

        // Map to display format
        const mappedResults = groupFilteredResults.map(result => {
          const originalFile = files.find(file => file.id === result.file_id);
          return originalFile;
        }).filter(Boolean);

        setFiles(mappedResults);
      } else {
        console.error('Failed to search files');
      }
    } catch (error) {
      console.error('Error searching files:', error);
    } finally {
      setSearchLoading(false);
    }
  };

  // Debounced search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      searchFiles(searchTerm);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  // Get file type display info
  const getFileTypeDisplay = (type) => {
    switch (type.toLowerCase()) {
      case 'document':
        return {
          icon: FileText,
          bgColor: 'bg-gradient-to-r from-blue-400 to-blue-600',
          textColor: 'text-blue-800'
        };
      case 'picture':
        return {
          icon: Image,
          bgColor: 'bg-gradient-to-r from-green-400 to-green-600',
          textColor: 'text-green-800'
        };
      case 'video':
        return {
          icon: Video,
          bgColor: 'bg-gradient-to-r from-purple-400 to-purple-600',
          textColor: 'text-purple-800'
        };
      case 'audio':
        return {
          icon: Music,
          bgColor: 'bg-gradient-to-r from-pink-400 to-pink-600',
          textColor: 'text-pink-800'
        };
      default:
        return {
          icon: File,
          bgColor: 'bg-gradient-to-r from-gray-400 to-gray-600',
          textColor: 'text-gray-800'
        };
    }
  };

  // Filter files based on search term (local filtering as backup)
  const filteredFiles = files;

  // Handle file selection for upload
  const handleFileSelect = (event) => {
    const newFiles = Array.from(event.target.files);
    setSelectedFiles([...selectedFiles, ...newFiles]);
  };

  // Remove file from selection
  const removeSelectedFile = (index) => {
    setSelectedFiles(selectedFiles.filter((_, i) => i !== index));
  };

  // Upload files function
  const uploadFiles = async () => {
    if (selectedFiles.length === 0) return;

    setUploading(true);
    try {
      const backendUrl = process.env.NEXT_PUBLIC_API_BACKEND_URL || 'http://localhost:8000';
      const currentUserId = localStorage.getItem('userId');

      // Upload each file individually
      const uploadPromises = selectedFiles.map(async (file) => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('contentType', file.type || 'application/octet-stream');
        formData.append('userId', currentUserId);
        formData.append('groupId', groupId);

        const response = await fetch(`${backendUrl}/file/upload`, {
          method: 'POST',
          headers: {
            'x-api-key': process.env.NEXT_PUBLIC_FILE_API_KEY || '',
          },
          body: formData
        });

        if (!response.ok) {
          throw new Error(`Failed to upload ${file.name}`);
        }

        return await response.json();
      });

      await Promise.all(uploadPromises);

      // Refresh files list after successful upload
      const refreshResponse = await fetch(`${backendUrl}/file/${groupId}`, {
        headers: {
          'x-api-key': process.env.NEXT_PUBLIC_FILE_API_KEY || '',
          'Content-Type': 'application/json',
        }
      });

      if (refreshResponse.ok) {
        const data = await refreshResponse.json();
        const mappedFiles = data.map(file => ({
          id: file.file_id,
          fileName: file.name,
          fileType: getFileTypeFromContentType(file.contentType),
          fileSize: formatFileSize(file.size),
          uploadDate: new Date(file.uploadedAt).toLocaleDateString(),
          uploadedBy: file.uploadedBy,
          contentType: file.contentType,
          pinned: file.pinned
        }));
        setFiles(mappedFiles);
      }

      setSelectedFiles([]);
      setUploadDialog(false);

    } catch (error) {
      console.error('Error uploading files:', error);
      alert('Failed to upload one or more files. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  // Get file type from extension
  const getFileTypeFromExtension = (fileName) => {
    const extension = fileName.split('.').pop().toLowerCase();
    
    if (['pdf', 'doc', 'docx', 'txt'].includes(extension)) return 'document';
    if (['jpg', 'jpeg', 'png', 'gif', 'bmp'].includes(extension)) return 'picture';
    if (['mp4', 'avi', 'mov', 'wmv'].includes(extension)) return 'video';
    if (['mp3', 'wav', 'flac', 'aac'].includes(extension)) return 'audio';
    return 'others';
  };

  // Get file type from content type
  const getFileTypeFromContentType = (contentType) => {
    if (!contentType) return 'others';
    
    if (contentType.startsWith('image/')) return 'picture';
    if (contentType.startsWith('video/')) return 'video';
    if (contentType.startsWith('audio/')) return 'audio';
    if (contentType.includes('pdf') || contentType.includes('document') || contentType.includes('text')) return 'document';
    return 'others';
  };

  // Format file size
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Download file function
  const downloadFile = async (fileId, fileName) => {
    try {
      const backendUrl = process.env.NEXT_PUBLIC_API_BACKEND_URL || 'http://localhost:8000';
      const currentUserId = localStorage.getItem('userId');

      const response = await fetch(`${backendUrl}/file/download`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.NEXT_PUBLIC_FILE_API_KEY || '',
        },
        body: JSON.stringify({
          fileId: fileId,
          userId: currentUserId
        })
      });

      if (response.ok) {
        // Get the blob from response
        const blob = await response.blob();
        
        // Create download link
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        
        // Cleanup
        window.URL.revokeObjectURL(url);
        document.body.removeChild(link);
      } else {
        console.error('Failed to download file');
        alert('Failed to download file. Please try again.');
      }
    } catch (error) {
      console.error('Error downloading file:', error);
      alert('Failed to download file. Please try again.');
    }
  };

  // Delete file function
  const deleteFile = async (fileId) => {
    if (!confirm('Are you sure you want to delete this file? This action cannot be undone.')) {
      return;
    }

    try {
      const backendUrl = process.env.NEXT_PUBLIC_API_BACKEND_URL || 'http://localhost:8000';
      const currentUserId = localStorage.getItem('userId');

      const response = await fetch(`${backendUrl}/file/delete`, {
        method: 'DELETE',
        headers: {
          'x-api-key': process.env.NEXT_PUBLIC_FILE_API_KEY || '',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileId: fileId,
          userId: currentUserId
        })
      });

      if (response.ok) {
        // Remove file from local state
        setFiles(files.filter(file => file.id !== fileId));
      } else {
        const errorData = await response.json();
        console.error('Failed to delete file:', errorData.detail);
        alert('Failed to delete file. You may not have permission to delete this file.');
      }
    } catch (error) {
      console.error('Error deleting file:', error);
      alert('Failed to delete file. Please try again.');
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
              <File className="w-6 h-6 text-white" />
            </div>
            <div className="flex flex-col">
              <h2 className="text-lg font-semibold text-orange-900">Group Files</h2>
              <p className="text-sm text-orange-600">Manage files in this group</p>
            </div>
          </div>

          {/* Right Section: Search Bar */}
          <div className="relative max-w-md w-full sm:w-auto">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-orange-400 w-4 h-4" />
            <Input
              placeholder="Search files..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 border-orange-200 focus:ring-orange-500 focus:border-orange-500"
            />
          </div>
        </div>
      </div>

      {/* Files Table */}
      <div className="bg-white rounded-xl shadow-lg border border-orange-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold">File</th>
                <th className="px-6 py-4 text-left text-sm font-semibold hidden sm:table-cell">Type</th>
                <th className="px-6 py-4 text-left text-sm font-semibold hidden md:table-cell">Size</th>
                <th className="px-6 py-4 text-left text-sm font-semibold hidden lg:table-cell">Uploaded By</th>
                <th className="px-6 py-4 text-left text-sm font-semibold hidden lg:table-cell">Date</th>
                <th className="px-6 py-4 text-center text-sm font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-orange-100">
              {filteredFiles.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-orange-600">
                    {searchTerm ? 'No files found matching your search.' : 'No files uploaded yet.'}
                  </td>
                </tr>
              ) : (
                filteredFiles.map((file) => {
                  const typeDisplay = getFileTypeDisplay(file.fileType);
                  const TypeIcon = typeDisplay.icon;
                  
                  return (
                    <tr key={file.id} className="hover:bg-orange-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <div className={`w-10 h-10 rounded-lg ${typeDisplay.bgColor} flex items-center justify-center shadow-md`}>
                            <TypeIcon className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <div className="font-semibold text-orange-900">{file.fileName}</div>
                            <div className="text-sm text-orange-600 sm:hidden">
                              {file.fileType} • {file.fileSize}
                            </div>
                            <div className="text-xs text-orange-500 lg:hidden">
                              {file.uploadedBy} • {file.uploadDate}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-orange-700 hidden sm:table-cell capitalize">
                        {file.fileType}
                      </td>
                      <td className="px-6 py-4 text-orange-700 hidden md:table-cell">
                        {file.fileSize}
                      </td>
                      <td className="px-6 py-4 text-orange-700 hidden lg:table-cell">
                        {file.uploadedBy}
                      </td>
                      <td className="px-6 py-4 text-orange-700 hidden lg:table-cell">
                        {file.uploadDate}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => downloadFile(file.id, file.fileName)}
                            className="text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                            title="Download"
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteFile(file.id)}
                            className="text-red-600 hover:text-red-800 hover:bg-red-50"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Upload File Button */}
      <div className="fixed bottom-6 right-6">
        <Dialog open={uploadDialog} onOpenChange={setUploadDialog}>
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
              <DialogTitle>Upload Files</DialogTitle>
              <DialogDescription>
                Select files to upload to this group. Multiple files can be selected.
              </DialogDescription>
            </DialogHeader>
            
            <div className="flex-1 overflow-hidden flex flex-col space-y-4">
              {/* File Input */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-orange-900">Select Files</Label>
                <div className="border-2 border-dashed border-orange-300 rounded-lg p-6 text-center hover:border-orange-400 transition-colors">
                  <Upload className="w-8 h-8 text-orange-400 mx-auto mb-2" />
                  <p className="text-orange-600 mb-2">Click to select files or drag and drop</p>
                  <Input
                    type="file"
                    multiple
                    onChange={handleFileSelect}
                    className="opacity-0 absolute inset-0 cursor-pointer"
                  />
                  <Button
                    variant="outline"
                    className="border-orange-300 text-orange-600 hover:bg-orange-50"
                    onClick={() => document.querySelector('input[type="file"]').click()}
                  >
                    Browse Files
                  </Button>
                </div>
              </div>

              {/* Selected Files */}
              <div className="space-y-2 flex-1 overflow-hidden">
                <Label className="text-sm font-medium text-orange-900">
                  Selected Files ({selectedFiles.length})
                </Label>
                <div className="border border-orange-200 rounded-lg max-h-64 overflow-y-auto">
                  {selectedFiles.length === 0 ? (
                    <div className="text-center py-8 text-orange-600">
                      No files selected yet
                    </div>
                  ) : (
                    <div className="space-y-2 p-3">
                      {selectedFiles.map((file, index) => {
                        const typeDisplay = getFileTypeDisplay(getFileTypeFromExtension(file.name));
                        const TypeIcon = typeDisplay.icon;
                        
                        return (
                          <div key={index} className="flex items-center space-x-3 p-2 bg-orange-50 rounded-lg">
                            <div className={`w-8 h-8 rounded ${typeDisplay.bgColor} flex items-center justify-center`}>
                              <TypeIcon className="w-4 h-4 text-white" />
                            </div>
                            <div className="flex-1">
                              <div className="font-medium text-orange-900 truncate">{file.name}</div>
                              <div className="text-sm text-orange-600">
                                {formatFileSize(file.size)} • {getFileTypeFromExtension(file.name)}
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeSelectedFile(index)}
                              className="text-red-600 hover:text-red-800 hover:bg-red-50"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setUploadDialog(false)}>
                Cancel
              </Button>
              <Button 
                onClick={uploadFiles}
                disabled={selectedFiles.length === 0 || uploading}
                className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700"
              >
                {uploading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Uploading...
                  </>
                ) : (
                  `Upload ${selectedFiles.length} File${selectedFiles.length !== 1 ? 's' : ''}`
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default FilePage;