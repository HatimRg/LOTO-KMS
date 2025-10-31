import React, { useState, useEffect } from 'react';
import { User, Linkedin, Mail, FileText, Upload, Save, Edit2, X, Download, Eye } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useToast } from '../context/ToastContext';
import { APP_CONFIG } from '../utils/constants';
import db from '../utils/database';

const { ipcRenderer } = window;

function AboutMe() {
  const { userMode } = useApp();
  const { showToast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [profileData, setProfileData] = useState({
    name: APP_CONFIG.author,
    title: 'Full Stack Developer',
    bio: 'Developer of LOTO Key Management System - A comprehensive solution for electrical lockout/tagout procedures and key management.',
    email: APP_CONFIG.email,
    linkedin: APP_CONFIG.linkedIn,
    profilePicture: null,
    cvFiles: [] // Array of {path, displayName}
  });
  const [newCVName, setNewCVName] = useState('');

  useEffect(() => {
    loadProfileData();
  }, []);

  const loadProfileData = async () => {
    try {
      if (ipcRenderer) {
        const result = await ipcRenderer.invoke('db-query', 'SELECT * FROM profile_settings LIMIT 1', []);
        if (result && result.length > 0) {
          const data = result[0];
          // Parse cvFiles from JSON string
          if (data.cvFiles && typeof data.cvFiles === 'string') {
            try {
              data.cvFiles = JSON.parse(data.cvFiles);
            } catch (e) {
              console.error('Error parsing cvFiles:', e);
              data.cvFiles = [];
            }
          } else if (!data.cvFiles) {
            data.cvFiles = [];
          }
          
          console.log('Loaded profile data:', data);
          setProfileData(prev => ({ ...prev, ...data }));
        } else {
          console.log('No profile data found in database');
        }
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

  const saveToDatabase = async (data) => {
    try {
      if (ipcRenderer) {
        // Use db.run for INSERT/REPLACE operations
        await ipcRenderer.invoke('db-run', `
          INSERT OR REPLACE INTO profile_settings (id, name, title, bio, email, linkedin, profilePicture, cvFiles, updated_at)
          VALUES (1, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        `, [
          data.name,
          data.title,
          data.bio,
          data.email,
          data.linkedin,
          data.profilePicture,
          JSON.stringify(data.cvFiles || [])
        ]);
        return true;
      }
    } catch (error) {
      console.error('Error saving to database:', error);
      return false;
    }
  };

  const handleSave = async () => {
    try {
      const success = await saveToDatabase(profileData);
      if (success) {
        showToast('Profile updated successfully', 'success');
        setIsEditing(false);
      } else {
        showToast('Failed to save profile', 'error');
      }
    } catch (error) {
      showToast(`Failed to save profile: ${error.message}`, 'error');
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      showToast('Please select an image file', 'error');
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      showToast('Image must be less than 2MB', 'error');
      return;
    }

    setUploading(true);
    try {
      // Read file as base64
      const reader = new FileReader();
      reader.onload = async (event) => {
        const fileData = event.target.result;
        
        if (ipcRenderer) {
          // Save via Electron IPC (local storage)
          const fileName = `profile_${Date.now()}_${file.name}`;
          const saveResult = await ipcRenderer.invoke('save-file', {
            fileName: fileName,
            fileData: fileData,
            type: 'profile'
          });

          if (saveResult.success) {
            setProfileData(prev => ({ ...prev, profilePicture: saveResult.filePath }));
            
            // Auto-save to database
            await saveToDatabase({
              ...profileData,
              profilePicture: saveResult.filePath
            });
            
            showToast('Profile picture uploaded', 'success');
          } else {
            showToast(`Upload failed: ${saveResult.error}`, 'error');
          }
        } else {
          // Browser mode: Use base64 data URL
          setProfileData(prev => ({ ...prev, profilePicture: fileData }));
          
          // Auto-save to database
          await saveToDatabase({
            ...profileData,
            profilePicture: fileData
          });
          
          showToast('Profile picture uploaded', 'success');
        }
        setUploading(false);
      };
      reader.onerror = () => {
        showToast('Error reading file', 'error');
        setUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      showToast(`Upload error: ${error.message}`, 'error');
      setUploading(false);
    }
  };

  const handleCVUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (file.type !== 'application/pdf') {
      showToast('Please select a PDF file', 'error');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      showToast('CV must be less than 5MB', 'error');
      return;
    }

    if (!newCVName.trim()) {
      showToast('Please enter a display name for the CV', 'error');
      return;
    }

    setUploading(true);
    try {
      // Read file as base64
      const reader = new FileReader();
      reader.onload = async (event) => {
        const fileData = event.target.result;
        
        if (ipcRenderer) {
          // Save via Electron IPC (local storage)
          const fileName = `cv_${Date.now()}_${file.name}`;
          const saveResult = await ipcRenderer.invoke('save-file', {
            fileName: fileName,
            fileData: fileData,
            type: 'cv'
          });

          if (saveResult.success) {
            const newCVFiles = [...profileData.cvFiles, { 
              path: saveResult.filePath, 
              displayName: newCVName.trim(),
              fileName: fileName 
            }];
            
            // Update state
            setProfileData(prev => ({
              ...prev,
              cvFiles: newCVFiles
            }));
            
            // Auto-save to database immediately
            await saveToDatabase({
              ...profileData,
              cvFiles: newCVFiles
            });
            
            setNewCVName('');
            showToast('CV uploaded successfully', 'success');
          } else {
            showToast(`Upload failed: ${saveResult.error}`, 'error');
          }
        } else {
          // Browser mode: Store base64 data
          const newCVFiles = [...profileData.cvFiles, { 
            path: fileData, 
            displayName: newCVName.trim(),
            fileName: file.name,
            isDataURL: true
          }];
          
          setProfileData(prev => ({
            ...prev,
            cvFiles: newCVFiles
          }));
          
          // Auto-save to database
          await saveToDatabase({
            ...profileData,
            cvFiles: newCVFiles
          });
          
          setNewCVName('');
          showToast('CV uploaded successfully', 'success');
        }
        setUploading(false);
      };
      reader.onerror = () => {
        showToast('Error reading file', 'error');
        setUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      showToast(`Upload error: ${error.message}`, 'error');
      setUploading(false);
    }
  };

  const handleRemoveCV = async (index) => {
    const cv = profileData.cvFiles[index];
    
    // Try to delete the physical file if it's a local file
    if (ipcRenderer && cv.fileName && !cv.isDataURL) {
      try {
        await ipcRenderer.invoke('delete-file', {
          fileName: cv.fileName,
          type: 'cv'
        });
      } catch (error) {
        console.warn('Could not delete file:', error);
      }
    }
    
    const newCVFiles = profileData.cvFiles.filter((_, i) => i !== index);
    
    setProfileData(prev => ({
      ...prev,
      cvFiles: newCVFiles
    }));
    
    // Auto-save to database immediately
    await saveToDatabase({
      ...profileData,
      cvFiles: newCVFiles
    });
    
    showToast('CV removed', 'success');
  };

  const handleViewCV = async (cv) => {
    if (ipcRenderer && cv.path && !cv.isDataURL) {
      // Open file using system default application
      try {
        const result = await ipcRenderer.invoke('open-file', cv.path);
        if (!result.success) {
          showToast(`Could not open file: ${result.error}`, 'error');
        }
      } catch (error) {
        showToast('Error opening file', 'error');
      }
    } else if (cv.isDataURL) {
      // Open data URL in new tab
      window.open(cv.path, '_blank');
    } else {
      // Fallback: try to open as link
      window.open(cv.path, '_blank');
    }
  };

  const handleDownloadCV = async (cv) => {
    if (ipcRenderer && cv.path && !cv.isDataURL) {
      // Use Electron's save dialog
      try {
        const result = await ipcRenderer.invoke('save-cv-copy', {
          sourcePath: cv.path,
          displayName: cv.displayName
        });
        if (result.success) {
          showToast('CV downloaded successfully', 'success');
        } else {
          showToast(`Download failed: ${result.error}`, 'error');
        }
      } catch (error) {
        showToast('Error downloading file', 'error');
      }
    } else {
      // Browser mode: Download data URL
      const link = document.createElement('a');
      link.href = cv.path;
      link.download = `${cv.displayName}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const isEditor = userMode === 'Editor';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center space-x-2">
          <User className="w-7 h-7 text-blue-600" />
          <span>About the Developer</span>
        </h1>
        {isEditor && !isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center space-x-2 transition-colors"
          >
            <Edit2 className="w-4 h-4" />
            <span>Edit Profile</span>
          </button>
        )}
      </div>

      {/* Profile Card */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="p-8">
          {/* Profile Picture and Basic Info */}
          <div className="flex flex-col md:flex-row items-center md:items-start space-y-4 md:space-y-0 md:space-x-6">
            {/* Profile Picture */}
            <div className="relative">
              <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white text-4xl font-bold overflow-hidden">
                {profileData.profilePicture ? (
                  <img
                    src={profileData.profilePicture}
                    alt={profileData.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  profileData.name.charAt(0)
                )}
              </div>
              {isEditor && isEditing && (
                <label className="absolute bottom-0 right-0 bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-full cursor-pointer transition-colors">
                  <Upload className="w-4 h-4" />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    disabled={uploading}
                  />
                </label>
              )}
            </div>

            {/* Name and Title */}
            <div className="flex-1 text-center md:text-left">
              {isEditing && isEditor ? (
                <div className="space-y-3">
                  <input
                    type="text"
                    value={profileData.name}
                    onChange={(e) => setProfileData(prev => ({ ...prev, name: e.target.value }))}
                    className="text-3xl font-bold bg-transparent border-b-2 border-blue-600 focus:outline-none text-gray-900 dark:text-white w-full"
                    placeholder="Name"
                  />
                  <input
                    type="text"
                    value={profileData.title}
                    onChange={(e) => setProfileData(prev => ({ ...prev, title: e.target.value }))}
                    className="text-xl bg-transparent border-b border-gray-300 dark:border-gray-600 focus:outline-none text-gray-600 dark:text-gray-300 w-full"
                    placeholder="Title"
                  />
                </div>
              ) : (
                <>
                  <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                    {profileData.name}
                  </h2>
                  <p className="text-xl text-gray-600 dark:text-gray-300">
                    {profileData.title}
                  </p>
                </>
              )}

              {/* Contact Links */}
              <div className="flex flex-col sm:flex-row items-center justify-center md:justify-start space-y-2 sm:space-y-0 sm:space-x-4 mt-4">
                <a
                  href={profileData.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                >
                  <Linkedin className="w-5 h-5" />
                  <span>LinkedIn Profile</span>
                </a>
                {isEditing && isEditor ? (
                  <div className="flex items-center space-x-2">
                    <Mail className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                    <input
                      type="email"
                      value={profileData.email}
                      onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))}
                      className="px-2 py-1 bg-transparent border-b border-gray-300 dark:border-gray-600 focus:outline-none text-gray-600 dark:text-gray-300"
                      placeholder="Email address"
                    />
                  </div>
                ) : (
                  profileData.email && (
                    <a
                      href={`mailto:${profileData.email}`}
                      className="flex items-center space-x-2 text-gray-600 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 transition-colors"
                    >
                      <Mail className="w-5 h-5" />
                      <span>{profileData.email}</span>
                    </a>
                  )
                )}
              </div>
            </div>
          </div>

          {/* Bio */}
          <div className="mt-8">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
              About
            </h3>
            {isEditing && isEditor ? (
              <textarea
                value={profileData.bio}
                onChange={(e) => setProfileData(prev => ({ ...prev, bio: e.target.value }))}
                rows="4"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
                placeholder="Write a bio..."
              />
            ) : (
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                {profileData.bio}
              </p>
            )}
          </div>

          {/* CV Files */}
          <div className="mt-8">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
              CV
            </h3>
            
            {/* Existing CV Files */}
            {profileData.cvFiles && profileData.cvFiles.length > 0 ? (
              <div className="space-y-3 mb-4">
                {profileData.cvFiles.map((cv, index) => (
                  <div key={index} className="flex items-center justify-between bg-gray-50 dark:bg-gray-700 p-4 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                      <FileText className="w-6 h-6 text-red-600 flex-shrink-0" />
                      <span className="text-gray-700 dark:text-gray-300 font-medium truncate">{cv.displayName}</span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">PDF</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleViewCV(cv)}
                        className="px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center space-x-2"
                        title="View CV"
                      >
                        <Eye className="w-4 h-4" />
                        <span className="hidden sm:inline">View</span>
                      </button>
                      <button
                        onClick={() => handleDownloadCV(cv)}
                        className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center space-x-2"
                        title="Download CV"
                      >
                        <Download className="w-4 h-4" />
                        <span className="hidden sm:inline">Download</span>
                      </button>
                      {isEditor && isEditing && (
                        <button
                          onClick={() => handleRemoveCV(index)}
                          className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                          title="Remove CV"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-gray-50 dark:bg-gray-700 p-6 rounded-lg text-center mb-4">
                <p className="text-gray-500 dark:text-gray-400">No CV files uploaded yet</p>
              </div>
            )}

            {/* Upload New CV - Editor Only */}
            {isEditor && isEditing && (
              <div className="bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-800 p-4 rounded-lg">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Upload New CV</h4>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Display Name
                    </label>
                    <input
                      type="text"
                      value={newCVName}
                      onChange={(e) => setNewCVName(e.target.value)}
                      placeholder="e.g., Resume 2024, Portfolio, etc."
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      PDF File
                    </label>
                    <label className="inline-flex items-center space-x-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg cursor-pointer transition-colors">
                      <Upload className="w-5 h-5" />
                      <span>{uploading ? 'Uploading...' : 'Select PDF File'}</span>
                      <input
                        type="file"
                        accept=".pdf"
                        onChange={handleCVUpload}
                        className="hidden"
                        disabled={uploading || !newCVName.trim()}
                      />
                    </label>
                    {!newCVName.trim() && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Please enter a display name first</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Edit Actions */}
          {isEditor && isEditing && (
            <div className="mt-8 flex items-center justify-end space-x-3">
              <button
                onClick={() => {
                  setIsEditing(false);
                  loadProfileData(); // Reset to saved data
                }}
                className="px-6 py-2 bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500 text-gray-900 dark:text-white rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={uploading}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg flex items-center space-x-2 transition-colors"
              >
                <Save className="w-4 h-4" />
                <span>{uploading ? 'Uploading...' : 'Save Changes'}</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Project Info */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          About LOTO KMS
        </h3>
        <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
          LOTO Key Management System is a comprehensive desktop application designed to manage electrical lockout/tagout procedures,
          key inventory, personnel tracking, and electrical plans. Built with modern web technologies and Electron, it provides
          both online and offline functionality with cloud synchronization capabilities.
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg text-center">
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{APP_CONFIG.version}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Version</p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg text-center">
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">React</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Framework</p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg text-center">
            <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">Electron</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Platform</p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg text-center">
            <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">SQLite</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Database</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AboutMe;
