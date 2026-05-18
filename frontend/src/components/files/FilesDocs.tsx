import React, { useState, useEffect, useCallback } from 'react';
import { useStore } from '../../store/useStore';
import { api } from '../../utils/api';
import { 
  Folder, 
  File, 
  Upload, 
  Plus, 
  Search, 
  Download, 
  Trash2, 
  ChevronRight, 
  FileText, 
  Image as ImageIcon, 
  Film, 
  Archive,
  Grid,
  List as ListIcon
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { format } from 'date-fns';

export const FilesDocs: React.FC = () => {
  const { project } = useStore();
  const [items, setItems] = useState<{ files: any[], folders: any[] }>({ files: [], folders: [] });
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [folderPath, setFolderPath] = useState<{id: string | null, name: string}[]>([{id: null, name: 'Root'}]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  // Modals
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showNewFolderModal, setShowNewFolderModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [uploading, setUploading] = useState(false);
  
  const getFileUrl = (url: string) => {
    if (!url) return '#';
    if (url.startsWith('http')) return url;
    const baseUrl = ((import.meta as any).env?.VITE_API_URL as string || 'http://localhost:5000/api').replace('/api', '');
    return `${baseUrl}${url}`;
  };
  
  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.get(`/files/${project.id}?folderId=${currentFolderId || 'null'}&search=${searchQuery}`);
      setItems(data);
    } catch (err) {
      console.error('Failed to fetch files:', err);
    } finally {
      setLoading(false);
    }
  }, [project.id, currentFolderId, searchQuery]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;
    try {
      await api.post(`/files/${project.id}/folders`, {
        name: newFolderName,
        parentId: currentFolderId
      });
      setNewFolderName('');
      setShowNewFolderModal(false);
      fetchItems();
    } catch (err) {
      console.error('Failed to create folder:', err);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    
    setUploading(true);
    const formData = new FormData();
    Array.from(e.target.files).forEach(file => {
      formData.append('files', file);
    });
    formData.append('folderId', currentFolderId || 'null');

    try {
      await api.post(`/files/${project.id}/upload`, formData);
      setShowUploadModal(false);
      fetchItems();
    } catch (err) {
      console.error('Upload failed:', err);
    } finally {
      setUploading(false);
    }
  };

  const deleteFile = async (fileId: string) => {
    if (!window.confirm('Are you sure you want to delete this file?')) return;
    try {
      await api.delete(`/files/${project.id}/files/${fileId}`);
      fetchItems();
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  const deleteFolder = async (folderId: string) => {
    if (!window.confirm('Delete folder and all its contents?')) return;
    try {
      await api.delete(`/files/${project.id}/folders/${folderId}`);
      fetchItems();
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  const enterFolder = (folder: any) => {
    setCurrentFolderId(folder._id);
    setFolderPath([...folderPath, { id: folder._id, name: folder.name }]);
  };

  const navigateBack = (index: number) => {
    const newPath = folderPath.slice(0, index + 1);
    setFolderPath(newPath);
    setCurrentFolderId(newPath[newPath.length - 1].id);
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return <ImageIcon size={24} className="text-blue-500" />;
    if (mimeType.startsWith('video/')) return <Film size={24} className="text-purple-500" />;
    if (mimeType.includes('pdf')) return <FileText size={24} className="text-red-500" />;
    if (mimeType.includes('zip') || mimeType.includes('compressed')) return <Archive size={24} className="text-amber-500" />;
    return <File size={24} className="text-gray-400" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* Header & Breadcrumbs */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm">
          {folderPath.map((crumb, i) => (
            <React.Fragment key={i}>
              <button 
                onClick={() => navigateBack(i)}
                className={`hover:text-indigo-600 transition-colors font-medium ${i === folderPath.length - 1 ? 'text-gray-900 dark:text-white' : 'text-gray-500'}`}
              >
                {crumb.name}
              </button>
              {i < folderPath.length - 1 && <ChevronRight size={14} className="text-gray-400" />}
            </React.Fragment>
          ))}
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
            <button 
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-md ${viewMode === 'grid' ? 'bg-white dark:bg-gray-700 shadow-sm text-indigo-600' : 'text-gray-500'}`}
            >
              <Grid size={16} />
            </button>
            <button 
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-md ${viewMode === 'list' ? 'bg-white dark:bg-gray-700 shadow-sm text-indigo-600' : 'text-gray-500'}`}
            >
              <ListIcon size={16} />
            </button>
          </div>
          <Button variant="outline" size="sm" icon={<Plus size={16} />} onClick={() => setShowNewFolderModal(true)}>New Folder</Button>
          <Button variant="primary" size="sm" icon={<Upload size={16} />} onClick={() => setShowUploadModal(true)}>Upload</Button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input 
            type="text"
            placeholder="Search files and docs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto min-h-0 bg-white dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-700 p-6 shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        ) : (items.files.length === 0 && items.folders.length === 0) ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-3">
            <Folder size={48} strokeWidth={1} />
            <p className="text-sm font-medium">This folder is empty</p>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
            {/* Folders */}
            {items.folders.map(folder => (
              <div 
                key={folder._id} 
                onDoubleClick={() => enterFolder(folder)}
                className="group relative flex flex-col items-center p-4 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-all cursor-pointer border border-transparent hover:border-gray-100 dark:hover:border-gray-700"
              >
                <Folder size={48} className="text-indigo-400 fill-indigo-50 mb-2 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 text-center truncate w-full">{folder.name}</span>
                <button 
                  onClick={(e) => { e.stopPropagation(); deleteFolder(folder._id); }}
                  className="absolute top-2 right-2 p-1 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
            
            {/* Files */}
            {items.files.map(file => (
              <div 
                key={file._id}
                className="group relative flex flex-col items-center p-4 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-all cursor-pointer border border-transparent hover:border-gray-100 dark:hover:border-gray-700"
              >
                <div className="h-12 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                  {getFileIcon(file.mimeType)}
                </div>
                <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 text-center truncate w-full" title={file.name}>{file.name}</span>
                <span className="text-[10px] text-gray-400 mt-1">{formatFileSize(file.size)}</span>
                
                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <a href={getFileUrl(file.url)} target="_blank" rel="noopener noreferrer" className="p-1 text-gray-400 hover:text-indigo-500" title="Download">
                    <Download size={14} />
                  </a>
                  <button onClick={() => deleteFile(file._id)} className="p-1 text-gray-400 hover:text-red-500" title="Delete">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* List View */
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-700">
                  <th className="py-3 px-2 font-bold text-gray-400 uppercase text-[10px]">Name</th>
                  <th className="py-3 px-2 font-bold text-gray-400 uppercase text-[10px]">Size</th>
                  <th className="py-3 px-2 font-bold text-gray-400 uppercase text-[10px]">Uploaded By</th>
                  <th className="py-3 px-2 font-bold text-gray-400 uppercase text-[10px]">Date</th>
                  <th className="py-3 px-2"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-700/50">
                {items.folders.map(folder => (
                  <tr key={folder._id} onDoubleClick={() => enterFolder(folder)} className="hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer group">
                    <td className="py-3 px-2 flex items-center gap-3">
                      <Folder size={18} className="text-indigo-400 fill-indigo-50" />
                      <span className="font-semibold text-gray-700 dark:text-gray-300">{folder.name}</span>
                    </td>
                    <td className="py-3 px-2 text-gray-400">—</td>
                    <td className="py-3 px-2 text-gray-400">—</td>
                    <td className="py-3 px-2 text-gray-400">{format(new Date(folder.createdAt), 'MMM d, yyyy')}</td>
                    <td className="py-3 px-2 text-right">
                      <button onClick={() => deleteFolder(folder._id)} className="p-1 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
                {items.files.map(file => (
                  <tr key={file._id} className="hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer group">
                    <td className="py-3 px-2 flex items-center gap-3">
                      <div className="w-4.5 flex justify-center">{getFileIcon(file.mimeType)}</div>
                      <span className="font-semibold text-gray-700 dark:text-gray-300">{file.name}</span>
                    </td>
                    <td className="py-3 px-2 text-gray-500">{formatFileSize(file.size)}</td>
                    <td className="py-3 px-2">
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center text-[10px] text-indigo-600 font-bold">
                          {file.uploadedBy?.name?.charAt(0) || 'U'}
                        </div>
                        <span className="text-xs text-gray-600 dark:text-gray-400">{file.uploadedBy?.name || 'Unknown'}</span>
                      </div>
                    </td>
                    <td className="py-3 px-2 text-gray-400">{format(new Date(file.createdAt), 'MMM d, yyyy')}</td>
                    <td className="py-3 px-2 text-right flex justify-end gap-2">
                       <a href={getFileUrl(file.url)} target="_blank" rel="noopener noreferrer" className="p-1 text-gray-400 hover:text-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Download size={16} />
                      </a>
                      <button onClick={() => deleteFile(file._id)} className="p-1 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* New Folder Modal */}
      <Modal isOpen={showNewFolderModal} onClose={() => setShowNewFolderModal(false)} title="Create New Folder">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Folder Name</label>
            <input 
              type="text"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Enter folder name..."
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && handleCreateFolder()}
            />
          </div>
          <div className="flex gap-3 pt-2">
            <Button variant="outline" className="flex-1" onClick={() => setShowNewFolderModal(false)}>Cancel</Button>
            <Button variant="primary" className="flex-1" onClick={handleCreateFolder}>Create Folder</Button>
          </div>
        </div>
      </Modal>

      {/* Upload Modal */}
      <Modal isOpen={showUploadModal} onClose={() => setShowUploadModal(false)} title="Upload Files">
        <div className="space-y-6">
          <div 
            className="border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-2xl p-12 flex flex-col items-center justify-center gap-3 bg-gray-50/50 dark:bg-gray-900/20 hover:border-indigo-400 transition-colors cursor-pointer relative"
            onClick={() => document.getElementById('file-upload-input')?.click()}
          >
            <Upload size={40} className="text-gray-400" />
            <div className="text-center">
              <p className="text-sm font-bold text-gray-700 dark:text-gray-300">Click or drag files to upload</p>
              <p className="text-xs text-gray-400 mt-1">Maximum file size: 50MB</p>
            </div>
            <input 
              id="file-upload-input"
              type="file" 
              multiple 
              className="hidden" 
              onChange={handleFileUpload}
            />
            {uploading && (
              <div className="absolute inset-0 bg-white/80 dark:bg-gray-800/80 rounded-2xl flex flex-col items-center justify-center gap-3 z-10">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                <p className="text-sm font-bold text-indigo-600">Uploading...</p>
              </div>
            )}
          </div>
          <Button variant="outline" className="w-full" onClick={() => setShowUploadModal(false)}>Close</Button>
        </div>
      </Modal>
    </div>
  );
};
