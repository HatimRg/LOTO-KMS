import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Zap, Search, Plus, Edit2, Trash2, AlertCircle, Download, Upload } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { useToast } from '../context/ToastContext';
import Footer from '../components/Footer';
import db from '../utils/database';
import Papa from 'papaparse';

const { ipcRenderer } = window;

function ViewByBreakers() {
  const location = useLocation();
  const { userMode } = useApp();
  const { showToast } = useToast();
  const fileInputRef = useRef(null);
  const [breakers, setBreakers] = useState([]);
  const [zones, setZones] = useState([]);
  const [locations, setLocations] = useState([]);
  const [selectedZone, setSelectedZone] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [selectedState, setSelectedState] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingBreaker, setEditingBreaker] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    zone: '',
    subzone: '',
    location: '',
    customLocation: '',
    state: 'Off',
    lock_key: '',
    general_breaker: ''
  });
  const [previousCustomLocations, setPreviousCustomLocations] = useState([]);
  const [availableGeneralBreakers, setAvailableGeneralBreakers] = useState([]);
  
  // Zone -> SubZone mapping
  const zoneSubzoneMap = {
    'Zone 1': ['R01', 'R02'],
    'Zone 2': ['R11', 'R13', 'R15'],
    'Zone 3': ['R12', 'R14', 'R21', 'R22']
  };
  
  const locationOptions = [
    'Poste de Transformation',
    'Poste Génératrice',
    'TGBT',
    'Local Technique'
  ];

  useEffect(() => {
    loadData();
  }, []);

  // Handle navigation state separately to avoid triggering loadData
  useEffect(() => {
    if (location.state?.searchTerm) {
      setSearchTerm(location.state.searchTerm);
    }
  }, [location.state]);

  const loadData = async () => {
    // Only show loading spinner on initial load, not on updates (preserves scroll)
    const isInitialLoad = breakers.length === 0;
    if (isInitialLoad) {
      setLoading(true);
    }
    
    const result = await db.getBreakers();
    if (result.success) {
      setBreakers(result.data);
    }

    const zoneList = await db.getZones();
    setZones(zoneList);

    const locationList = await db.getLocations();
    setLocations(locationList);
    
    if (isInitialLoad) {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingBreaker(null);
    setFormData({
      name: '',
      zone: '',
      subzone: '',
      location: '',
      customLocation: '',
      state: 'Off',
      lock_key: '',
      general_breaker: ''
    });
    loadPreviousCustomLocations();
    setShowModal(true);
  };

  const handleEdit = (breaker) => {
    setEditingBreaker(breaker);
    
    // Parse zone and subzone from breaker.zone (e.g., "Zone 1 - R01")
    const [mainZone, subZone] = breaker.zone?.includes('-') 
      ? breaker.zone.split(' - ').map(s => s.trim())
      : [breaker.zone || '', ''];
    
    setFormData({
      name: breaker.name,
      zone: mainZone,
      subzone: subZone,
      location: locationOptions.includes(breaker.location) ? breaker.location : 'Local Technique',
      customLocation: locationOptions.includes(breaker.location) ? '' : breaker.location,
      state: breaker.state,
      lock_key: breaker.lock_key || '',
      general_breaker: breaker.general_breaker || ''
    });
    loadPreviousCustomLocations();
    loadGeneralBreakers(mainZone);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this breaker?')) {
      const result = await db.deleteBreaker(id);
      if (result.success) {
        await db.addHistory({
          breaker_id: id,
          action: 'Deleted breaker',
          user_mode: userMode
        });
        showToast('Breaker deleted successfully', 'success');
        loadData();
      }
    }
  };
  
  // Load previous custom locations for "Local Technique"
  const loadPreviousCustomLocations = async () => {
    const result = await db.getBreakers();
    if (result.success && result.data) {
      const customLocs = result.data
        .filter(b => !locationOptions.includes(b.location) && b.location)
        .map(b => b.location)
        .filter((v, i, arr) => arr.indexOf(v) === i); // unique values
      setPreviousCustomLocations(customLocs);
    }
  };
  
  // Load available general breakers for the selected zone
  const loadGeneralBreakers = async (zone) => {
    const result = await db.getBreakers();
    if (result.success && result.data) {
      const filtered = result.data.filter(b => 
        b.zone?.startsWith(zone) && (!editingBreaker || b.id !== editingBreaker.id)
      );
      setAvailableGeneralBreakers(filtered);
    }
  };
  
  // Handle zone change - reset subzone and load general breakers
  const handleZoneChange = (zone) => {
    setFormData({
      ...formData,
      zone,
      subzone: '',
      general_breaker: ''
    });
    loadGeneralBreakers(zone);
  };
  
  // Handle state change - check general breaker restriction
  const handleStateChange = (newState) => {
    // If general breaker is Off or Closed, this breaker cannot be On
    if (newState === 'On' && formData.general_breaker) {
      const generalBreaker = breakers.find(b => b.name === formData.general_breaker);
      if (generalBreaker && (generalBreaker.state === 'Off' || generalBreaker.state === 'Closed')) {
        showToast('Cannot turn On: General breaker is Off or Closed', 'error');
        return;
      }
    }
    
    setFormData({
      ...formData,
      state: newState,
      lock_key: newState === 'Closed' ? formData.lock_key : ''
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Combine zone and subzone
    const combinedZone = formData.subzone 
      ? `${formData.zone} - ${formData.subzone}`
      : formData.zone;
    
    // Determine final location
    const finalLocation = formData.location === 'Local Technique' && formData.customLocation
      ? formData.customLocation
      : formData.location;
    
    const submitData = {
      name: formData.name,
      zone: combinedZone,
      location: finalLocation,
      state: formData.state,
      lock_key: formData.state === 'Closed' ? formData.lock_key : null,
      general_breaker: formData.general_breaker || null
    };
    
    if (editingBreaker) {
      const result = await db.updateBreaker(editingBreaker.id, submitData);
      if (result.success) {
        await db.addHistory({
          breaker_id: editingBreaker.id,
          action: `Updated breaker: ${formData.name}`,
          user_mode: userMode,
          details: `State changed to ${formData.state}`
        });
        showToast('Breaker updated successfully', 'success');
      } else {
        showToast('Failed to update breaker', 'error');
      }
    } else {
      const result = await db.addBreaker(submitData);
      if (result.success) {
        await db.addHistory({
          breaker_id: result.data?.lastInsertRowid || result.data?.id,
          action: `Added new breaker: ${formData.name}`,
          user_mode: userMode
        });
        showToast('Breaker added successfully', 'success');
      } else {
        showToast('Failed to add breaker', 'error');
      }
    }
    
    setShowModal(false);
    loadData();
  };

  const handleExportCSV = async () => {
    const csv = Papa.unparse(filteredBreakers);
    if (ipcRenderer) {
      await ipcRenderer.invoke('export-csv', {
        fileName: `breakers_${new Date().toISOString().split('T')[0]}.csv`,
        data: csv
      });
    }
  };

  const handleImportCSV = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        let successCount = 0;
        let errorCount = 0;
        
        showToast(`Importing ${results.data.length} breakers...`, 'info', 2000);
        
        for (const row of results.data) {
          if (row.name && row.zone && row.location) {
            const breakerData = {
              name: row.name,
              zone: row.zone,
              location: row.location,
              state: row.state || 'Off',
              lock_key: row.lock_key || '',
              general_breaker: row.general_breaker || ''
            };
            
            const result = await db.addBreaker(breakerData);
            if (result.success) {
              successCount++;
              await db.addHistory({
                breaker_id: result.data.lastInsertRowid,
                action: `CSV Import: Added breaker ${breakerData.name}`,
                user_mode: userMode
              });
            } else {
              errorCount++;
            }
          } else {
            errorCount++;
          }
        }
        
        // Reset file input
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        
        // Reload data
        await loadData();
        
        // Show result
        if (errorCount === 0) {
          showToast(`Successfully imported ${successCount} breakers!`, 'success');
        } else {
          showToast(`Imported ${successCount} breakers, ${errorCount} failed`, 'error');
        }
      },
      error: (error) => {
        showToast(`Error parsing CSV: ${error.message}`, 'error');
      }
    });
  };

  // Memoize filtered breakers to prevent recalculation on every render
  const filteredBreakers = useMemo(() => {
    return breakers.filter(breaker => {
      const matchesZone = !selectedZone || breaker.zone === selectedZone;
      const matchesLocation = !selectedLocation || breaker.location === selectedLocation;
      const matchesState = !selectedState || breaker.state === selectedState;
      const matchesSearch = !searchTerm || 
        breaker.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        breaker.zone.toLowerCase().includes(searchTerm.toLowerCase()) ||
        breaker.location.toLowerCase().includes(searchTerm.toLowerCase());
      
      return matchesZone && matchesLocation && matchesState && matchesSearch;
    });
  }, [breakers, selectedZone, selectedLocation, selectedState, searchTerm]);

  const getStateColor = (state) => {
    switch (state) {
      case 'On':
        return 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200';
      case 'Off':
        return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200';
      case 'Closed':
        return 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200';
      default:
        return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200';
    }
  };

  const getStateIcon = (state) => {
    switch (state) {
      case 'On':
        return '🟢';
      case 'Off':
        return '⚪';
      case 'Closed':
        return '🔴';
      default:
        return '⚪';
    }
  };

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
          <Zap className="w-7 h-7 text-blue-600" />
          <span>All Breakers</span>
        </h1>
        <div className="flex items-center space-x-3">
          <button
            onClick={handleExportCSV}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg flex items-center space-x-2 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
          {userMode === 'Editor' && (
            <>
              <button
                onClick={handleImportCSV}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg flex items-center space-x-2 transition-colors"
              >
                <Upload className="w-4 h-4" />
                <span>Import CSV</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="hidden"
              />
              <button
                onClick={handleAdd}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center space-x-2 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Add Breaker</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 border border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search breakers..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          <select
            value={selectedZone}
            onChange={(e) => setSelectedZone(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="">All Zones</option>
            {zones.map(zone => (
              <option key={zone} value={zone}>{zone}</option>
            ))}
          </select>

          <select
            value={selectedLocation}
            onChange={(e) => setSelectedLocation(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="">All Locations</option>
            {locations.map(location => (
              <option key={location} value={location}>{location}</option>
            ))}
          </select>

          <select
            value={selectedState}
            onChange={(e) => setSelectedState(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="">All States</option>
            <option value="On">🟢 On</option>
            <option value="Off">⚪ Off</option>
            <option value="Closed">🔴 Closed</option>
          </select>
        </div>
      </div>

      {/* Breakers Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden">
        {filteredBreakers.length === 0 ? (
          <div className="text-center py-12">
            <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500 dark:text-gray-400">
              {breakers.length === 0 ? 'No breakers found. Add one to get started!' : 'No breakers match your filters'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Zone</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Location</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">State</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Lock Key</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">General Breaker</th>
                  {userMode === 'Editor' && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Actions</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredBreakers.map((breaker) => (
                  <tr key={breaker.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900 dark:text-white">
                      {breaker.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-600 dark:text-gray-300">
                      {breaker.zone}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-600 dark:text-gray-300">
                      {breaker.location}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStateColor(breaker.state)}`}>
                        {getStateIcon(breaker.state)} {breaker.state}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-600 dark:text-gray-300">
                      {breaker.lock_key || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-600 dark:text-gray-300">
                      {breaker.general_breaker || '-'}
                    </td>
                    {userMode === 'Editor' && (
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleEdit(breaker)}
                            className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900 rounded"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(breaker.id)}
                            className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900 rounded"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal - Add/Edit Breaker */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              {editingBreaker ? 'Edit Breaker' : 'Add New Breaker'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Breaker Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Breaker Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="e.g., Main Power Breaker"
                  required
                />
              </div>
              
              {/* Zone Selection */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    General Zone *
                  </label>
                  <select
                    value={formData.zone}
                    onChange={(e) => handleZoneChange(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    required
                  >
                    <option value="">Select Zone</option>
                    {Object.keys(zoneSubzoneMap).map(zone => (
                      <option key={zone} value={zone}>{zone}</option>
                    ))}
                  </select>
                </div>
                
                {/* SubZone Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    SubZone *
                  </label>
                  <select
                    value={formData.subzone}
                    onChange={(e) => setFormData({...formData, subzone: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    disabled={!formData.zone}
                    required
                  >
                    <option value="">Select SubZone</option>
                    {formData.zone && zoneSubzoneMap[formData.zone]?.map(subzone => (
                      <option key={subzone} value={subzone}>{subzone}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              {/* Location Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Location *
                </label>
                <select
                  value={formData.location}
                  onChange={(e) => setFormData({...formData, location: e.target.value, customLocation: ''})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  required
                >
                  <option value="">Select Location</option>
                  {locationOptions.map(loc => (
                    <option key={loc} value={loc}>{loc}</option>
                  ))}
                </select>
              </div>
              
              {/* Custom Location (if Local Technique selected) */}
              {formData.location === 'Local Technique' && (
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Specify Area *
                  </label>
                  <input
                    type="text"
                    value={formData.customLocation}
                    onChange={(e) => setFormData({...formData, customLocation: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Enter specific area name"
                    required
                  />
                  
                  {previousCustomLocations.length > 0 && (
                    <div>
                      <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                        Or select from previous:
                      </label>
                      <select
                        value=""
                        onChange={(e) => setFormData({...formData, customLocation: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                      >
                        <option value="">-- Select Previous Area --</option>
                        {previousCustomLocations.map((loc, idx) => (
                          <option key={idx} value={loc}>{loc}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              )}
              
              {/* State Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  State *
                </label>
                <select
                  value={formData.state}
                  onChange={(e) => handleStateChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="On">🟢 On</option>
                  <option value="Off">⚪ Off</option>
                  <option value="Closed">🔴 Closed (Locked)</option>
                </select>
              </div>
              
              {/* Lock Key (only if Closed) */}
              {formData.state === 'Closed' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Lock Key Number *
                  </label>
                  <input
                    type="text"
                    value={formData.lock_key}
                    onChange={(e) => setFormData({...formData, lock_key: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="e.g., KEY-001"
                    required
                  />
                </div>
              )}
              
              {/* General Breaker */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  General Breaker (Optional)
                </label>
                <select
                  value={formData.general_breaker}
                  onChange={(e) => setFormData({...formData, general_breaker: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  disabled={!formData.zone}
                >
                  <option value="">-- No General Breaker --</option>
                  {availableGeneralBreakers.map(breaker => (
                    <option key={breaker.id} value={breaker.name}>
                      {breaker.name} ({breaker.state})
                    </option>
                  ))}
                </select>
                {formData.general_breaker && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    ⚠️ This breaker cannot be turned On if the general breaker is Off or Closed
                  </p>
                )}
              </div>
              
              {/* Form Actions */}
              <div className="flex space-x-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-medium transition-colors"
                >
                  {editingBreaker ? '✔️ Update Breaker' : '➕ Add Breaker'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500 text-gray-900 dark:text-white py-2 rounded-lg font-medium transition-colors"
                >
                  ✖️ Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Footer */}
      <Footer />
    </div>
  );
}

export default ViewByBreakers;
