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
  X,
  Pin,
  PinOff
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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

  // Fetch files using the backend API
  const fetchFiles = async (searchQuery = '') => {
    try {
      const backendUrl = process.env.NEXT_PUBLIC_API_BACKEND_URL || 'http://localhost:8000';
      
      // Use the correct endpoint with query parameter
      const url = `${backendUrl}/file/${groupId}?name=${encodeURIComponent(searchQuery)}`;
      
      const response = await fetch(url, {
        headers: {
          'x-api-key': process.env.NEXT_PUBLIC_FILE_API_KEY || '',
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
        
        // Sort files: pinned files first, then by upload date (newest first)
        mappedFiles.sort((a, b) => {
          if (a.pinned && !b.pinned) return -1;
          if (!a.pinned && b.pinned) return 1;
          return new Date(b.uploadDate) - new Date(a.uploadDate);
        });
        
        setFiles(mappedFiles);
      } else {
        console.error('Failed to fetch files');
        setFiles([]);
      }
    } catch (error) {
      console.error('Error fetching files:', error);
      setFiles([]);
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    if (groupId) {
      setLoading(true);
      fetchFiles('');
    }
  }, [groupId]);

  // Debounced search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (groupId) {
        fetchFiles(searchTerm);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchTerm, groupId]);

  // Filter files based on search term (client-side filtering as backup)
  const filteredFiles = files.filter(file =>
    file.fileName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    file.uploadedBy.toLowerCase().includes(searchTerm.toLowerCase()) ||
    file.fileType.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Get file type display info
  const getFileTypeDisplay = (type) => {
    switch (type.toLowerCase()) {
      case 'document':
        return {
          icon: FileText,
          bgColor: 'bg-gradient-to-r from-blue-400/80 to-blue-600/80 backdrop-blur-sm',
          textColor: 'text-blue-100'
        };
      case 'picture':
        return {
          icon: Image,
          bgColor: 'bg-gradient-to-r from-green-400/80 to-green-600/80 backdrop-blur-sm',
          textColor: 'text-green-100'
        };
      case 'video':
        return {
          icon: Video,
          bgColor: 'bg-gradient-to-r from-purple-400/80 to-purple-600/80 backdrop-blur-sm',
          textColor: 'text-purple-100'
        };
      case 'audio':
        return {
          icon: Music,
          bgColor: 'bg-gradient-to-r from-pink-400/80 to-pink-600/80 backdrop-blur-sm',
          textColor: 'text-pink-100'
        };
      default:
        return {
          icon: File,
          bgColor: 'bg-gradient-to-r from-gray-400/60 to-gray-600/60 backdrop-blur-sm',
          textColor: 'text-gray-100'
        };
    }
  };

  // Get file type from extension
  const getFileTypeFromExtension = (fileName) => {
    const extension = fileName.split('.').pop()?.toLowerCase() || '';
    
    if (['pdf', 'doc', 'docx', 'txt'].includes(extension)) return 'document';
    if (['jpg', 'jpeg', 'png', 'gif', 'bmp'].includes(extension)) return 'picture';
    if (['mp4', 'avi', 'mov', 'wmv'].includes(extension)) return 'video';
    if (['mp3', 'wav', 'flac', 'aac'].includes(extension)) return 'audio';
    return 'others';
  };

  // Handle file selection for upload
  const handleFileSelect = (event) => {
    const newFiles = Array.from(event.target.files || []);
    setSelectedFiles(prev => [...prev, ...newFiles]);
    // Reset the input value to allow selecting the same file again
    event.target.value = '';
  };

  // Remove file from selection
  const removeSelectedFile = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
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
        formData.append('userId', currentUserId || '');
        formData.append('groupId', groupId || '');

        const response = await fetch(`${backendUrl}/file/upload`, {
          method: 'POST',
          headers: {
            'x-api-key': process.env.NEXT_PUBLIC_FILE_API_KEY || '',
          },
          body: formData
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }));
          throw new Error(`Failed to upload ${file.name}: ${errorData.detail}`);
        }

        return await response.json();
      });

      await Promise.all(uploadPromises);

      // Refresh files list after successful upload
      await fetchFiles(searchTerm);

      setSelectedFiles([]);
      setUploadDialog(false);

    } catch (error) {
      console.error('Error uploading files:', error);
      alert('Failed to upload one or more files. Please try again.');
    } finally {
      setUploading(false);
    }
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
        },
        body: JSON.stringify({
          fileId: fileId,
          userId: currentUserId || ''
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
        const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }));
        console.error('Failed to download file:', errorData.detail);
        alert('Failed to download file. Please try again.');
      }
    } catch (error) {
      console.error('Error downloading file:', error);
      alert('Failed to download file. Please try again.');
    }
  };

  // Delete file function
  const deleteFile = async (fileId, fileName) => {
    if (!window.confirm(`Are you sure you want to delete "${fileName}"? This action cannot be undone.`)) {
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
          userId: currentUserId || ''
        })
      });

      if (response.ok) {
        // Refresh files list after successful deletion
        await fetchFiles(searchTerm);
        alert(`"${fileName}" has been deleted successfully`);
      } else {
        const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }));
        console.error('Failed to delete file:', errorData.detail);
        alert('Failed to delete file. You may not have permission to delete this file.');
      }
    } catch (error) {
      console.error('Error deleting file:', error);
      alert('Failed to delete file. Please try again.');
    }
  };

  // Pin/Unpin file function
  const togglePinFile = async (fileId, fileName, currentPinStatus) => {
    try {
      const backendUrl = process.env.NEXT_PUBLIC_API_BACKEND_URL || 'http://localhost:8000';
      
      const response = await fetch(`${backendUrl}/file/pin`, {
        method: 'PUT',
        headers: {
          'x-api-key': process.env.NEXT_PUBLIC_FILE_API_KEY || '',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileId: fileId,
          userId: localStorage.getItem('userId') || ''
        })
      });

      if (response.ok) {
        // Update the file in the local state
        setFiles(prevFiles => prevFiles.map(file => 
          file.id === fileId 
            ? { ...file, pinned: !currentPinStatus }
            : file
        ));
        
        const action = currentPinStatus ? 'unpinned' : 'pinned';
        alert(`"${fileName}" has been ${action} successfully`);
      } else {
        const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }));
        console.error('Failed to toggle pin status:', errorData.detail);
        alert('Failed to update pin status. Please try again.');
      }
    } catch (error) {
      console.error('Error toggling pin status:', error);
      alert('Failed to update pin status. Please try again.');
    }
  };

  // Handle file input click
  const handleFileInputClick = () => {
    const fileInput = document.querySelector('input[type="file"]');
    if (fileInput) {
      fileInput.click();
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
            {/* Left Section: Icon + Text */}
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-400/90 to-orange-600/90 backdrop-blur-sm rounded-xl flex items-center justify-center shadow-lg">
                <File className="w-7 h-7 text-white drop-shadow-sm" />
              </div>
              <div className="flex flex-col">
                <h2 className="text-xl font-bold text-orange-900">Group Files</h2>
                <p className="text-sm text-orange-600/80">
                  {filteredFiles.length} file{filteredFiles.length !== 1 ? 's' : ''}
                  {searchTerm && ` matching "${searchTerm}"`}
                </p>
              </div>
            </div>

            {/* Right Section: Search Bar */}
            <div className="flex-1 max-w-md ml-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-orange-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search files..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full rounded-md border border-orange-300 bg-white text-sm focus:border-orange-500 focus:ring-2 focus:ring-orange-500 focus:ring-opacity-20 focus:outline-none transition-colors"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Files Table with Aligned Columns and Scrollable Body */}
        <div className="bg-white rounded-xl shadow-lg border border-orange-200 overflow-hidden">
          {/* Table Header - Fixed */}
          <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
            <div className="overflow-x-auto">
              <table className="w-full table-fixed">
                <thead>
                  <tr>
                    <th className="w-2/5 px-6 py-4 text-left text-sm font-semibold whitespace-nowrap">File</th>
                    <th className="w-1/6 px-6 py-4 text-left text-sm font-semibold hidden sm:table-cell whitespace-nowrap">Type</th>
                    <th className="w-1/6 px-6 py-4 text-left text-sm font-semibold hidden md:table-cell whitespace-nowrap">Size</th>
                    <th className="w-1/6 px-6 py-4 text-left text-sm font-semibold hidden lg:table-cell whitespace-nowrap">Date</th>
                    <th className="w-1/6 px-6 py-4 text-center text-sm font-semibold whitespace-nowrap">Actions</th>
                  </tr>
                </thead>
              </table>
            </div>
          </div>

          {/* Scrollable Table Body with Custom Scrollbar */}
          <div 
            className="max-h-[500px] overflow-y-auto overflow-x-auto scrollbar-thin scrollbar-thumb-orange-300 scrollbar-track-orange-50 hover:scrollbar-thumb-orange-400"
            style={{
              scrollbarWidth: 'thin',
              scrollbarColor: '#fdba74 #fef3c7'
            }}
          >
            <table className="w-full table-fixed">
              <tbody className="divide-y divide-orange-100 bg-white">
                {filteredFiles.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-12 text-center text-orange-600">
                      <div className="flex flex-col items-center space-y-3">
                        <File className="w-12 h-12 text-orange-300" />
                        <div>
                          {searchTerm ? 'No files found matching your search.' : 'No files uploaded yet.'}
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredFiles.map((file) => {
                    const typeDisplay = getFileTypeDisplay(file.fileType);
                    const TypeIcon = typeDisplay.icon;
                    const isLongFileName = file.fileName.length > 20;
                    
                    return (
                      <tr key={file.id} className="hover:bg-orange-50/80 transition-colors duration-200">
                        {/* File Column - Fixed width w-2/5 */}
                        <td className="w-2/5 px-6 py-4">
                          <div className="flex items-center space-x-3">
                            <div className="flex-shrink-0 relative">
                              <div className={`w-10 h-10 rounded-lg ${typeDisplay.bgColor} flex items-center justify-center shadow-md`}>
                                <TypeIcon className="w-5 h-5 text-white" />
                              </div>
                              {file.pinned && (
                                <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full flex items-center justify-center">
                                  <Pin className="w-3 h-3 text-yellow-800" />
                                </div>
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="font-semibold text-orange-900 flex items-center space-x-2">
                                {isLongFileName ? (
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <span className="truncate cursor-help block">
                                        {file.fileName}
                                      </span>
                                    </TooltipTrigger>
                                    <TooltipContent className="bg-white text-orange-900 border border-orange-200 shadow-lg">
                                      <p className="max-w-xs break-words">{file.fileName}</p>
                                    </TooltipContent>
                                  </Tooltip>
                                ) : (
                                  <span className="truncate block">{file.fileName}</span>
                                )}
                                {file.pinned && (
                                  <span className="text-xs px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full font-medium whitespace-nowrap">
                                    Pinned
                                  </span>
                                )}
                              </div>
                              {/* Show type and size on mobile and tablet */}
                              <div className="text-sm text-orange-600 sm:hidden truncate">
                                {file.fileType} • {file.fileSize}
                              </div>
                              <div className="text-sm text-orange-600 md:hidden sm:block hidden truncate">
                                {file.fileSize}
                              </div>
                              <div className="text-xs text-orange-500 lg:hidden truncate">
                                {file.uploadedBy} • {file.uploadDate}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Type Column - Fixed width w-1/6, hidden on mobile */}
                        <td className="w-1/6 px-6 py-4 hidden sm:table-cell">
                          <div className={`inline-flex items-center space-x-2 px-3 py-1.5 rounded-full ${typeDisplay.bgColor} shadow-md whitespace-nowrap`}>
                            <TypeIcon className="w-4 h-4 text-white" />
                            <span className="text-white font-semibold text-sm capitalize">
                              {file.fileType}
                            </span>
                          </div>
                        </td>

                        {/* Size Column - Fixed width w-1/6, hidden on mobile and small tablet */}
                        <td className="w-1/6 px-6 py-4 text-orange-700 hidden md:table-cell">
                          <div className="truncate font-medium">{file.fileSize}</div>
                        </td>

                        {/* Date Column - Fixed width w-1/6, hidden on medium and smaller */}
                        <td className="w-1/6 px-6 py-4 text-orange-700 hidden lg:table-cell">
                          <div className="truncate">
                            <div className="font-medium">{file.uploadDate}</div>
                            <div className="text-xs text-orange-500 truncate">{file.uploadedBy}</div>
                          </div>
                        </td>

                        {/* Actions Column - Fixed width w-1/6 */}
                        <td className="w-1/6 px-6 py-4">
                          <div className="flex items-center justify-center space-x-1">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => togglePinFile(file.id, file.fileName, file.pinned)}
                                  className={`${file.pinned 
                                    ? 'text-yellow-600 hover:text-yellow-800 hover:bg-yellow-50' 
                                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                                  } transition-colors duration-200 p-2`}
                                >
                                  {file.pinned ? <PinOff className="w-4 h-4" /> : <Pin className="w-4 h-4" />}
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent className="bg-white text-orange-900 border border-orange-200 shadow-lg">
                                <p>{file.pinned ? 'Unpin file' : 'Pin file'}</p>
                              </TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => downloadFile(file.id, file.fileName)}
                                  className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 transition-colors duration-200 p-2"
                                >
                                  <Download className="w-4 h-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent className="bg-white text-orange-900 border border-orange-200 shadow-lg">
                                <p>Download file</p>
                              </TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => deleteFile(file.id, file.fileName)}
                                  className="text-red-600 hover:text-red-800 hover:bg-red-50 transition-colors duration-200 p-2"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent className="bg-white text-orange-900 border border-orange-200 shadow-lg">
                                <p>Delete file</p>
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
          {filteredFiles.length > 8 && (
            <div className="bg-gradient-to-r from-orange-100/50 to-orange-200/50 px-4 py-2 text-center text-xs text-orange-600">
              <div className="flex items-center justify-center space-x-2">
                <div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse"></div>
                <span>Scroll to see more files</span>
                <div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse"></div>
              </div>
            </div>
          )}
        </div>

        {/* Upload File Button */}
        <div className="fixed bottom-6 right-6">
          <Dialog open={uploadDialog} onOpenChange={setUploadDialog}>
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
                <DialogTitle className="text-xl font-bold text-orange-900">Upload Files</DialogTitle>
                <DialogDescription className="text-orange-600/80">
                  Select files to upload to this group. Multiple files can be selected.
                </DialogDescription>
              </DialogHeader>
              
              <div className="flex-1 overflow-hidden flex flex-col space-y-6 py-4">
                {/* File Input */}
                <div className="relative">
                  <div className="border-2 border-dashed border-orange-300/50 rounded-xl p-8 text-center hover:border-orange-400/60 transition-all duration-300 backdrop-blur-sm bg-white/40 hover:bg-white/60">
                    <Upload className="w-12 h-12 text-orange-400/70 mx-auto mb-3" />
                    <p className="text-orange-700 mb-3 font-medium">Click to select files or drag and drop</p>
                    <Input
                      type="file"
                      multiple
                      onChange={handleFileSelect}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                      accept="*/*"
                    />
                    <Button
                      variant="outline"
                      className="backdrop-blur-sm bg-white/60 border-orange-300/50 text-orange-700 hover:bg-white/80 hover:border-orange-400/60"
                      onClick={handleFileInputClick}
                      type="button"
                    >
                      Browse Files
                    </Button>
                  </div>
                </div>

                {/* Selected Files */}
                <div className="space-y-3 flex-1 overflow-hidden">
                  <Label className="text-sm font-semibold text-orange-900">
                    Selected Files ({selectedFiles.length})
                  </Label>
                  <div className="border border-orange-200/50 rounded-xl max-h-48 overflow-y-auto backdrop-blur-sm bg-white/30 scrollbar-thin scrollbar-thumb-orange-300 scrollbar-track-orange-50">
                    {selectedFiles.length === 0 ? (
                      <div className="text-center py-12 text-orange-600/70">
                        <Upload className="w-12 h-12 text-orange-300/50 mx-auto mb-3" />
                        <div>No files selected yet</div>
                      </div>
                    ) : (
                      <div className="space-y-2 p-3">
                        {selectedFiles.map((file, index) => {
                          const typeDisplay = getFileTypeDisplay(getFileTypeFromExtension(file.name));
                          const TypeIcon = typeDisplay.icon;
                          
                          return (
                            <div key={index} className="flex items-center space-x-3 p-3 bg-orange-50/60 backdrop-blur-sm rounded-xl border border-white/40">
                              <div className="flex-shrink-0">
                                <div className={`w-8 h-8 rounded-lg ${typeDisplay.bgColor} flex items-center justify-center`}>
                                  <TypeIcon className="w-4 h-4 text-white" />
                                </div>
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="font-semibold text-orange-900 truncate text-sm">{file.name}</div>
                                <div className="text-xs text-orange-600/70 truncate">
                                  {formatFileSize(file.size)} • {getFileTypeFromExtension(file.name)}
                                </div>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeSelectedFile(index)}
                                className="text-red-500 hover:text-red-700 hover:bg-red-50/60 p-2 flex-shrink-0 rounded-lg transition-all duration-200"
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

              <DialogFooter className="border-t border-orange-100/50 pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setUploadDialog(false);
                    setSelectedFiles([]);
                  }}
                  className="border-orange-300/50 text-orange-700 hover:bg-orange-50/60"
                  disabled={uploading}
                >
                  Cancel
                </Button>
                <Button
                  onClick={uploadFiles}
                  disabled={selectedFiles.length === 0 || uploading}
                  className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white"
                >
                  {uploading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      Upload {selectedFiles.length} file{selectedFiles.length !== 1 ? 's' : ''}
                    </>
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </TooltipProvider>
  );
};

export default FilePage;