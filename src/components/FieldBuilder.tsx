import React, { useState } from 'react';
import { Plus, X, Edit3, GripVertical, Check, AlertCircle, Upload } from 'lucide-react';
import { Field } from '../types';
import { ExcelUploader } from './ExcelUploader';
import { TableRow } from '../types';

interface FieldBuilderProps {
  fields: Field[];
  onFieldsChange: (fields: Field[]) => void;
  onDataImport?: (fields: Field[], data: TableRow[]) => void;
}

export const FieldBuilder: React.FC<FieldBuilderProps> = ({ fields, onFieldsChange, onDataImport }) => {
  const [isAddingField, setIsAddingField] = useState(false);
  const [editingFieldId, setEditingFieldId] = useState<string | null>(null);
  const [showExcelUploader, setShowExcelUploader] = useState(false);
  const [newField, setNewField] = useState<Omit<Field, 'id'>>({
    name: '',
    type: 'text',
    required: false
  });

  const fieldTypes = [
    { value: 'text', label: 'Text' },
    { value: 'number', label: 'Number' },
    { value: 'date', label: 'Date' },
    { value: 'email', label: 'Email' },
    { value: 'boolean', label: 'Yes/No' }
  ];

  const addField = () => {
    if (newField.name.trim()) {
      const field: Field = {
        id: Date.now().toString(),
        ...newField,
        name: newField.name.trim()
      };
      onFieldsChange([...fields, field]);
      setNewField({ name: '', type: 'text', required: false });
      setIsAddingField(false);
    }
  };

  const updateField = (id: string, updatedField: Partial<Field>) => {
    onFieldsChange(fields.map(field => 
      field.id === id ? { ...field, ...updatedField } : field
    ));
    setEditingFieldId(null);
  };

  const removeField = (id: string) => {
    onFieldsChange(fields.filter(field => field.id !== id));
  };

  const moveField = (fromIndex: number, toIndex: number) => {
    const updatedFields = [...fields];
    const [movedField] = updatedFields.splice(fromIndex, 1);
    updatedFields.splice(toIndex, 0, movedField);
    onFieldsChange(updatedFields);
  };

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Field Builder
        </h2>
        <div className="flex items-center gap-3">
          {onDataImport && (
            <button
              onClick={() => setShowExcelUploader(true)}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-medium py-2 px-4 rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl"
            >
              <Upload className="w-4 h-4" />
              Import Excel
            </button>
          )}
          <button
            onClick={() => setIsAddingField(true)}
            className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-medium py-2 px-4 rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl"
          >
            <Plus className="w-4 h-4" />
            Add Field
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {fields.map((field, index) => (
          <div
            key={field.id}
            className="group bg-gradient-to-r from-gray-50 to-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-all duration-200"
          >
            <div className="flex items-center gap-3">
              <GripVertical className="w-5 h-5 text-gray-400 cursor-grab group-hover:text-gray-600 transition-colors" />
              
              {editingFieldId === field.id ? (
                <div className="flex-1 flex items-center gap-3">
                  <input
                    type="text"
                    value={field.name}
                    onChange={(e) => updateField(field.id, { name: e.target.value })}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <select
                    value={field.type}
                    onChange={(e) => updateField(field.id, { type: e.target.value as Field['type'] })}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {fieldTypes.map(type => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                  <button
                    onClick={() => setEditingFieldId(null)}
                    className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">{field.name}</span>
                      <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
                        {fieldTypes.find(t => t.value === field.type)?.label}
                      </span>
                      {field.required && (
                        <span className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded-full flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          Required
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => setEditingFieldId(field.id)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => removeField(field.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        ))}

        {isAddingField && (
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-dashed border-blue-300 rounded-xl p-4 animate-in slide-in-from-top-2 duration-200">
            <div className="flex items-center gap-3">
              <input
                type="text"
                placeholder="Field name..."
                value={newField.name}
                onChange={(e) => setNewField({ ...newField, name: e.target.value })}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                autoFocus
              />
              <select
                value={newField.type}
                onChange={(e) => setNewField({ ...newField, type: e.target.value as Field['type'] })}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {fieldTypes.map(type => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={newField.required}
                  onChange={(e) => setNewField({ ...newField, required: e.target.checked })}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                Required
              </label>
              <button
                onClick={addField}
                disabled={!newField.name.trim()}
                className="p-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Check className="w-4 h-4" />
              </button>
              <button
                onClick={() => {
                  setIsAddingField(false);
                  setNewField({ name: '', type: 'text', required: false });
                }}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {fields.length === 0 && !isAddingField && (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Plus className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-gray-500 text-lg">No fields yet</p>
          <p className="text-gray-400 text-sm">Add your first field to get started</p>
        </div>
      )}

      {/* Excel Uploader Modal */}
      {showExcelUploader && onDataImport && (
        <ExcelUploader
          onDataImport={(importedFields, importedData) => {
            onDataImport(importedFields, importedData);
            setShowExcelUploader(false);
          }}
          onClose={() => setShowExcelUploader(false)}
        />
      )}
    </div>
  );
};