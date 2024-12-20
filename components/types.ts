// Constants
export const DEPARTMENT_COLORS = {
  'Regie': '#FFB3BA',
  'Produktion': '#26E6F8',
  'Kamera': '#BAE1FF',
  'Ton': '#FFDA1F',
  'Schnitt': '#FFD9BA',
  'Szenenbild': '#F2782C',
  'Kostüm': '#FFBAED',
  'Maske': '#A47999',
  'Licht/Bühne': '#4125F9',
  'Sonstige': '#F0F0F0'
};

// Helper functions
export const formatCurrency = (salary: number): string => 
  `€${salary.toFixed(2).replace('.', ',')}`;

export const calculatePercentageChange = (baseSalary: number, newSalary: number): string => {
  if (newSalary === 0) return baseSalary > 0 ? '+Infinity' : '0';
  const percentageChange = ((newSalary - baseSalary) / baseSalary) * 100;
  return percentageChange === 0 
    ? '0' 
    : (percentageChange > 0 ? `+${percentageChange.toFixed(2)}` : percentageChange.toFixed(2));
};

export const getPercentageChangeColor = (change: string): string => 
  change === '0' 
    ? 'text-blue-500' 
    : change.startsWith('+') 
      ? 'text-green-500' 
      : 'text-red-500';

// Types
export interface Job {
  id: string;
  title: string;
  salary: number;
  department: string;
}

export interface Group {
  group: number;
  groupsalary: number;
  jobs: Job[];
}

export interface JobWithGroupSalary extends Job {
  groupSalary: number;
}

export interface DepartmentStats {
  department: string;
  min: number;
  max: number;
  avg: number;
}