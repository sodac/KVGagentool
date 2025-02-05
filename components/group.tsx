"use client";
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Group, 
  Job, 
  formatCurrency, 
  calculatePercentageChange, 
  getPercentageChangeColor,
  DEPARTMENT_COLORS 
} from './types';

interface GroupComponentProps {
  group: Group;
  jobs: Job[];
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent, groupNumber: number) => void;
  onGroupSalaryChange: (groupNumber: number, salary: number) => void;
  onDeleteGroup: (groupNumber: number) => void;
  visibleDepartments: string[];
  isOdd?: boolean;
}

const GroupComponent: React.FC<GroupComponentProps> = ({
  group,
  jobs,
  onDragOver,
  onDrop,
  onGroupSalaryChange,
  onDeleteGroup,
  visibleDepartments,
  isOdd
}) => {
  const [localSalary, setLocalSalary] = useState(group.groupsalary.toFixed(2));
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    setLocalSalary(group.groupsalary.toFixed(2));
  }, [group.groupsalary]);

  const handleSalaryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalSalary(e.target.value);
  };

  const handleSalaryFocus = () => {
    setIsEditing(true);
    setLocalSalary(parseFloat(localSalary).toString());
  };

  const handleSalaryBlur = () => {
    setIsEditing(false);
    const value = parseFloat(localSalary) || 0;
    setLocalSalary(value.toFixed(2));
    onGroupSalaryChange(group.group, value);
  };

  // Filter jobs by visible departments and sort by salary
  const visibleJobs = jobs
    .filter(job => visibleDepartments.includes(job.department))
    .sort((a, b) => b.salary - a.salary);

  return (
    <div 
    className={`mb-2 ${isOdd ? 'bg-gray-50' : 'bg-white'}`}
    onDragOver={onDragOver}
    onDrop={(e) => onDrop(e, group.group)}
  >
      <div className="flex items-center min-h-12 border-b">
        {/* Group Info */}
        <div className="flex items-center space-x-4 min-w-48 px-4 py-1 border-r">
          <span className="font-medium whitespace-nowrap">Gruppe {group.group}</span>
          <div className="relative">
            <Input
              type="number"
              value={localSalary}
              onFocus={handleSalaryFocus}
              onChange={handleSalaryChange}
              onBlur={handleSalaryBlur}
              className="w-28 h-8 pl-6 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              step="0.01"
            />
            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500">€</span>
          </div>
          {jobs.length === 0 && (
            <Button 
              onClick={() => onDeleteGroup(group.group)} 
              variant="destructive" 
              size="sm"
              className="h-7"
            >
              Delete
            </Button>
          )}
        </div>

        {/* Jobs */}
        <div className="flex-1 overflow-x-auto p-1">
          {visibleJobs.length > 0 ? (
            <div className="flex flex-wrap">
              {visibleJobs.map(job => {
                const percentageChange = calculatePercentageChange(job.salary, group.groupsalary);
                const changeColor = getPercentageChangeColor(percentageChange);
                
                return (
                  <div 
  key={job.id}
  draggable
  onDragStart={(e) => {
    e.dataTransfer.setData(
      'application/json',
      JSON.stringify(job)
    );
  }}
  className="flex items-center space-x-3 px-3 py-1.5 cursor-move min-w-64 m-1 rounded-full border-2 bg-white shadow-sm transition-all hover:shadow-md hover:scale-[1.02] hover:bg-gray-50"
  style={{ 
    borderColor: DEPARTMENT_COLORS[job.department] || DEPARTMENT_COLORS['Sonstige'],
    opacity: 0.9,
  }}
>
                    <div className="font-medium text-sm truncate flex-1">
                      {job.title}
                    </div>
                    <div className="text-sm text-gray-600 whitespace-nowrap">
                      {formatCurrency(job.salary)}
                    </div>
                    <div className={`text-sm font-medium whitespace-nowrap ${changeColor}`}>
                      {percentageChange}%
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="px-4 py-2 text-sm text-gray-500">
              {jobs.length === 0 ? 'Ziehen Sie Positionen in diese Gruppe' : 'Keine sichtbaren Positionen in dieser Gruppe'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GroupComponent;
