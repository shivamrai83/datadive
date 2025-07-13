import React, { useState, useMemo } from 'react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { BarChart3, LineChart as LineChartIcon, PieChart as PieChartIcon, Activity, Palette } from 'lucide-react';
import { Field, TableRow, ChartConfig } from '../types';

interface ChartBuilderProps {
  fields: Field[];
  data: TableRow[];
}

export const ChartBuilder: React.FC<ChartBuilderProps> = ({ fields, data }) => {
  const [chartConfig, setChartConfig] = useState<ChartConfig>({
    type: 'bar',
    yAxis: [],
    title: 'My Chart'
  });

  const numericFields = fields.filter(field => field.type === 'number');
  const allFields = fields;

  const chartTypes = [
    { value: 'bar', label: 'Bar Chart', icon: BarChart3, color: 'from-blue-500 to-blue-600' },
    { value: 'line', label: 'Line Chart', icon: LineChartIcon, color: 'from-green-500 to-green-600' },
    { value: 'area', label: 'Area Chart', icon: Activity, color: 'from-purple-500 to-purple-600' },
    { value: 'pie', label: 'Pie Chart', icon: PieChartIcon, color: 'from-orange-500 to-orange-600' }
  ];

  const colors = [
    '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', 
    '#06B6D4', '#84CC16', '#F97316', '#EC4899', '#6366F1'
  ];

  const chartData = useMemo(() => {
    if (data.length === 0) return [];
    
    return data.map((row, index) => {
      const point: any = { index: index + 1 };
      
      // Add label field if specified
      if (chartConfig.xAxis && row[chartConfig.xAxis]) {
        point.label = row[chartConfig.xAxis];
      } else {
        point.label = `Row ${index + 1}`;
      }
      
      // Add numeric data
      chartConfig.yAxis.forEach(fieldName => {
        const value = row[fieldName];
        point[fieldName] = typeof value === 'number' ? value : 0;
      });
      
      return point;
    });
  }, [data, chartConfig]);

  const renderChart = () => {
    if (chartConfig.yAxis.length === 0) {
      return (
        <div className="h-80 flex items-center justify-center text-gray-500">
          <div className="text-center">
            <Palette className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p className="text-lg">Select fields to visualize</p>
            <p className="text-sm">Choose at least one numeric field to create a chart</p>
          </div>
        </div>
      );
    }

    const commonProps = {
      data: chartData,
      margin: { top: 20, right: 30, left: 20, bottom: 5 }
    };

    switch (chartConfig.type) {
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart {...commonProps}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="label" 
                stroke="#666"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis 
                stroke="#666"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'white', 
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
              />
              <Legend />
              {chartConfig.yAxis.map((fieldName, index) => (
                <Bar 
                  key={fieldName} 
                  dataKey={fieldName} 
                  fill={colors[index % colors.length]}
                  radius={[4, 4, 0, 0]}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        );

      case 'line':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart {...commonProps}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="label" 
                stroke="#666"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis 
                stroke="#666"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'white', 
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
              />
              <Legend />
              {chartConfig.yAxis.map((fieldName, index) => (
                <Line 
                  key={fieldName} 
                  type="monotone" 
                  dataKey={fieldName} 
                  stroke={colors[index % colors.length]}
                  strokeWidth={3}
                  dot={{ fill: colors[index % colors.length], strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, stroke: colors[index % colors.length], strokeWidth: 2 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        );

      case 'area':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <AreaChart {...commonProps}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="label" 
                stroke="#666"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis 
                stroke="#666"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'white', 
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
              />
              <Legend />
              {chartConfig.yAxis.map((fieldName, index) => (
                <Area 
                  key={fieldName} 
                  type="monotone" 
                  dataKey={fieldName} 
                  stackId="1"
                  stroke={colors[index % colors.length]}
                  fill={colors[index % colors.length]}
                  fillOpacity={0.6}
                />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        );

      case 'pie':
        const pieData = chartConfig.yAxis.length === 1 ? 
          chartData.map(item => ({
            name: item.label,
            value: item[chartConfig.yAxis[0]]
          })) : 
          chartConfig.yAxis.map((fieldName, index) => ({
            name: fieldName,
            value: chartData.reduce((sum, item) => sum + (item[fieldName] || 0), 0)
          }));

        return (
          <ResponsiveContainer width="100%" height={400}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={120}
                fill="#8884d8"
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'white', 
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        );

      default:
        return null;
    }
  };

  if (numericFields.length === 0) {
    return (
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-6">
          Chart Builder
        </h2>
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <BarChart3 className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-gray-500 text-lg">No numeric fields available</p>
          <p className="text-gray-400 text-sm">Add some numeric fields to create charts</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6">
      <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-6">
        Chart Builder
      </h2>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Chart Type Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">Chart Type</label>
          <div className="grid grid-cols-2 gap-2">
            {chartTypes.map((type) => {
              const Icon = type.icon;
              return (
                <button
                  key={type.value}
                  onClick={() => setChartConfig({ ...chartConfig, type: type.value as ChartConfig['type'] })}
                  className={`p-3 rounded-xl border-2 transition-all duration-200 ${
                    chartConfig.type === type.value
                      ? `bg-gradient-to-r ${type.color} text-white border-transparent shadow-lg`
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="w-5 h-5 mx-auto mb-1" />
                  <div className="text-xs font-medium">{type.label.split(' ')[0]}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* X-Axis Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">X-Axis (Label)</label>
          <select
            value={chartConfig.xAxis || ''}
            onChange={(e) => setChartConfig({ ...chartConfig, xAxis: e.target.value || undefined })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            <option value="">Row Index</option>
            {allFields.map(field => (
              <option key={field.id} value={field.name}>{field.name}</option>
            ))}
          </select>
        </div>

        {/* Y-Axis Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Y-Axis (Data) {chartConfig.type === 'pie' && '(Select one)'}
          </label>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {numericFields.map(field => (
              <label key={field.id} className="flex items-center gap-2 text-sm">
                <input
                  type={chartConfig.type === 'pie' ? 'radio' : 'checkbox'}
                  name={chartConfig.type === 'pie' ? 'yAxis' : undefined}
                  checked={chartConfig.yAxis.includes(field.name)}
                  onChange={(e) => {
                    if (chartConfig.type === 'pie') {
                      setChartConfig({ ...chartConfig, yAxis: e.target.checked ? [field.name] : [] });
                    } else {
                      const newYAxis = e.target.checked
                        ? [...chartConfig.yAxis, field.name]
                        : chartConfig.yAxis.filter(name => name !== field.name);
                      setChartConfig({ ...chartConfig, yAxis: newYAxis });
                    }
                  }}
                  className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                />
                {field.name}
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Chart Title */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">Chart Title</label>
        <input
          type="text"
          value={chartConfig.title || ''}
          onChange={(e) => setChartConfig({ ...chartConfig, title: e.target.value })}
          placeholder="Enter chart title..."
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
        />
      </div>

      {/* Chart Display */}
      <div className="bg-gradient-to-br from-gray-50 to-white rounded-xl p-6 border border-gray-200">
        {chartConfig.title && (
          <h3 className="text-xl font-bold text-center mb-6 text-gray-800">
            {chartConfig.title}
          </h3>
        )}
        {renderChart()}
      </div>

      {data.length === 0 && (
        <div className="text-center py-8 mt-6">
          <p className="text-gray-500">No data available for charting</p>
          <p className="text-gray-400 text-sm">Add some data to your table to see charts</p>
        </div>
      )}
    </div>
  );
};