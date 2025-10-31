import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Save, RefreshCw, Trash2, AlertTriangle, Database, Download, FileText, Wrench, CheckCircle, HardDrive, Info, Edit2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { useToast } from '../context/ToastContext';
import Footer from '../components/Footer';
import { APP_CONFIG } from '../utils/constants';
import logger from '../utils/logger';
import { downloadTemplate, downloadActivityLog } from '../utils/downloadHelper';
import db from '../utils/database';

const { ipcRenderer } = window;

function Settings() {
  const navigate = useNavigate();
  const { config, loadConfig, userMode } = useApp();
  const { showToast } = useToast();
  const [formData, setFormData] = useState({
    ACCESS_CODE: '010203'
  });
  const [appInfo, setAppInfo] = useState({
    name: APP_CONFIG.name,
    version: APP_CONFIG.version
  });
  const [editingAppInfo, setEditingAppInfo] = useState(false);
  const [dbStats, setDbStats] = useState({
    breakers: 0,
    personnel: 0,
    locks: 0,
    plans: 0,
    activities: 0
  });
  const [showNukeModal, setShowNukeModal] = useState(false);
  const [nukeCode, setNukeCode] = useState('');
  const [nukeError, setNukeError] = useState('');
  const [saveMessage, setSaveMessage] = useState('');
  const [paths, setPaths] = useState(null);
  const [dependencies, setDependencies] = useState(null);
  const [logs, setLogs] = useState('');
  const [repairMessage, setRepairMessage] = useState('');

  useEffect(() => {
    if (config) {
      setFormData({ ACCESS_CODE: config.ACCESS_CODE || '010203' });
    }
    loadPaths();
    loadDependencies();
    loadLogs();
    loadDbStats();
  }, [config]);

  const loadDbStats = async () => {
    try {
      const [breakers, personnel, locks, plans, activities] = await Promise.all([
        db.getBreakers(),
        db.getPersonnel(),
        db.getLocks(),
        db.getPlans(),
        db.getHistory(1000) // Get total count
      ]);
      
      setDbStats({
        breakers: breakers.success ? breakers.data.length : 0,
        personnel: personnel.success ? personnel.data.length : 0,
        locks: locks.success ? locks.data.length : 0,
        plans: plans.success ? plans.data.length : 0,
        activities: activities.success ? activities.data.length : 0
      });
    } catch (error) {
      console.error('Error loading database stats:', error);
    }
  };

  const loadPaths = async () => {
    if (ipcRenderer) {
      const result = await ipcRenderer.invoke('get-paths');
      if (result.success) {
        setPaths(result.data);
      }
    }
  };

  const loadDependencies = async () => {
    if (ipcRenderer) {
      const result = await ipcRenderer.invoke('check-dependencies');
      if (result.success) {
        setDependencies(result.data);
      }
    }
  };

  const loadLogs = async () => {
    if (ipcRenderer) {
      const result = await ipcRenderer.invoke('read-logs', 50);
      if (result.success) {
        setLogs(result.data);
      }
    }
  };

  const handleDownloadTemplate = async (templateName) => {
    await logger.info('Download template', { template: templateName });
    
    const result = await downloadTemplate(templateName);
    if (result.success) {
      showToast(`Template "${templateName}" downloaded successfully`, 'success');
    } else {
      showToast(`Failed to download template: ${result.error}`, 'error');
    }
  };

  const handleDownloadLogs = async () => {
    await logger.info('Download logs requested');
    
    const result = await downloadActivityLog();
    if (result.success) {
      showToast('Activity log downloaded successfully', 'success');
    } else {
      showToast(`Failed to download logs: ${result.error}`, 'error');
    }
  };

  const handleRepairDatabase = async () => {
    if (window.confirm('This will check and repair database integrity. Continue?')) {
      if (ipcRenderer) {
        showToast('Checking database integrity...', 'info', 2000);
        await logger.info('Repair database', { userMode: 'Editor' });
        const result = await ipcRenderer.invoke('repair-database');
        if (result.success) {
          setRepairMessage(result.message);
          showToast(result.message, 'success');
          setTimeout(() => setRepairMessage(''), 5000);
        } else {
          setRepairMessage('Error: ' + result.error);
          showToast('Error: ' + result.error, 'error');
          setTimeout(() => setRepairMessage(''), 5000);
        }
      }
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    
    if (ipcRenderer) {
      const result = await ipcRenderer.invoke('save-config', formData);
      if (result.success) {
        setSaveMessage('Configuration saved successfully!');
        setTimeout(() => setSaveMessage(''), 3000);
        loadConfig();
      } else {
        setSaveMessage('Error saving configuration');
        setTimeout(() => setSaveMessage(''), 3000);
      }
    }
  };

  const handleNuke = async () => {
    const correctCode = config?.ACCESS_CODE || '010203';
    
    if (nukeCode !== correctCode) {
      setNukeError('Incorrect access code');
      return;
    }

    if (!window.confirm('⚠️ FINAL WARNING: This will permanently delete ALL data including breakers, locks, personnel, plans, and files. This action CANNOT be undone. Are you absolutely sure?')) {
      setShowNukeModal(false);
      setNukeCode('');
      return;
    }

    if (ipcRenderer) {
      const result = await ipcRenderer.invoke('nuke-database');
      if (result.success) {
        showToast('All data has been deleted successfully', 'success');
        setShowNukeModal(false);
        setNukeCode('');
        // Navigate to dashboard which will load fresh empty data
        navigate('/');
      } else {
        showToast('Error deleting data: ' + result.error, 'error');
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center space-x-2">
          <SettingsIcon className="w-7 h-7 text-gray-600 dark:text-gray-400" />
          <span>Settings</span>
        </h1>
      </div>

      {/* Access Code Configuration - Editor Only */}
      {userMode === 'Editor' && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center space-x-2 mb-4">
            <SettingsIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Security Settings</h2>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Configure the access code for Editor mode authentication.
          </p>
          
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Editor Access Code
              </label>
              <input
                type="password"
                value={formData.ACCESS_CODE}
                onChange={(e) => setFormData({...formData, ACCESS_CODE: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Change the access code for Editor mode login
              </p>
            </div>

            <div className="flex items-center space-x-3">
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center space-x-2 transition-colors"
              >
                <Save className="w-4 h-4" />
                <span>Save Configuration</span>
              </button>
              {saveMessage && (
                <span className={`text-sm ${saveMessage.includes('Error') ? 'text-red-600' : 'text-green-600'}`}>
                  {saveMessage}
                </span>
              )}
            </div>
          </form>
        </div>
      )}

      {/* System Information */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Info className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white">System Information</h2>
        </div>
        
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Application Info</h3>
          {userMode === 'Editor' && !editingAppInfo && (
            <button
              onClick={() => setEditingAppInfo(true)}
              className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-800 rounded-lg flex items-center space-x-2 text-sm transition-colors"
            >
              <Edit2 className="w-3 h-3" />
              <span>Edit</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">App Version</p>
            {editingAppInfo && userMode === 'Editor' ? (
              <input
                type="text"
                value={appInfo.version}
                onChange={(e) => setAppInfo({ ...appInfo, version: e.target.value })}
                className="w-full px-2 py-1 text-lg font-bold border border-blue-300 dark:border-blue-600 rounded focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              />
            ) : (
              <p className="text-lg font-bold text-gray-900 dark:text-white">{appInfo.version}</p>
            )}
          </div>
          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">App Name</p>
            {editingAppInfo && userMode === 'Editor' ? (
              <input
                type="text"
                value={appInfo.name}
                onChange={(e) => setAppInfo({ ...appInfo, name: e.target.value })}
                className="w-full px-2 py-1 text-lg font-bold border border-blue-300 dark:border-blue-600 rounded focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              />
            ) : (
              <p className="text-lg font-bold text-gray-900 dark:text-white">{appInfo.name}</p>
            )}
          </div>
          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Last Sync</p>
            <p className="text-lg font-bold text-gray-900 dark:text-white">{new Date().toLocaleDateString()}</p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Database Status</p>
            <p className="text-lg font-bold text-green-600 dark:text-green-400">Active</p>
          </div>
        </div>

        {editingAppInfo && userMode === 'Editor' && (
          <div className="flex items-center justify-end space-x-3 mb-4">
            <button
              onClick={() => {
                setEditingAppInfo(false);
                setAppInfo({ name: APP_CONFIG.name, version: APP_CONFIG.version });
              }}
              className="px-4 py-2 bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500 text-gray-900 dark:text-white rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                // Update APP_CONFIG values
                APP_CONFIG.name = appInfo.name;
                APP_CONFIG.version = appInfo.version;
                setEditingAppInfo(false);
                showToast('App information updated successfully', 'success');
              }}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center space-x-2 transition-colors"
            >
              <Save className="w-4 h-4" />
              <span>Save</span>
            </button>
          </div>
        )}

        <div className="mt-4">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Database Statistics</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded text-center">
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{dbStats.breakers}</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">Breakers</p>
            </div>
            <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded text-center">
              <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{dbStats.personnel}</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">Personnel</p>
            </div>
            <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded text-center">
              <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{dbStats.locks}</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">Locks</p>
            </div>
            <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded text-center">
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">{dbStats.plans}</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">Plans</p>
            </div>
            <div className="bg-orange-50 dark:bg-orange-900/20 p-3 rounded text-center">
              <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{dbStats.activities}</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">Activities</p>
            </div>
          </div>
        </div>

        {paths && (
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Storage Paths</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between py-2 border-b border-gray-200 dark:border-gray-700">
                <span className="text-gray-600 dark:text-gray-400">Database:</span>
                <span className="text-gray-900 dark:text-white font-mono text-xs break-all max-w-md text-right">{paths.db}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-200 dark:border-gray-700">
                <span className="text-gray-600 dark:text-gray-400">PDFs:</span>
                <span className="text-gray-900 dark:text-white font-mono text-xs break-all max-w-md text-right">{paths.pdfs}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-200 dark:border-gray-700">
                <span className="text-gray-600 dark:text-gray-400">Plans:</span>
                <span className="text-gray-900 dark:text-white font-mono text-xs break-all max-w-md text-right">{paths.plans}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-gray-600 dark:text-gray-400">Logs:</span>
                <span className="text-gray-900 dark:text-white font-mono text-xs break-all max-w-md text-right">{paths.log}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Dependencies */}
      {dependencies && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center space-x-2 mb-4">
            <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Dependencies Status</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded">
              <p className="text-gray-500 dark:text-gray-400 text-xs">Node.js</p>
              <p className="font-semibold text-gray-900 dark:text-white">{dependencies.nodejs}</p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded">
              <p className="text-gray-500 dark:text-gray-400 text-xs">Electron</p>
              <p className="font-semibold text-gray-900 dark:text-white">{dependencies.electron}</p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded">
              <p className="text-gray-500 dark:text-gray-400 text-xs">SQLite</p>
              <p className="font-semibold text-gray-900 dark:text-white">{dependencies.sqlite}</p>
            </div>
          </div>
        </div>
      )}

      {/* CSV Templates */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center space-x-2 mb-4">
          <FileText className="w-5 h-5 text-green-600 dark:text-green-400" />
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white">CSV Templates</h2>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Download CSV template files to use for bulk imports
        </p>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => handleDownloadTemplate('breakers_template.csv')}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg flex items-center space-x-2 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Breakers Template</span>
          </button>
          <button
            onClick={() => handleDownloadTemplate('personnel_template.csv')}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg flex items-center space-x-2 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Personnel Template</span>
          </button>
        </div>
      </div>

      {/* Download Logs - Available to All Users */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Download className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Activity Logs</h2>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Download the complete activity log history as a CSV file
        </p>
        <button
          onClick={handleDownloadLogs}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center space-x-2 transition-colors"
        >
          <Download className="w-4 h-4" />
          <span>Download Activity Logs</span>
        </button>
      </div>

      {/* Maintenance Tools - Editor Only */}
      {userMode === 'Editor' && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center space-x-2 mb-4">
            <Wrench className="w-5 h-5 text-orange-600 dark:text-orange-400" />
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Database Maintenance</h2>
          </div>
          <div className="space-y-4">
            <div className="flex flex-wrap gap-3">
              <button
                onClick={handleRepairDatabase}
                className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg flex items-center space-x-2 transition-colors"
              >
                <Wrench className="w-4 h-4" />
                <span>Repair Database</span>
              </button>
              <button
                onClick={loadLogs}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg flex items-center space-x-2 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Refresh Logs</span>
              </button>
            </div>
            {repairMessage && (
              <div className={`p-3 rounded-lg ${repairMessage.includes('Error') ? 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200' : 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'}`}>
                {repairMessage}
              </div>
            )}
            {logs && (
              <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-xs max-h-64 overflow-y-auto">
                <pre className="whitespace-pre-wrap select-text">{logs || 'No logs available'}</pre>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Danger Zone - Editor Only */}
      {userMode === 'Editor' && (
        <div className="bg-red-50 dark:bg-red-900 dark:bg-opacity-20 rounded-lg shadow-md border-2 border-red-300 dark:border-red-800 p-6">
          <div className="flex items-center space-x-2 mb-4">
            <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
            <h2 className="text-lg font-semibold text-red-800 dark:text-red-400">Danger Zone</h2>
          </div>
          
          <p className="text-sm text-red-700 dark:text-red-300 mb-4">
            ⚠️ Warning: These actions are irreversible and will permanently delete all data.
          </p>

          <button
            onClick={() => setShowNukeModal(true)}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg flex items-center space-x-2 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            <span>Delete All Data (Nuke Database)</span>
          </button>
        </div>
      )}

      {/* Nuke Confirmation Modal */}
      {showNukeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6 border-4 border-red-500">
            <div className="flex items-center space-x-2 mb-4">
              <AlertTriangle className="w-8 h-8 text-red-600" />
              <h2 className="text-xl font-bold text-red-600 dark:text-red-400">⚠️ DANGER ZONE ⚠️</h2>
            </div>
            
            <div className="mb-4 p-4 bg-red-100 dark:bg-red-900 dark:bg-opacity-30 rounded-lg">
              <p className="text-sm text-red-800 dark:text-red-300 font-semibold mb-2">
                This will permanently delete:
              </p>
              <ul className="text-sm text-red-700 dark:text-red-400 list-disc list-inside space-y-1">
                <li>All breakers and their history</li>
                <li>All locks inventory</li>
                <li>All personnel records</li>
                <li>All electrical plans</li>
                <li>All PDF certificates and files</li>
                <li>All audit logs</li>
              </ul>
            </div>

            <p className="text-sm text-gray-700 dark:text-gray-300 mb-4 font-semibold">
              This action CANNOT be undone!
            </p>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Enter Editor Access Code to confirm:
              </label>
              <input
                type="password"
                value={nukeCode}
                onChange={(e) => {
                  setNukeCode(e.target.value);
                  setNukeError('');
                }}
                className="w-full px-3 py-2 border-2 border-red-300 dark:border-red-700 rounded-lg focus:ring-2 focus:ring-red-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="Enter access code"
                autoFocus
              />
              {nukeError && (
                <p className="text-sm text-red-600 dark:text-red-400 mt-2">{nukeError}</p>
              )}
            </div>

            <div className="flex space-x-3">
              <button
                onClick={handleNuke}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg font-medium transition-colors"
              >
                Yes, Delete Everything
              </button>
              <button
                onClick={() => {
                  setShowNukeModal(false);
                  setNukeCode('');
                  setNukeError('');
                }}
                className="flex-1 bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500 text-gray-900 dark:text-white py-2 rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* About Section */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-700 rounded-lg shadow-md border border-blue-200 dark:border-gray-600 p-6">
        <div className="flex items-center space-x-2 mb-4">
          <SettingsIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white">About</h2>
        </div>
        
        <div className="space-y-3">
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Company</p>
            <p className="text-xl font-bold text-blue-600 dark:text-blue-400">SGTM</p>
          </div>
          
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">System Name</p>
            <p className="text-lg font-semibold text-gray-800 dark:text-white">LOTO Key Management System (KMS)</p>
          </div>
          
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Description</p>
            <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
              An internal SGTM application developed to digitalize the Lockout Tagout (LOTO) key management process — ensuring safety, traceability, and operational control.
            </p>
          </div>
          
          <div className="pt-4 border-t border-gray-200 dark:border-gray-600">
            <p className="text-xs text-gray-500 dark:text-gray-400">Version 3.0</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">© 2025 SGTM - All rights reserved</p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
}

export default Settings;
