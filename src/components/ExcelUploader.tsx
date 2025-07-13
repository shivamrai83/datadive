import React, { useRef, useState } from 'react';
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle, X, Download } from 'lucide-react';
import { Field, TableRow } from '../types';

import * as XLSX from 'xlsx';

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

  return (
    <div 
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-blue-600 rounded-xl flex items-center justify-center">
              <FileSpreadsheet className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Import Excel File</h2>
              <p className="text-sm text-gray-600">Upload your Excel file to automatically create fields and import data</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 max-h-[calc(90vh-120px)] overflow-y-auto">
          {!preview ? (
            <>
              {/* Upload Area */}
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                className={`border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 ${
                  isDragging
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <div className="flex flex-col items-center gap-4">
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
                    isDragging ? 'bg-blue-100' : 'bg-gray-100'
                  }`}>
                    <Upload className={`w-8 h-8 ${isDragging ? 'text-blue-600' : 'text-gray-400'}`} />
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Upload Excel File</h3>
                    <p className="text-gray-600 mb-4">
                      Drag and drop your Excel file here, or click to browse
                    </p>
                    
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isProcessing}
                      className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <FileSpreadsheet className="w-4 h-4" />
                      Choose File
                    </button>
                    
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".xlsx,.xls,.csv"
                      onChange={handleFileInputChange}
                      className="hidden"
                    />
                  </div>
                  
                  <p className="text-sm text-gray-500">
                    Supported formats: .xlsx, .xls, .csv (Max 10MB)
                  </p>
                </div>
              </div>

              {/* Template Download */}
              <div className="mt-6 p-4 bg-gray-50 rounded-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-1">Need a template?</h4>
                    <p className="text-sm text-gray-600">Download our sample Excel template to see the expected format</p>
                  </div>
                  <button
                    onClick={() => {
                      // Create sample Excel file
                      const sampleData = [
                        ['Name', 'Age', 'Email', 'Active', 'Join Date'],
                        ['John Doe', 30, 'john@example.com', 'Yes', '2024-01-15'],
                        ['Jane Smith', 25, 'jane@example.com', 'No', '2024-02-20']
                      ];
                      
                      const ws = XLSX.utils.aoa_to_sheet(sampleData);
                      const wb = XLSX.utils.book_new();
                      XLSX.utils.book_append_sheet(wb, ws, 'Sample Data');
                      XLSX.writeFile(wb, 'data-dive-template.xlsx');
                    }}
                    className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                  >
              {/* Instructions */}
              <div className="mt-6 p-4 bg-blue-50 rounded-xl">
                <h4 className="font-medium text-blue-900 mb-2">Instructions:</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-blue-600 rounded-full"></div>
                    First row should contain column headers (field names)
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-blue-600 rounded-full"></div>
                    Data types will be automatically detected (text, number, date, email, boolean)
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-blue-600 rounded-full"></div>
                    Dates should be in standard format (MM/DD/YYYY or YYYY-MM-DD)
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-blue-600 rounded-full"></div>
                    Boolean values can be Yes/No, True/False, or Y/N
                  </li>
                </ul>
              </div>
                    <Download className="w-4 h-4" />
              {/* Processing State */}
              {isProcessing && (
                <div className="mt-6 p-4 bg-yellow-50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 border-2 border-yellow-600 border-t-transparent rounded-full animate-spin"></div>
                    <div>
                      <p className="font-medium text-yellow-900">Processing your file...</p>
                      <p className="text-sm text-yellow-700">This may take a moment for large files</p>
                    </div>
                  </div>
                </div>
              )}
                    Download Template
              {/* Error State */}
              {error && (
                <div className="mt-6 p-4 bg-red-50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-red-900">Upload Error</p>
                      <p className="text-sm text-red-700">{error}</p>
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            /* Preview Section */
            <div className="space-y-6">
              <div className="flex items-center gap-3 p-4 bg-green-50 rounded-xl">
                <CheckCircle className="w-6 h-6 text-green-600" />
                <div>
                  <p className="font-medium text-green-900">File processed successfully!</p>
                  <p className="text-sm text-green-700">
                    Found {preview.fields.length} fields and {preview.data.length} rows
                  </p>
                </div>
              </div>
                  </button>
              {/* Fields Preview */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Detected Fields:</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {preview.fields.map((field) => (
                    <div key={field.id} className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-gray-900">{field.name}</span>
                        <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
                          {field.type}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
                </div>
              {/* Data Preview */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Data Preview (first 5 rows):</h4>
                <div className="overflow-x-auto">
                  <table className="w-full border border-gray-200 rounded-lg">
                    <thead className="bg-gray-50">
                      <tr>
                        {preview.fields.map((field) => (
                          <th key={field.id} className="px-3 py-2 text-left text-sm font-medium text-gray-900 border-b border-gray-200">
                            {field.name}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {preview.data.slice(0, 5).map((row, index) => (
                        <tr key={row.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-25'}>
                          {preview.fields.map((field) => (
                            <td key={field.id} className="px-3 py-2 text-sm text-gray-900 border-b border-gray-200">
                              {row[field.name]?.toString() || ''}
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
              </div>
              {/* Import Actions */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                <button
                  onClick={() => {
                    setPreview(null);
                    setError(null);
                  }}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium transition-colors"
                >
                  ← Back to Upload
                </button>
                <div className="flex items-center gap-3">
                  <button
                    onClick={onClose}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleImport}
                    className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-6 rounded-lg transition-colors"
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