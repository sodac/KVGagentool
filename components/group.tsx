"use client";
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { JobEditDialog } from './job-edit-dialog';
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
  onUpdateJob: (jobId: string, updatedJob: Job, groupId?: number) => void;
  onDeleteJob: (jobId: string) => void;
  visibleDepartments: string[];
  isOdd?: boolean;
  showSalaries: boolean;
}

const GroupComponent: React.FC<GroupComponentProps> = ({
  group,
  jobs,
  onDragOver,
  onDrop,
  onGroupSalaryChange,
  onDeleteGroup,
  onUpdateJob,
  onDeleteJob,
  visibleDepartments,
  isOdd,
  showSalaries
}) => {
  const [localSalary, setLocalSalary] = useState(group.groupsalary.toFixed(2));
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [isJobDialogOpen, setIsJobDialogOpen] = useState(false);

  useEffect(() => {
    setLocalSalary(group.groupsalary.toFixed(2));
  }, [group.groupsalary]);

  const handleSalaryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalSalary(e.target.value);
  };

  const handleSalaryFocus = () => {
    setLocalSalary(parseFloat(localSalary).toString());
  };

  const handleSalaryBlur = () => {
    const value = parseFloat(localSalary) || 0;
    setLocalSalary(value.toFixed(2));
    onGroupSalaryChange(group.group, value);
  };

  // Filter jobs by visible departments and sort by salary (undefined salaries at the end)
  const visibleJobs = jobs
    .filter(job => visibleDepartments.includes(job.department))
    .sort((a, b) => {
      if (a.salary === undefined && b.salary === undefined) return 0;
      if (a.salary === undefined) return 1;
      if (b.salary === undefined) return -1;
      return b.salary - a.salary;
    });

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
            {showSalaries ? (
              <>
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
              </>
            ) : (
              <div className="w-28 h-8 bg-gray-100 rounded-md"></div>
            )}
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
          <div className="flex flex-wrap items-center">
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
  onClick={() => {
    setSelectedJob(job);
    setIsJobDialogOpen(true);
  }}
  className="flex items-center space-x-3 px-3 py-1.5 cursor-pointer min-w-64 m-1 rounded-full border-2 bg-white shadow-sm transition-all hover:shadow-md hover:scale-[1.02] hover:bg-gray-50"
  style={{ 
    borderColor: DEPARTMENT_COLORS[job.department] || DEPARTMENT_COLORS['Sonstige'],
    opacity: 0.9,
  }}
>
                    <div className="font-medium text-sm truncate flex-1">
                      {job.title}
                    </div>
                    {showSalaries && (
                      <>
                        <div className="text-sm text-gray-600 whitespace-nowrap">
                          {formatCurrency(job.salary)}
                        </div>
                        <div className={`text-sm font-medium whitespace-nowrap ${changeColor}`}>
                          {percentageChange}%
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            {/* Add new job button */}
            <button
              onClick={() => {
                const newJob: Job = {
                  id: crypto.randomUUID(),
                  title: '',
                  department: 'Sonstige',
                };
                setSelectedJob(newJob);
                setIsJobDialogOpen(true);
              }}
              className="flex items-center justify-center w-8 h-8 rounded-full border-2 border-gray-300 hover:border-gray-400 hover:bg-gray-50 transition-colors ml-2"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className="w-4 h-4 text-gray-500"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Job Edit Dialog */}
      <JobEditDialog
        job={selectedJob}
        isOpen={isJobDialogOpen}
        onClose={() => {
          setIsJobDialogOpen(false);
          setSelectedJob(null);
        }}
        onSave={(updatedJob) => {
          // For new jobs, add them to the current group's jobs
          if (!jobs.some(job => job.id === updatedJob.id)) {
            const jobToAdd = {
              ...updatedJob,
              salary: updatedJob.salary === 0 ? undefined : updatedJob.salary
            };
            onUpdateJob(jobToAdd.id, jobToAdd, group.group);
          } else {
            onUpdateJob(updatedJob.id, updatedJob);
          }
        }}
        onDelete={(jobId) => {
          onDeleteJob(jobId);
        }}
      />
    </div>
  );
};

export default GroupComponent;
