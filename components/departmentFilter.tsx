"use client";
import React from 'react';
import { DEPARTMENT_COLORS } from './types';

interface DepartmentFilterProps {
  selectedDepartments: string[];
  onToggleDepartment: (department: string) => void;
}

const DepartmentFilter: React.FC<DepartmentFilterProps> = ({
  selectedDepartments,
  onToggleDepartment
}) => {
  return (
    <div className="mb-4 flex flex-wrap gap-2">
      {Object.entries(DEPARTMENT_COLORS).map(([department, color]) => (
        <button
          key={department}
          onClick={() => onToggleDepartment(department)}
          className={`
            px-3 py-1.5 rounded-full text-sm font-medium 
            transition-colors duration-150 flex items-center gap-2
            ${selectedDepartments.includes(department) 
              ? 'bg-white border-2 shadow-sm' 
              : 'bg-gray-100 border-2 border-transparent opacity-50'
            }
          `}
          style={{ 
            borderColor: selectedDepartments.includes(department) ? color : 'transparent',
            color: selectedDepartments.includes(department) ? 'inherit' : 'gray'
          }}
        >
          <div 
            className="w-3 h-3 rounded-full" 
            style={{ backgroundColor: color }} 
          />
          {department}
        </button>
      ))}
    </div>
  );
};

export default DepartmentFilter;