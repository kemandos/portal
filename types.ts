export interface Allocation {
  hours: number;
  total: number;
  status: 'optimal' | 'over' | 'under' | 'empty';
}

export interface Resource {
  id: string;
  name: string;
  subtext: string;
  avatar?: string;
  initials?: string;
  type: 'project' | 'employee' | 'group';
  status?: 'Active' | 'At Risk' | 'Paused' | 'Planning' | 'On Track';
  color?: string; // For project dots
  manager?: string; // Managing Consultant / Team Lead
  department?: string; // Engineering, Design, Product
  skills?: string[]; // React, Node, UX, etc.
  allocations: Record<string, Allocation>; // Key is Month string e.g. "Jan '24"
  children?: Resource[]; // For nested rows like Dealfolders or Projects under Employees
  assignments?: Resource[]; // For employees assigned to a project
  isExpanded?: boolean;
}

export type TimeRange = '3M' | '6M' | '9M';

export interface ViewState {
  mode: 'People' | 'Projects';
  timeRange: TimeRange;
  selectedIds: string[];
}

export interface CellCoordinate {
  resourceId: string;
  monthIndex: number;
  rowIndex: number;
}

export interface SelectionRange {
  start: CellCoordinate;
  end: CellCoordinate;
}

export interface ThemeSettings {
  mode: 'light' | 'dark';
  colorTheme: 'rose' | 'blue' | 'emerald' | 'violet' | 'custom';
  customColor?: string;
  cellStyle: 'modern' | 'classic' | 'minimal';
  heatmapOpacity?: number; // 0 to 1
  thresholdColors?: {
    under: string;
    balanced: string;
    optimal: string;
    over: string;
  };
  thresholds?: {
    under: number;    // Percentage (e.g. 50)
    balanced: number; // Percentage (e.g. 90)
    over: number;     // Percentage (e.g. 110)
  };
}

export interface Filter {
  key: string;
  values: string[];
}