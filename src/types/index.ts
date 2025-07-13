export interface Field {
  id: string;
  name: string;
  type: 'text' | 'number' | 'date' | 'email' | 'boolean';
  required?: boolean;
}

export interface TableRow {
  id: string;
  [key: string]: any;
}

export interface ChartConfig {
  type: 'bar' | 'line' | 'pie' | 'area';
  xAxis?: string;
  yAxis: string[];
  title?: string;
}

export type ChartData = {
  [key: string]: any;
};