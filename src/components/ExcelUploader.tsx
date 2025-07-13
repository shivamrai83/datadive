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
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-[9999]"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Rest of your component JSX */}
      </div>
    </div>
  );
};