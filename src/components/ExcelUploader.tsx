import React, { useRef, useState } from 'react';
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle, X, Download } from 'lucide-react';
import { Field, TableRow } from '../types';

// Dynamic import for XLSX to handle potential loading issues
const loadXLSX = async () => {
  try {
    const XLSX = await import('xlsx');
    return XLSX;
  } catch (error) {
    console.error('Failed to load XLSX library:', error);
    throw new Error('Excel processing library failed to load');
  }
};

interface ExcelUploaderProps {
  onDataImport: (fields: Field[], data: TableRow[]) => void;
  onClose: () => void;
}

export const ExcelUploader: React.FC<ExcelUploaderProps> = ({ onDataImport, onClose }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<{ fields: Field[], data: TableRow[] } | null>(null);

  const detectFieldType = (value: any): Field['type'] => {
    if (value === null || value === undefined || value === '') return 'text';
    
    // Check if it's a boolean
    if (typeof value === 'boolean' || value === 'true' || value === 'false' || 
        value === 'yes' || value === 'no' || value === 'Y' || value === 'N') {
      return 'boolean';
    }
    
    // Check if it's a number
    if (!isNaN(Number(value)) && !isNaN(parseFloat(value))) {
      return 'number';
    }
    
    // Check if it's a date
    const dateValue = new Date(value);
    if (!isNaN(dateValue.getTime()) && value.toString().match(/\d{1,4}[-\/]\d{1,2}[-\/]\d{1,4}/)) {
      return 'date';
    }
    
    // Check if it's an email
    if (typeof value === 'string' && value.includes('@') && value.includes('.')) {
      return 'email';
    }
    
    return 'text';
  };

  const convertValue = (value: any, type: Field['type']): any => {
    if (value === null || value === undefined || value === '') {
      return type === 'number' ? 0 : type === 'boolean' ? false : '';
    }
    
    switch (type) {
      case 'number':
        return Number(value) || 0;
      case 'boolean':
        if (typeof value === 'boolean') return value;
        const str = value.toString().toLowerCase();
        return str === 'true' || str === 'yes' || str === 'y' || str === '1';
      case 'date':
        const date = new Date(value);
        return !isNaN(date.getTime()) ? date.toISOString().split('T')[0] : '';
      default:
        return value.toString();
    }
  };

  const processExcelFile = (file: File) => {
    setIsProcessing(true);
    setError(null);
    
    const processFile = async () => {
      try {
        const XLSX = await loadXLSX();
        
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const data = new Uint8Array(e.target?.result as ArrayBuffer);
            const workbook = XLSX.read(data, { type: 'array' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
            
            if (jsonData.length < 2) {
              throw new Error('Excel file must have at least a header row and one data row');
            }
            
            // Extract headers (first row)
            const headers = jsonData[0] as string[];
            const dataRows = jsonData.slice(1) as any[][];
            
            // Create fields based on headers and data types
            const fields: Field[] = headers.map((header, index) => {
              // Sample first few non-empty values to determine type
              const sampleValues = dataRows
                .map(row => row[index])
                .filter(val => val !== null && val !== undefined && val !== '')
                .slice(0, 5);
              
              const detectedType = sampleValues.length > 0 
                ? detectFieldType(sampleValues[0]) 
                : 'text';
              
              return {
                id: `field_${index}_${Date.now()}`,
                name: header.toString().trim() || `Column ${index + 1}`,
                type: detectedType,
                required: false
              };
            });
            
            // Convert data rows to table format
            const tableData: TableRow[] = dataRows
              .filter(row => row.some(cell => cell !== null && cell !== undefined && cell !== ''))
              .map((row, rowIndex) => {
                const rowData: TableRow = {
                  id: `row_${rowIndex}_${Date.now()}`
                };
                
                fields.forEach((field, fieldIndex) => {
                  const cellValue = row[fieldIndex];
                  rowData[field.name] = convertValue(cellValue, field.type);
                });
                
                return rowData;
              });
            
            setPreview({ fields, data: tableData });
            setIsProcessing(false);
          } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to process Excel file');
            setIsProcessing(false);
          }
        };
        
        reader.onerror = () => {
          setError('Failed to read file');
          setIsProcessing(false);
        };
        
        reader.readAsArrayBuffer(file);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load Excel processing library');
        setIsProcessing(false);
      }
    };
    
    processFile();
  };

  const downloadTemplate = async () => {
    try {
      const XLSX = await loadXLSX();
      const templateData = [
        ['Name', 'Age', 'Email', 'Salary', 'Active'],
        ['John Doe', 30, 'john@example.com', 50000, 'Yes'],
        ['Jane Smith', 25, 'jane@example.com', 45000, 'No'],
        ['Bob Johnson', 35, 'bob@example.com', 60000, 'Yes']
      ];
      
      const ws = XLSX.utils.aoa_to_sheet(templateData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Template');
      XLSX.writeFile(wb, 'data-dive-template.xlsx');
    } catch (error) {
      setError('Failed to download template. Please try again.');
    }
  };

  // Debug function to test modal visibility
  const testModal = () => {
    console.log('Modal should be visible now');
    setError('Test: Modal is working! You can close this message.');
  };

  return (
    <div 
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-[9999]"
      onClick={(e) => {
        // Close modal when clicking backdrop
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileSpreadsheet className="w-8 h-8" />
              <div>
                <h2 className="text-2xl font-bold">Import Excel Data</h2>
                <p className="text-blue-100">Upload your Excel file to automatically create fields and import data</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {/* Test Button - Remove this after confirming modal works */}
          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800 mb-2">Debug: Testing modal visibility</p>
            <button
              onClick={testModal}
              className="px-3 py-1 bg-yellow-500 text-white rounded text-sm hover:bg-yellow-600"
            >
              Test Modal
            </button>
          </div>

          {!preview ? (
            <div className="space-y-6">
              {/* Upload Area */}
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                className={`border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 ${
                  isDragging
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-300 hover:border-gray-400 bg-white'
                }`}
              >
                <div className="space-y-4">
                  <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center ${
                    isDragging ? 'bg-blue-100' : 'bg-gray-100'
                  }`}>
                    <Upload className={`w-8 h-8 ${isDragging ? 'text-blue-600' : 'text-gray-600'}`} />
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {isDragging ? 'Drop your file here' : 'Upload Excel File'}
                    </h3>
                    <p className="text-gray-600 mb-4">
                      Drag and drop your Excel file here, or click to browse
                    </p>
                    
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isProcessing}
                      className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-medium py-3 px-6 rounded-xl transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                    >
                      <FileSpreadsheet className="w-5 h-5" />
                      {isProcessing ? 'Processing...' : 'Choose File'}
                    </button>
                    
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".xlsx,.xls,.csv"
                      onChange={handleFileInputChange}
                      className="hidden"
                    />
                  </div>
                  
                  <div className="text-sm text-gray-500">
                    Supported formats: .xlsx, .xls, .csv (Max 10MB)
                  </div>
                </div>
              </div>

              {/* Template Download */}
              <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-6 border border-green-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">Need a template?</h4>
                    <p className="text-sm text-gray-600">Download our sample Excel template to see the expected format</p>
                  </div>
                  <button
                    onClick={downloadTemplate}
                    className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition-colors shadow-md hover:shadow-lg"
                  >
                    <Download className="w-4 h-4" />
                    Download Template
                  </button>
                </div>
              </div>

              {/* Instructions */}
              <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                <h4 className="font-semibold text-gray-900 mb-3">Instructions:</h4>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-start gap-2">
                    <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></span>
                    First row should contain column headers (field names)
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></span>
                    Data types will be automatically detected (text, number, date, email, boolean)
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></span>
                    Boolean values: use "Yes/No", "True/False", or "Y/N"
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></span>
                    Dates should be in standard format (MM/DD/YYYY or YYYY-MM-DD)
                  </li>
                </ul>
              </div>

              {/* Error Display */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="font-medium text-red-900">Upload Error</h4>
                    <p className="text-red-700 text-sm mt-1">{error}</p>
                    {error.includes('Test:') && (
                      <button
                        onClick={() => setError(null)}
                        className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
                      >
                        Clear message
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Processing State */}
              {isProcessing && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center gap-3">
                  <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-blue-900 font-medium">Processing your file...</span>
                </div>
              )}
            </div>
          ) : (
            /* Preview Section */
            <div className="space-y-6">
              <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-medium text-green-900">File processed successfully!</h4>
                  <p className="text-green-700 text-sm mt-1">
                    Found {preview.fields.length} fields and {preview.data.length} rows of data
                  </p>
                </div>
              </div>

              {/* Fields Preview */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Detected Fields:</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {preview.fields.map((field) => (
                    <div key={field.id} className="bg-gray-50 rounded-lg p-3">
                      <div className="font-medium text-gray-900">{field.name}</div>
                      <div className="text-sm text-gray-600 capitalize">{field.type}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Data Preview */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Data Preview (first 5 rows):</h4>
                <div className="overflow-x-auto bg-white rounded-lg border border-gray-200">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        {preview.fields.map((field) => (
                          <th key={field.id} className="px-4 py-2 text-left font-medium text-gray-900">
                            {field.name}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {preview.data.slice(0, 5).map((row, index) => (
                        <tr key={row.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-25'}>
                          {preview.fields.map((field) => (
                            <td key={field.id} className="px-4 py-2 text-gray-700">
                              {field.type === 'boolean' 
                                ? (row[field.name] ? 'Yes' : 'No')
                                : row[field.name]?.toString() || ''}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {preview.data.length > 5 && (
                  <p className="text-sm text-gray-600 mt-2">
                    ... and {preview.data.length - 5} more rows
                  </p>
                )}
              </div>

              {/* Import Actions */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                <button
                  onClick={() => setPreview(null)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium transition-colors"
                >
                  Upload Different File
                </button>
                <div className="flex items-center gap-3">
                  <button
                    onClick={onClose}
                    className="px-6 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleImport}
                    className="px-6 py-2 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-medium rounded-lg transition-all duration-200 transform hover:scale-105 shadow-lg"
                  >
                    Import Data
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
          
          const detectedType = sampleValues.length > 0 
            ? detectFieldType(sampleValues[0]) 
            : 'text';
          
          return {
            id: `field_${index}_${Date.now()}`,
            name: header.toString().trim() || `Column ${index + 1}`,
            type: detectedType,
            required: false
          };
        });
        
        // Convert data rows to table format
        const tableData: TableRow[] = dataRows
          .filter(row => row.some(cell => cell !== null && cell !== undefined && cell !== ''))
          .map((row, rowIndex) => {
            const rowData: TableRow = {
              id: `row_${rowIndex}_${Date.now()}`
            };
            
            fields.forEach((field, fieldIndex) => {
              const cellValue = row[fieldIndex];
              rowData[field.name] = convertValue(cellValue, field.type);
            });
            
            return rowData;
          });
        
        setPreview({ fields, data: tableData });
        setIsProcessing(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to process Excel file');
        setIsProcessing(false);
      }
    };
    
    reader.onerror = () => {
      setError('Failed to read file');
      setIsProcessing(false);
    };
    
    reader.readAsArrayBuffer(file);
  };

  const handleFileSelect = (file: File) => {
    if (!file.name.match(/\.(xlsx|xls|csv)$/i)) {
      setError('Please select a valid Excel file (.xlsx, .xls) or CSV file');
      return;
    }
    
    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      setError('File size must be less than 10MB');
      return;
    }
    
    processExcelFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleImport = () => {
    if (preview) {
      onDataImport(preview.fields, preview.data);
      onClose();
    }
  };

  const downloadTemplate = () => {
    const templateData = [
      ['Name', 'Age', 'Email', 'Salary', 'Active'],
      ['John Doe', 30, 'john@example.com', 50000, 'Yes'],
      ['Jane Smith', 25, 'jane@example.com', 45000, 'No'],
      ['Bob Johnson', 35, 'bob@example.com', 60000, 'Yes']
    ];
    
    const ws = XLSX.utils.aoa_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Template');
    XLSX.writeFile(wb, 'data-dive-template.xlsx');
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-[9999]">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileSpreadsheet className="w-8 h-8" />
              <div>
                <h2 className="text-2xl font-bold">Import Excel Data</h2>
                <p className="text-blue-100">Upload your Excel file to automatically create fields and import data</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {!preview ? (
            <div className="space-y-6">
              {/* Upload Area */}
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                className={`border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 ${
                  isDragging
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-300 hover:border-gray-400 bg-white'
                }`}
              >
                <div className="space-y-4">
                  <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center ${
                    isDragging ? 'bg-blue-100' : 'bg-gray-100'
                  }`}>
                    <Upload className={`w-8 h-8 ${isDragging ? 'text-blue-600' : 'text-gray-600'}`} />
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {isDragging ? 'Drop your file here' : 'Upload Excel File'}
                    </h3>
                    <p className="text-gray-600 mb-4">
                      Drag and drop your Excel file here, or click to browse
                    </p>
                    
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isProcessing}
                      className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-medium py-3 px-6 rounded-xl transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                    >
                      <FileSpreadsheet className="w-5 h-5" />
                      {isProcessing ? 'Processing...' : 'Choose File'}
                    </button>
                    
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".xlsx,.xls,.csv"
                      onChange={handleFileInputChange}
                      className="hidden"
                    />
                  </div>
                  
                  <div className="text-sm text-gray-500">
                    Supported formats: .xlsx, .xls, .csv (Max 10MB)
                  </div>
                </div>
              </div>

              {/* Template Download */}
              <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-6 border border-green-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">Need a template?</h4>
                    <p className="text-sm text-gray-600">Download our sample Excel template to see the expected format</p>
                  </div>
                  <button
                    onClick={downloadTemplate}
                    className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition-colors shadow-md hover:shadow-lg"
                  >
                    <Download className="w-4 h-4" />
                    Download Template
                  </button>
                </div>
              </div>

              {/* Instructions */}
              <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                <h4 className="font-semibold text-gray-900 mb-3">Instructions:</h4>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-start gap-2">
                    <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></span>
                    First row should contain column headers (field names)
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></span>
                    Data types will be automatically detected (text, number, date, email, boolean)
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></span>
                    Boolean values: use "Yes/No", "True/False", or "Y/N"
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></span>
                    Dates should be in standard format (MM/DD/YYYY or YYYY-MM-DD)
                  </li>
                </ul>
              </div>

              {/* Error Display */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-red-900">Upload Error</h4>
                    <p className="text-red-700 text-sm mt-1">{error}</p>
                  </div>
                </div>
              )}

              {/* Processing State */}
              {isProcessing && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center gap-3">
                  <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-blue-900 font-medium">Processing your file...</span>
                </div>
              )}
            </div>
          ) : (
            /* Preview Section */
            <div className="space-y-6">
              <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-medium text-green-900">File processed successfully!</h4>
                  <p className="text-green-700 text-sm mt-1">
                    Found {preview.fields.length} fields and {preview.data.length} rows of data
                  </p>
                </div>
              </div>

              {/* Fields Preview */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Detected Fields:</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {preview.fields.map((field) => (
                    <div key={field.id} className="bg-gray-50 rounded-lg p-3">
                      <div className="font-medium text-gray-900">{field.name}</div>
                      <div className="text-sm text-gray-600 capitalize">{field.type}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Data Preview */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Data Preview (first 5 rows):</h4>
                <div className="overflow-x-auto bg-white rounded-lg border border-gray-200">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        {preview.fields.map((field) => (
                          <th key={field.id} className="px-4 py-2 text-left font-medium text-gray-900">
                            {field.name}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {preview.data.slice(0, 5).map((row, index) => (
                        <tr key={row.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-25'}>
                          {preview.fields.map((field) => (
                            <td key={field.id} className="px-4 py-2 text-gray-700">
                              {field.type === 'boolean' 
                                ? (row[field.name] ? 'Yes' : 'No')
                                : row[field.name]?.toString() || ''}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {preview.data.length > 5 && (
                  <p className="text-sm text-gray-600 mt-2">
                    ... and {preview.data.length - 5} more rows
                  </p>
                )}
              </div>

              {/* Import Actions */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                <button
                  onClick={() => setPreview(null)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium transition-colors"
                >
                  Upload Different File
                </button>
                <div className="flex items-center gap-3">
                  <button
                    onClick={onClose}
                    className="px-6 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleImport}
                    className="px-6 py-2 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-medium rounded-lg transition-all duration-200 transform hover:scale-105 shadow-lg"
                  >
                    Import Data
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};