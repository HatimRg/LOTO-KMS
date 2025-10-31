import React, { useState, useEffect, useMemo, memo, useCallback, useRef } from 'react';
import { Package, Settings } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useToast } from '../context/ToastContext';
import Footer from '../components/Footer';
import db from '../utils/database';

// Memoized StatCard component to prevent flickering
const StatCard = memo(({ title, value, subtitle, color }) => (
  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700 transition-all duration-300">
    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">{title}</p>
    <p className={`text-3xl font-bold ${color} transition-all duration-300`}>{value}</p>
    {subtitle && <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{subtitle}</p>}
  </div>
));
StatCard.displayName = 'StatCard';

// Memoized ZoneCard component
const ZoneCard = memo(({ zoneData }) => (
  <div className="bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-800 p-4 rounded-lg transition-all duration-300">
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center space-x-3">
        <div className="w-3 h-3 rounded-full bg-red-500"></div>
        <span className="text-lg font-medium text-gray-900 dark:text-white">
          {zoneData.zone}
        </span>
      </div>
      <div className="flex items-center space-x-2">
        <span className="text-sm text-gray-500 dark:text-gray-400">Locks in Use:</span>
        <span className="px-3 py-1 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 rounded-full text-sm font-bold transition-all duration-300">
          {zoneData.locksInUse}
        </span>
      </div>
    </div>
    
    {/* Show breakers in this zone */}
    <div className="mt-2 ml-6 space-y-1">
      {zoneData.breakers.map((breaker, idx) => (
        <div key={idx} className="text-sm text-gray-600 dark:text-gray-400 flex items-center space-x-2">
          <span className="text-gray-400">→</span>
          <span className="font-medium">{breaker.name}</span>
          <span className="text-gray-500">({breaker.location})</span>
          <span className="text-yellow-600 dark:text-yellow-400">🔑 {breaker.lock_key}</span>
        </div>
      ))}
    </div>
  </div>
));
ZoneCard.displayName = 'ZoneCard';

