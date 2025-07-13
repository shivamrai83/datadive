import React, { useState } from 'react';
import { Plus, Edit3, Trash2, Check, X, Save } from 'lucide-react';
import { Field, TableRow } from '../types';

interface DataTableProps {
  fields: Field[];
  data: TableRow[];
  onDataChange: (data: TableRow[]) => void;
}

export const DataTable: React.FC<DataTableProps> = ({ fields, data, onDataChange }) => {
  const [editingRowId, setEditingRowId] = useState<string | null>(null);
  const [isAddingRow, setIsAddingRow] = useState(false);
  const [newRow, setNewRow] = useState<Record<string, any>>({});

  const addRow = () => {
    const row: TableRow = {
      id: Date.now().toString(),
      ...fields.reduce((acc, field) => ({
        ...acc,
        [field.name]: newRow[field.name] || getDefaultValue(field.type)
      }), {})
    };
    onDataChange([...data, row]);
    setNewRow({});
    setIsAddingRow(false);
  };

  const updateRow = (rowId: string, updatedData: Record<string, any>) => {
    onDataChange(data.map(row => 
      row.id === rowId ? { ...row, ...updatedData } : row
    ));
    setEditingRowId(null);
  };

  const deleteRow = (rowId: string) => {
    onDataChange(data.filter(row => row.id !== rowId));
  };

  const getDefaultValue = (type: Field['type']) => {
    switch (type) {
      case 'number': return 0;
      case 'boolean': return false;
      case 'date': return '';
      default: return '';
    }
  };

  const formatCellValue = (value: any, type: Field['type']) => {
    if (value === null || value === undefined) return '';
    
    switch (type) {
      case 'boolean': return value ? 'Yes' : 'No';
      case 'date': return value ? new Date(value).toLocaleDateString() : '';
      case 'number': return typeof value === 'number' ? value.toLocaleString() : value;
      default: return value.toString();
    }
  };

  const renderCellInput = (field: Field, value: any, onChange: (value: any) => void) => {
    switch (field.type) {
      case 'boolean':
        return (
          <select
            value={value ? 'true' : 'false'}
            onChange={(e) => onChange(e.target.value === 'true')}
            className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="false">No</option>
            <option value="true">Yes</option>
          </select>
        );
      case 'number':
        return (
          <input
            type="number"
            value={value || ''}
            onChange={(e) => onChange(e.target.value ? parseFloat(e.target.value) : 0)}
            className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        );
      case 'date':
        return (
          <input
            type="date"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        );
      case 'email':
        return (
          <input
            type="email"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        );
      default:
        return (
          <input
            type="text"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        );
    }
  };

  if (fields.length === 0) {
    return (
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent mb-6">
          Data Table
        </h2>
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gradient-to-br from-green-100 to-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Save className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-gray-500 text-lg">No fields defined</p>
          <p className="text-gray-400 text-sm">Create some fields first to start entering data</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
          Data Table
        </h2>
        <button
          onClick={() => setIsAddingRow(true)}
          className="inline-flex items-center gap-2 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-medium py-2 px-4 rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl"
        >
          <Plus className="w-4 h-4" />
          Add Row
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gradient-to-r from-gray-50 to-gray-100">
              {fields.map((field) => (
                <th
                  key={field.id}
                  className="px-4 py-3 text-left font-semibold text-gray-900 border-b-2 border-gray-200 first:rounded-tl-xl last:rounded-tr-xl"
                >
                  <div className="flex items-center gap-2">
                    {field.name}
                    {field.required && (
                      <span className="text-red-500 text-sm">*</span>
                    )}
                  </div>
                </th>
              ))}
              <th className="px-4 py-3 text-right font-semibold text-gray-900 border-b-2 border-gray-200 rounded-tr-xl">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {data.map((row, rowIndex) => (
              <tr
                key={row.id}
                className={`hover:bg-gray-50 transition-colors ${
                  rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-25'
                }`}
              >
                {fields.map((field) => (
                  <td key={field.id} className="px-4 py-3 border-b border-gray-200">
                    {editingRowId === row.id ? (
                      renderCellInput(field, row[field.name], (value) => {
                        updateRow(row.id, { [field.name]: value });
                      })
                    ) : (
                      <div className="min-h-[1.5rem] flex items-center">
                        {formatCellValue(row[field.name], field.type)}
                      </div>
                    )}
                  </td>
                ))}
                <td className="px-4 py-3 border-b border-gray-200">
                  <div className="flex items-center justify-end gap-2">
                    {editingRowId === row.id ? (
                      <button
                        onClick={() => setEditingRowId(null)}
                        className="p-1 text-green-600 hover:bg-green-50 rounded transition-colors"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                    ) : (
                      <button
                        onClick={() => setEditingRowId(row.id)}
                        className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => deleteRow(row.id)}
                      className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {isAddingRow && (
              <tr className="bg-gradient-to-r from-green-50 to-blue-50 animate-in slide-in-from-top-2 duration-200">
                {fields.map((field) => (
                  <td key={field.id} className="px-4 py-3 border-b-2 border-dashed border-green-300">
                    {renderCellInput(field, newRow[field.name], (value) => {
                      setNewRow({ ...newRow, [field.name]: value });
                    })}
                  </td>
                ))}
                <td className="px-4 py-3 border-b-2 border-dashed border-green-300">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={addRow}
                      className="p-1 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        setIsAddingRow(false);
                        setNewRow({});
                      }}
                      className="p-1 text-gray-600 hover:bg-gray-100 rounded transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {data.length === 0 && !isAddingRow && (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gradient-to-br from-green-100 to-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Plus className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-gray-500 text-lg">No data yet</p>
          <p className="text-gray-400 text-sm">Add your first row to start building your dataset</p>
        </div>
      )}
    </div>
  );
};