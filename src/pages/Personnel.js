import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Users, Plus, Edit2, Trash2, AlertCircle, Search, Upload, Download, FileText, X, Eye } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { useToast } from '../context/ToastContext';
import Footer from '../components/Footer';
import db from '../utils/database';
import Papa from 'papaparse';

const { ipcRenderer } = window;

function Personnel() {
  const location = useLocation();
  const { userMode } = useApp();
  const { showToast } = useToast();
  const csvInputRef = useRef(null);
  const pdfInputRef = useRef(null);
  const [personnel, setPersonnel] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showPDFViewer, setShowPDFViewer] = useState(false);
  const [viewingPDF, setViewingPDF] = useState(null);
  const [editingPerson, setEditingPerson] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    lastname: '',
    id_card: '',
    company: '',
    habilitation: '',
    pdf_path: ''
  });
  const [selectedFile, setSelectedFile] = useState(null);

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
    const isInitialLoad = personnel.length === 0;
    if (isInitialLoad) {
      setLoading(true);
    }
    
    const result = await db.getPersonnel();
    if (result.success) {
      setPersonnel(result.data);
    }
    
    if (isInitialLoad) {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingPerson(null);
    setFormData({
      name: '',
      lastname: '',
      id_card: '',
      company: '',
      habilitation: '',
      pdf_path: ''
    });
    setSelectedFile(null);
    setShowModal(true);
  };

  const handleEdit = (person) => {
    setEditingPerson(person);
    setFormData({
      name: person.name,
      lastname: person.lastname,
      id_card: person.id_card,
      company: person.company || '',
      habilitation: person.habilitation || '',
      pdf_path: person.pdf_path || ''
    });
    setSelectedFile(null);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this person?')) {
      const result = await db.deletePersonnel(id);
      if (result.success) {
        showToast('Personnel deleted successfully', 'success');
        loadData();
      } else {
        showToast('Failed to delete personnel', 'error');
      }
    }
  };

  // Handle CSV Import
  const handleCSVImport = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    showToast('Processing import...', 'info', 1500);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          let imported = 0;
          let skipped = 0;
          let failed = 0;
          const errors = [];

          for (let i = 0; i < results.data.length; i++) {
            const row = results.data[i];
            const rowNum = i + 2; // Account for header row

            // Map CSV columns to personnel fields (flexible column names)
            const personData = {
              name: (row.name || row.Name || row.NAME || '').trim(),
              lastname: (row.lastname || row.Lastname || row.last_name || row.LASTNAME || '').trim(),
              id_card: (row.id_card || row.ID || row.id || row.ID_CARD || '').trim(),
              company: (row.company || row.Company || row.COMPANY || '').trim(),
              habilitation: (row.habilitation || row.Habilitation || row.HABILITATION || row.habilitation_type || '').trim(),
              pdf_path: ''
            };

            // Validate required fields
            const missingFields = [];
            if (!personData.name) missingFields.push('Name');
            if (!personData.lastname) missingFields.push('Lastname');
            if (!personData.id_card) missingFields.push('ID Card');
            if (!personData.habilitation) missingFields.push('Habilitation');
            if (!personData.company) missingFields.push('Company');

            if (missingFields.length > 0) {
              errors.push(`Row ${rowNum}: Missing ${missingFields.join(', ')}`);
              failed++;
              continue;
            }

            // Check for duplicates (name + company)
            const isDuplicate = personnel.some(p => 
              p.name.toLowerCase() === personData.name.toLowerCase() &&
              p.lastname.toLowerCase() === personData.lastname.toLowerCase() &&
              p.company.toLowerCase() === personData.company.toLowerCase()
            );

            if (isDuplicate) {
              skipped++;
              continue;
            }

            // Add personnel
            const result = await db.addPersonnel(personData);
            if (result.success) {
              imported++;
            } else {
              errors.push(`Row ${rowNum}: Failed to add - ${result.error || 'Unknown error'}`);
              failed++;
            }
          }

          // Reload data
          await loadData();

          // Show detailed result
          if (imported > 0 && failed === 0 && skipped === 0) {
            showToast(`✓ Successfully imported ${imported} personnel record${imported !== 1 ? 's' : ''}`, 'success', 4000);
          } else {
            let message = [];
            if (imported > 0) message.push(`✓ Imported: ${imported}`);
            if (skipped > 0) message.push(`⊘ Skipped (duplicates): ${skipped}`);
            if (failed > 0) message.push(`✗ Failed: ${failed}`);
            
            showToast(message.join(' • '), imported > 0 ? 'warning' : 'error', 5000);
            
            if (errors.length > 0 && errors.length <= 5) {
              console.error('Import errors:', errors);
            }
          }
        } catch (error) {
          showToast(`Import error: ${error.message}`, 'error');
          console.error('Import error:', error);
        }
      },
      error: (error) => {
        showToast(`CSV parse error: ${error.message}`, 'error');
      }
    });

    // Reset input
    if (csvInputRef.current) csvInputRef.current.value = '';
  };

  // Handle PDF file selection (browser compatible)
  const handlePDFSelect = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      showToast('Please select a PDF file', 'error');
      return;
    }

    // Read file as base64
    const reader = new FileReader();
    reader.onload = (e) => {
      setSelectedFile({
        name: file.name,
        data: e.target?.result,
        type: file.type
      });
      showToast(`PDF selected: ${file.name}`, 'success');
    };
    reader.onerror = () => {
      showToast('Failed to read PDF file', 'error');
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    let pdfPath = formData.pdf_path;
    
    // Save file if new one was selected
    if (selectedFile) {
      if (ipcRenderer) {
        // Electron mode: Save via IPC
        const saveResult = await ipcRenderer.invoke('save-file', {
          fileName: `${formData.id_card}_${selectedFile.name}`,
          fileData: selectedFile.data,
          type: 'pdf'
        });
        
        if (saveResult.success) {
          pdfPath = saveResult.path;
        } else {
          showToast('Failed to save PDF file', 'error');
        }
      } else {
        // Browser mode: Store data URL (for now)
        pdfPath = selectedFile.data;
      }
    }
    
    const personData = { ...formData, pdf_path: pdfPath };
    
    if (editingPerson) {
      const result = await db.updatePersonnel(editingPerson.id, personData);
      if (result.success) {
        showToast('Personnel updated successfully', 'success');
      } else {
        showToast('Failed to update personnel', 'error');
      }
    } else {
      const result = await db.addPersonnel(personData);
      if (result.success) {
        showToast('Personnel added successfully', 'success');
      } else {
        showToast('Failed to add personnel', 'error');
      }
    }
    
    setShowModal(false);
    loadData();
  };

  const handleViewPDF = async (pdfPath, personName) => {
    if (!pdfPath) {
      showToast('No PDF available', 'error');
      return;
    }

    try {
      // Check if it's a data URL (browser mode)
      if (pdfPath.startsWith('data:')) {
        setViewingPDF({ url: pdfPath, name: personName });
        setShowPDFViewer(true);
      } else if (ipcRenderer) {
        // Electron mode - read file
        const result = await ipcRenderer.invoke('read-file', pdfPath);
        if (result.success) {
          const blob = new Blob([Buffer.from(result.data, 'base64')], { type: 'application/pdf' });
          const url = window.URL.createObjectURL(blob);
          setViewingPDF({ url, name: personName });
          setShowPDFViewer(true);
        } else {
          showToast('Failed to load PDF', 'error');
        }
      } else {
        showToast('PDF viewing not available', 'error');
      }
    } catch (error) {
      console.error('Error viewing PDF:', error);
      showToast('Error loading PDF', 'error');
    }
  };

  const handleDownloadPDF = async (pdfPath, idCard) => {
    if (!pdfPath) return;

    try {
      // Check if it's a data URL (browser mode)
      if (pdfPath.startsWith('data:')) {
        // Create download link from data URL
        const a = document.createElement('a');
        a.href = pdfPath;
        a.download = `certificate_${idCard}.pdf`;
        a.click();
        showToast('PDF downloaded', 'success');
      } else if (ipcRenderer) {
        // Electron mode
        const result = await ipcRenderer.invoke('read-file', pdfPath);
        if (result.success) {
          const blob = new Blob([Buffer.from(result.data, 'base64')], { type: 'application/pdf' });
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `certificate_${idCard}.pdf`;
          a.click();
          window.URL.revokeObjectURL(url);
          showToast('PDF downloaded', 'success');
        } else {
          showToast('Failed to download PDF', 'error');
        }
      }
    } catch (error) {
      console.error('Error downloading PDF:', error);
      showToast('Error downloading PDF', 'error');
    }
  };

  // Memoize filtered personnel to prevent recalculation on every render
  const filteredPersonnel = useMemo(() => {
    return personnel.filter(person => {
      const searchLower = searchTerm.toLowerCase();
      return !searchTerm || 
        person.name.toLowerCase().includes(searchLower) ||
        person.lastname.toLowerCase().includes(searchLower) ||
        person.id_card.toLowerCase().includes(searchLower) ||
        person.company?.toLowerCase().includes(searchLower);
    });
  }, [personnel, searchTerm]);

  return (
    <div className="space-y-6 relative">
      {/* Loading Overlay - Only on initial load */}
      {loading && (
        <div className="absolute inset-0 bg-white/80 dark:bg-gray-900/80 z-50 flex items-center justify-center rounded-lg">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      )}
      {/* Hidden File Inputs */}
      <input
        ref={csvInputRef}
        type="file"
        accept=".csv"
        onChange={handleCSVImport}
        className="hidden"
      />
      <input
        ref={pdfInputRef}
        type="file"
        accept=".pdf"
        onChange={handlePDFSelect}
        className="hidden"
      />

      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center space-x-2">
          <Users className="w-7 h-7 text-green-600" />
          <span>Personnel Access Control</span>
        </h1>
        {userMode === 'Editor' && (
          <div className="flex space-x-2">
            <button
              onClick={() => csvInputRef.current?.click()}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg flex items-center space-x-2 transition-colors"
            >
              <Upload className="w-4 h-4" />
              <span>Import CSV</span>
            </button>
            <button
              onClick={handleAdd}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center space-x-2 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Add Personnel</span>
            </button>
          </div>
        )}
      </div>

      {/* Search */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 border border-gray-200 dark:border-gray-700">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search personnel by name, ID card, or company..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>
      </div>

      {/* Personnel Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden">
        {filteredPersonnel.length === 0 ? (
          <div className="text-center py-12">
            <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500 dark:text-gray-400">
              {personnel.length === 0 ? 'No personnel records found. Add one to get started!' : 'No personnel match your search'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">ID Card</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Company</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Habilitation / Certificate</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredPersonnel.map((person) => (
                  <tr key={person.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900 dark:text-white">
                        {person.name} {person.lastname}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-600 dark:text-gray-300">
                      {person.id_card}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-600 dark:text-gray-300">
                      {person.company || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {person.pdf_path ? (
                        <button
                          onClick={() => handleViewPDF(person.pdf_path, `${person.name} ${person.lastname}`)}
                          className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium hover:underline flex items-center space-x-1"
                        >
                          <span>{person.habilitation || 'View Certificate'}</span>
                          <Eye className="w-4 h-4" />
                        </button>
                      ) : (
                        <span className="text-gray-600 dark:text-gray-300">
                          {person.habilitation || '-'}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        {userMode === 'Editor' && (
                          <>
                            <button
                              onClick={() => handleEdit(person)}
                              className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900 rounded"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(person.id)}
                              className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900 rounded"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              {editingPerson ? 'Edit Personnel' : 'Add New Personnel'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">First Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Last Name</label>
                  <input
                    type="text"
                    value={formData.lastname}
                    onChange={(e) => setFormData({...formData, lastname: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">ID Card</label>
                <input
                  type="text"
                  value={formData.id_card}
                  onChange={(e) => setFormData({...formData, id_card: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Company</label>
                <input
                  type="text"
                  value={formData.company}
                  onChange={(e) => setFormData({...formData, company: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Habilitation</label>
                <input
                  type="text"
                  value={formData.habilitation}
                  onChange={(e) => setFormData({...formData, habilitation: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  PDF Certificate (Optional)
                </label>
                <button
                  type="button"
                  onClick={() => pdfInputRef.current?.click()}
                  className="w-full px-4 py-2 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-blue-500 dark:hover:border-blue-400 transition-colors flex items-center justify-center space-x-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
                >
                  <Upload className="w-5 h-5" />
                  <span>{selectedFile ? `✓ ${selectedFile.name}` : 'Click to upload PDF'}</span>
                </button>
                {formData.pdf_path && !selectedFile && (
                  <p className="text-sm text-green-600 dark:text-green-400 mt-2 flex items-center space-x-1">
                    <FileText className="w-4 h-4" />
                    <span>Current: {formData.pdf_path.split(/[\\/]/).pop()}</span>
                  </p>
                )}
              </div>
              <div className="flex space-x-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-medium transition-colors"
                >
                  {editingPerson ? 'Update' : 'Add'}
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

      {/* PDF Viewer Modal */}
      {showPDFViewer && viewingPDF && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full h-[90vh] flex flex-col">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center space-x-2">
                <FileText className="w-5 h-5" />
                <span>Certificate: {viewingPDF.name}</span>
              </h2>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => {
                    const person = personnel.find(p => `${p.name} ${p.lastname}` === viewingPDF.name);
                    if (person) handleDownloadPDF(person.pdf_path, person.id_card);
                  }}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center space-x-2 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  <span>Download</span>
                </button>
                <button
                  onClick={() => {
                    setShowPDFViewer(false);
                    if (viewingPDF.url && !viewingPDF.url.startsWith('data:')) {
                      window.URL.revokeObjectURL(viewingPDF.url);
                    }
                    setViewingPDF(null);
                  }}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                </button>
              </div>
            </div>
            
            {/* PDF Content */}
            <div className="flex-1 overflow-hidden">
              <iframe
                src={viewingPDF.url}
                className="w-full h-full"
                title="PDF Viewer"
              />
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <Footer />
    </div>
  );
}

export default Personnel;