function Storage() {
  const { userMode } = useApp();
  const { showToast } = useToast();
  const [locks, setLocks] = useState([]);
  const [locksByZone, setLocksByZone] = useState([]);
  const [lockStats, setLockStats] = useState({ totalLocks: 0, locksInUse: 0, available: 0 });
  const [loading, setLoading] = useState(true);
  
  // Use refs to track previous data for comparison
  const prevLocksRef = useRef(null);
  const prevLocksByZoneRef = useRef(null);
  const prevLockStatsRef = useRef(null);

  // Helper functions to check if data has changed
  const dataChanged = (newData, prevData) => {
    if (!prevData) return true;
    return JSON.stringify(prevData) !== JSON.stringify(newData);
  };
  const [showModal, setShowModal] = useState(false);
  const [showStorageModal, setShowStorageModal] = useState(false);
  const [totalStorage, setTotalStorage] = useState(0);
  const [editingLock, setEditingLock] = useState(null);
  const [formData, setFormData] = useState({
    key_number: '',
    zone: '',
    used: false,
    assigned_to: '',
    remarks: ''
  });

  // Stable loadData reference for useEffect
  const loadDataRef = useRef(null);
  
  useEffect(() => {
    // Initial load
    if (loadDataRef.current) {
      loadDataRef.current();
    }
    
    // Auto-refresh every 3 seconds for real-time updates
    const interval = setInterval(() => {
      if (loadDataRef.current) {
        loadDataRef.current();
      }
    }, 3000);
    
    return () => clearInterval(interval);
  }, []);

  // loadData without dependencies to avoid infinite loop
  const loadData = useCallback(async () => {
    // Check if this is initial load by checking refs instead of state
    const isInitialLoad = !prevLocksRef.current;
    if (isInitialLoad) {
      setLoading(true);
    }
    
    try {
      // Get locks inventory
      const locksResult = await db.getLocks();
      const newLocks = locksResult.success ? (locksResult.data || []) : [];

      // Get locks by zone from BREAKER data (not lock table)
      const locksByZoneResult = await db.getLocksByZone();
      const newLocksByZone = locksByZoneResult.success ? (locksByZoneResult.data || []) : [];

      // Get stats from BREAKERS
      const statsResult = await db.getStatsFromBreakers();
      let newLockStats = { totalLocks: 0, locksInUse: 0, available: 0 };
      
      if (statsResult.success && statsResult.data) {
        newLockStats = {
          totalLocks: statsResult.data.totalLocks,
          locksInUse: statsResult.data.usedLocks,  // From breaker data
          available: newLocks.length - statsResult.data.usedLocks
        };
      }

      // Only update state if data has actually changed
      if (dataChanged(newLocks, prevLocksRef.current)) {
        setLocks(newLocks);
        prevLocksRef.current = newLocks;
      }

      if (dataChanged(newLocksByZone, prevLocksByZoneRef.current)) {
        setLocksByZone(newLocksByZone);
        prevLocksByZoneRef.current = newLocksByZone;
      }

      if (dataChanged(newLockStats, prevLockStatsRef.current)) {
        setLockStats(newLockStats);
        prevLockStatsRef.current = newLockStats;
        console.log(`📦 Storage: ${newLockStats.locksInUse} locks in use (from breaker data)`);
      }
    } catch (error) {
      console.error('Storage load error:', error);
    }
    
    if (isInitialLoad) {
      setLoading(false);
    }
  }, []);
  
  // Update ref when loadData changes
  loadDataRef.current = loadData;

  const handleAdd = () => {
    setEditingLock(null);
    setFormData({
      key_number: '',
      zone: '',
      used: false,
      assigned_to: '',
      remarks: ''
    });
    setShowModal(true);
  };

  const handleEdit = (lock) => {
    setEditingLock(lock);
    setFormData({
      key_number: lock.key_number,
      zone: lock.zone,
      used: Boolean(lock.used),
      assigned_to: lock.assigned_to || '',
      remarks: lock.remarks || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this lock?')) {
      const result = await db.deleteLock(id);
      if (result.success) {
        showToast('Lock deleted successfully', 'success');
        loadData();
      } else {
        showToast('Failed to delete lock', 'error');
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (editingLock) {
      const result = await db.updateLock(editingLock.id, formData);
      if (result.success) {
        showToast('Lock updated successfully', 'success');
      } else {
        showToast('Failed to update lock', 'error');
      }
    } else {
      const result = await db.addLock(formData);
      if (result.success) {
        showToast('Lock added successfully', 'success');
      } else {
        showToast('Failed to add lock', 'error');
      }
    }
    
    setShowModal(false);
    loadData();
  };

  const handleSetTotalStorage = async () => {
    if (totalStorage < 0) {
      showToast('Total storage cannot be negative', 'error');
      return;
    }

    const currentTotal = locks.length;
    const currentUsed = locks.filter(l => l.used).length;

    if (totalStorage < currentUsed) {
      showToast(`Cannot reduce below ${currentUsed} locks (currently in use)`, 'error');
      return;
    }

    showToast('Updating storage...', 'info', 1500);

    try {
      if (totalStorage > currentTotal) {
        // Add new locks
        const locksToAdd = totalStorage - currentTotal;
        for (let i = 0; i < locksToAdd; i++) {
          const keyNum = currentTotal + i + 1;
          await db.addLock({
            key_number: `KEY-${keyNum.toString().padStart(3, '0')}`,
            zone: 'General',
            used: 0,
            assigned_to: '',
            remarks: ''
          });
        }
        showToast(`Added ${locksToAdd} new locks`, 'success');
      } else if (totalStorage < currentTotal) {
        // Remove unused locks
        const locksToRemove = currentTotal - totalStorage;
        const unusedLocks = locks.filter(l => !l.used);
        
        if (unusedLocks.length < locksToRemove) {
          showToast('Not enough unused locks to remove', 'error');
          return;
        }

        for (let i = 0; i < locksToRemove; i++) {
          await db.deleteLock(unusedLocks[i].id);
        }
        showToast(`Removed ${locksToRemove} locks`, 'success');
      } else {
        showToast('Storage already at this total', 'info');
      }

      setShowStorageModal(false);
      setTotalStorage(0);
      await loadData();
    } catch (error) {
      showToast(`Error updating storage: ${error.message}`, 'error');
    }
  };

  // Note: Removed unused memoized calculations (stats, zoneStats, sortedZones, activeZones)
  // We use lockStats and locksByZone from the database instead

  return (
    <div className="space-y-6 relative">
      {/* Loading Overlay - Only on initial load */}
      {loading && (
        <div className="absolute inset-0 bg-white/80 dark:bg-gray-900/80 z-50 flex items-center justify-center rounded-lg">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      )}
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center space-x-2">
          <Package className="w-7 h-7 text-yellow-600" />
          <span>Lock Inventory</span>
        </h1>
        {userMode === 'Editor' && (
          <button
            onClick={() => {
              setTotalStorage(locks.length);
              setShowStorageModal(true);
            }}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center space-x-2 transition-colors"
          >
            <Settings className="w-4 h-4" />
            <span>Set Total Storage</span>
          </button>
        )}
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard 
          title="Total Locks" 
          value={lockStats.totalLocks} 
          color="text-blue-600 dark:text-blue-400"
        />
        <StatCard 
          title="In Use" 
          value={lockStats.locksInUse} 
          subtitle="(from locked breakers)"
          color="text-red-600 dark:text-red-400"
        />
        <StatCard 
          title="Available" 
          value={lockStats.available} 
          color="text-green-600 dark:text-green-400"
        />
      </div>

      {/* Zone Statistics - From Breaker Data */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
          Locks by Zone
          <span className="text-sm font-normal text-gray-500 dark:text-gray-400 ml-2">(from locked breakers)</span>
        </h2>
        {locksByZone.length === 0 ? (
          <div className="text-center py-8">
            <Package className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500 dark:text-gray-400">No locks currently in use</p>
          </div>
        ) : (
          <div className="space-y-3">
            {locksByZone.map(zoneData => (
              <ZoneCard key={zoneData.zone} zoneData={zoneData} />
            ))}
          </div>
        )}
      </div>

      {/* Real-time Update Indicator */}
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
          <p className="text-sm text-blue-800 dark:text-blue-300 font-medium">
            Auto-updating every 3 seconds • Lock statistics synced in real-time
          </p>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              {editingLock ? 'Edit Lock' : 'Add New Lock'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Key Number</label>
                <input
                  type="text"
                  value={formData.key_number}
                  onChange={(e) => setFormData({...formData, key_number: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Zone</label>
                <input
                  type="text"
                  value={formData.zone}
                  onChange={(e) => setFormData({...formData, zone: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  required
                />
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="used"
                  checked={formData.used}
                  onChange={(e) => setFormData({...formData, used: e.target.checked})}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                />
                <label htmlFor="used" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Currently in use
                </label>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Assigned To</label>
                <input
                  type="text"
                  value={formData.assigned_to}
                  onChange={(e) => setFormData({...formData, assigned_to: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Remarks</label>
                <textarea
                  value={formData.remarks}
                  onChange={(e) => setFormData({...formData, remarks: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  rows="3"
                />
              </div>
              <div className="flex space-x-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-medium transition-colors"
                >
                  {editingLock ? 'Update' : 'Add'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500 text-gray-900 dark:text-white py-2 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Storage Modal */}
      {showStorageModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Set Total Storage
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Current: <span className="font-semibold">{locks.length} locks</span> ({locks.filter(l => l.used).length} in use)
            </p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Total Number of Locks
                </label>
                <input
                  type="number"
                  min="0"
                  value={totalStorage}
                  onChange={(e) => setTotalStorage(parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Enter total number"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  {totalStorage > locks.length && `Will add ${totalStorage - locks.length} new locks`}
                  {totalStorage < locks.length && `Will remove ${locks.length - totalStorage} unused locks`}
                  {totalStorage === locks.length && 'No change'}
                </p>
              </div>
              <div className="flex space-x-3 pt-4">
                <button
                  onClick={handleSetTotalStorage}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-medium transition-colors"
                >
                  Update Storage
                </button>
                <button
                  onClick={() => {
                    setShowStorageModal(false);
                    setTotalStorage(0);
                  }}
                  className="flex-1 bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500 text-gray-900 dark:text-white py-2 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <Footer />
    </div>
  );
}

export default Storage;
