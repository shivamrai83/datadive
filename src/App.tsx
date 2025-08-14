import React, { useState, useEffect } from 'react';
import { Database, BarChart3, Table as TableIcon } from 'lucide-react';
import { LoginPage } from './components/LoginPage';
import { FieldBuilder } from './components/FieldBuilder';
import { DataTable } from './components/DataTable';
import { ChartBuilder } from './components/ChartBuilder';
import { Field, TableRow } from './types';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [fields, setFields] = useState<Field[]>([]);
  const [data, setData] = useState<TableRow[]>([]);
  const [activeTab, setActiveTab] = useState<'fields' | 'table' | 'charts'>('fields');

  // Check for existing authentication on mount
  useEffect(() => {
    const authStatus = localStorage.getItem('dynamicApp_authenticated');
    if (authStatus === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  // Load data from localStorage on mount (only when authenticated)
  useEffect(() => {
    if (!isAuthenticated) return;

    const savedFields = localStorage.getItem('dynamicApp_fields');
    const savedData = localStorage.getItem('dynamicApp_data');
    
    if (savedFields) {
      try {
        setFields(JSON.parse(savedFields));
      } catch (error) {
        console.error('Error loading fields:', error);
      }
    }
    
    if (savedData) {
      try {
        setData(JSON.parse(savedData));
      } catch (error) {
        console.error('Error loading data:', error);
      }
    }
  }, [isAuthenticated]);

  // Save data to localStorage when fields or data change
  useEffect(() => {
    if (!isAuthenticated) return;
    localStorage.setItem('dynamicApp_fields', JSON.stringify(fields));
  }, [fields, isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) return;
    localStorage.setItem('dynamicApp_data', JSON.stringify(data));
  }, [data, isAuthenticated]);

  const handleLogin = (username: string, password: string) => {
    // Simple demo authentication - in production, this would be a real API call
    if (username === 'demo' && password === 'password') {
      setIsAuthenticated(true);
      localStorage.setItem('dynamicApp_authenticated', 'true');
    } else {
      alert('Invalid credentials. Please use demo/password');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('dynamicApp_authenticated');
    // Optionally clear data
    // localStorage.removeItem('dynamicApp_fields');
    // localStorage.removeItem('dynamicApp_data');
  };

  if (!isAuthenticated) {
    return <LoginPage onLogin={handleLogin} />;
  }

  const tabs = [
    { id: 'fields', label: 'Fields', icon: Database, count: fields.length },
    { id: 'table', label: 'Data', icon: TableIcon, count: data.length },
    { id: 'charts', label: 'Charts', icon: BarChart3, count: fields.filter(f => f.type === 'number').length }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-white/20 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                <Database className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Data Dive
                </h1>
                <p className="text-sm text-gray-600">Create, analyze, and visualize your data</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              {/* Tab Navigation */}
              <nav className="flex items-center gap-1 bg-gray-100 rounded-xl p-1">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as typeof activeTab)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                        activeTab === tab.id
                          ? 'bg-white text-blue-600 shadow-sm'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {tab.label}
                      {tab.count > 0 && (
                        <span className={`px-2 py-0.5 rounded-full text-xs ${
                          activeTab === tab.id
                            ? 'bg-blue-100 text-blue-600'
                            : 'bg-gray-200 text-gray-600'
                        }`}>
                          {tab.count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </nav>

              {/* Logout Button */}
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all duration-200"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {activeTab === 'fields' && (
            <FieldBuilder 
              fields={fields} 
              onFieldsChange={setFields}
              onDataImport={(importedFields, importedData) => {
                setFields(importedFields);
                setData(importedData);
              }}
            />
          )}
          
          {activeTab === 'table' && (
            <DataTable 
              fields={fields} 
              data={data} 
              onDataChange={setData}
              onFieldsChange={setFields}
            />
          )}
          
          {activeTab === 'charts' && (
            <ChartBuilder fields={fields} data={data} />
          )}
        </div>
      </div>

      {/* Footer */}
      {/* <footer className="bg-white/60 backdrop-blur-sm border-t border-white/20 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center text-gray-600">
            <p className="text-sm">
              Built with React, TypeScript, and Recharts • Data persisted locally
            </p>
          </div>
        </div>
      </footer> */}
    </div>
  );
}

export default App;