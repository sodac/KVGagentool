"use client";
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { PlusCircle, FileUp, Download, Eye, EyeOff, FileSpreadsheet } from 'lucide-react';
import { Group, Job, DepartmentName,DEPARTMENT_COLORS } from './types';
import GroupComponent from './group';
import DepartmentFilter from './departmentFilter';

interface ImportedJob {
  id: string;
  title: string;
  salary: string | number | undefined;
  department: DepartmentName;
}

interface ImportedGroup {
  group: number;
  groupsalary: string | number;
  jobs: ImportedJob[];
}

const GagengruppenTool: React.FC = () => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [needsReordering, setNeedsReordering] = useState(false);
  const [selectedDepartments, setSelectedDepartments] = useState<string[]>(
    Object.keys(DEPARTMENT_COLORS)
  );
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [exportFilename, setExportFilename] = useState('');
  const [salaryMode, setSalaryMode] = useState<'60h' | '40h'>('40h');
  const [showSalaries, setShowSalaries] = useState(true);

  const convertSalary = (salary: number | undefined, to: '40h' | '60h') => {
    if (salary === undefined) return undefined;
    if (to === '60h') {
      return salary / 0.560524819952065;
    }
    return salary; // Return base wage (40h) as is
  };

  // Reorder groups when needed
  useEffect(() => {
    if (needsReordering) {
      const sortedGroups = [...groups]
        .sort((a, b) => b.groupsalary - a.groupsalary)
        .map((g, i) => ({ ...g, group: i + 1 }));
      setGroups(sortedGroups);
      setNeedsReordering(false);
    }
  }, [needsReordering, groups]);

  // Handle file import button click
  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = JSON.parse(e.target?.result as string);
        let importedGroups: Group[];

        if (Array.isArray(content)) {
          importedGroups = content.map((g: ImportedGroup) => ({
            ...g,
            groupsalary: parseFloat(g.groupsalary.toString()),
            jobs: g.jobs.map((j: ImportedJob) => ({
              id: j.id,
              title: j.title,
              department: j.department as DepartmentName,
              salary: j.salary !== undefined ? parseFloat(j.salary.toString()) : undefined
            }))
          }));
        } else if (content.groups) {
          importedGroups = content.groups.map((g: ImportedGroup) => ({
            ...g,
            groupsalary: parseFloat(g.groupsalary.toString()),
            jobs: g.jobs.map((j: ImportedJob) => ({
              id: j.id,
              title: j.title,
              department: j.department as DepartmentName,
              salary: j.salary !== undefined ? parseFloat(j.salary.toString()) : undefined
            }))
          }));
        } else {
          throw new Error('Invalid JSON structure');
        }

        setGroups(importedGroups);
        setNeedsReordering(true);

        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      } catch (error) {
        console.error("Error parsing JSON:", error);
        alert("Error parsing JSON file. Please check the format.");
      }
    };
    reader.readAsText(file);
  };

  // Export handling
  const handleExportClick = () => {
    setExportFilename('');
    setIsExportDialogOpen(true);
  };

  const handleExport = async () => {
    if (!exportFilename) return;
    
    const exportData = {
      groups: groups.map(({ group, groupsalary, jobs }) => ({
        group,
        groupsalary: groupsalary.toFixed(2),
        jobs: jobs.map(({ id, title, salary, department }) => ({
          id,
          title,
          salary: salary !== undefined ? salary.toFixed(2) : undefined,
          department
        }))
      }))
    };
    
    const jsonString = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = exportFilename.endsWith('.json') ? exportFilename : `${exportFilename}.json`;
    document.body.appendChild(link);
    link.click();
    
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setIsExportDialogOpen(false);
    setExportFilename('');
  };

  const handleExcelExport = async () => {
    try {
      const exportData = {
        groups: groups.map(({ group, groupsalary, jobs }) => ({
          group,
          groupsalary: groupsalary.toFixed(2),
          jobs: jobs.map(({ id, title, salary, department }) => ({
            id,
            title,
            salary: salary !== undefined ? salary.toFixed(2) : undefined,
            department
          }))
        }))
      };

      const response = await fetch('/api/export-excel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(exportData),
      });

      if (!response.ok) throw new Error('Failed to generate Excel file');

      // Get the blob from the response
      const blob = await response.blob();
      
      // Create a download link
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'Gagengruppen_2025.xlsx';
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting Excel:', error);
      alert('Failed to generate Excel file');
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = useCallback((e: React.DragEvent, groupId: number) => {
    e.preventDefault();
    const job = JSON.parse(e.dataTransfer.getData('application/json')) as Job;
    
    setGroups(currentGroups => 
      currentGroups.map(group => {
        if (group.group === groupId) {
          if (group.jobs.some(j => j.id === job.id)) {
            return group;
          }
          return {
            ...group,
            jobs: [...group.jobs, job].sort((a, b) => {
              if (a.salary === undefined && b.salary === undefined) return 0;
              if (a.salary === undefined) return 1;
              if (b.salary === undefined) return -1;
              return b.salary - a.salary;
            })
          };
        }
        return {
          ...group,
          jobs: group.jobs.filter(j => j.id !== job.id)
        };
      })
    );
  }, []);

  const handleToggleDepartment = (department: string) => {
    setSelectedDepartments(prev => 
      prev.includes(department)
        ? prev.filter(d => d !== department)
        : [...prev, department]
    );
  };

  const addNewGroup = () => {
    setGroups(currentGroups => {
      // Create a new array with all groups plus the new one
      const allGroups = [{
        group: 1, // Temporary number, will be updated
        groupsalary: 5000,
        jobs: []
      }, ...currentGroups];
      
      // Renumber all groups from top to bottom
      return allGroups.map((group, index) => ({
        ...group,
        group: index + 1
      }));
    });
  };

  const handleGroupSalaryChange = (groupId: number, salary: number) => {
    // If we're in 60h mode, convert the input to 40h for storage
    const storageValue = salaryMode === '60h' ? salary * 0.560524819952065 : salary;
    setGroups(currentGroups =>
      currentGroups.map(group =>
        group.group === groupId
          ? { ...group, groupsalary: storageValue }
          : group
      )
    );
    setNeedsReordering(true);
  };

  const handleDeleteGroup = (groupId: number) => {
    setGroups(currentGroups => {
      const filteredGroups = currentGroups
        .filter(group => group.group !== groupId)
        .sort((a, b) => b.groupsalary - a.groupsalary)
        .map((group, index) => ({ ...group, group: index + 1 }));
      return filteredGroups;
    });
  };

  const handleUpdateJob = (jobId: string, updatedJob: Job, groupId?: number) => {
    setGroups(currentGroups =>
      currentGroups.map(group => {
        // If this is the target group for a new job
        if (groupId !== undefined && group.group === groupId) {
          return {
            ...group,
            jobs: [...group.jobs, updatedJob].sort((a, b) => {
              if (a.salary === undefined && b.salary === undefined) return 0;
              if (a.salary === undefined) return 1;
              if (b.salary === undefined) return -1;
              return b.salary - a.salary;
            })
          };
        }
        // For existing jobs
        return {
          ...group,
          jobs: group.jobs.map(job =>
            job.id === jobId ? updatedJob : job
          ).sort((a, b) => {
            if (a.salary === undefined && b.salary === undefined) return 0;
            if (a.salary === undefined) return 1;
            if (b.salary === undefined) return -1;
            return b.salary - a.salary;
          })
        };
      })
    );
  };

  const handleDeleteJob = (jobId: string) => {
    setGroups(currentGroups =>
      currentGroups.map(group => ({
        ...group,
        jobs: group.jobs.filter(job => job.id !== jobId)
      }))
    );
  };

  return (
    <div className="p-4 relative">
      <h1 className="text-2xl font-bold mb-4">
        KV Filmschaffende Gagengruppen Tool
      </h1>

      <div className="flex items-center space-x-2 mb-4">
        <span className={`font-medium ${salaryMode === '40h' ? 'text-green-500' : 'text-gray-500'}`}>40h</span>
        <div 
          className={`relative inline-flex h-8 w-14 cursor-pointer rounded-full transition-colors duration-200 ease-in-out ${
            salaryMode === '40h' ? 'bg-green-500' : 'bg-red-500'
          }`}
          onClick={() => setSalaryMode(prev => prev === '60h' ? '40h' : '60h')}
        >
          <span 
            className={`inline-block h-7 w-7 transform rounded-full bg-white shadow-lg transition duration-200 ease-in-out mt-0.5 ${
              salaryMode === '40h' ? 'translate-x-1' : 'translate-x-6'
            }`}
          />
        </div>
        <span className={`font-medium ${salaryMode === '60h' ? 'text-red-500' : 'text-gray-500'}`}>60h</span>
      </div>

      <p className="text-sm text-gray-600 mb-4">
        Gagen laut KV 2025, {salaryMode === '60h' ? '§7(60h) inkl. SZ' : '40h exkl. SZ'}
      </p>

      <div className="flex items-center space-x-2 mb-4">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileImport}
          accept=".json"
          className="hidden"
        />
        <Button 
          onClick={handleImportClick}
          className="flex items-center space-x-2"
        >
          <FileUp size={20} />
          <span>Datei öffnen</span>
        </Button>
        <Button 
          onClick={handleExportClick}
          className="flex items-center space-x-2"
          disabled={groups.length === 0}
        >
          <Download size={20} />
          <span>Datei speichern</span>
        </Button>
        <Button 
          onClick={handleExcelExport}
          className="flex items-center space-x-2"
          disabled={groups.length === 0}
        >
          <FileSpreadsheet size={20} />
          <span>Excel Export</span>
        </Button>
      </div>

      {/* Floating Add Group Button */}
      <Button 
        onClick={addNewGroup}
        className="fixed bottom-6 right-6 rounded-full shadow-lg"
      >
        <PlusCircle className="mr-2" size={20} />
        Neue Gruppe
      </Button>

      {/* Department Filter and Salary Toggle */}
      {groups.length > 0 && (
        <div className="flex justify-between items-center mb-4">
          <DepartmentFilter
            selectedDepartments={selectedDepartments}
            onToggleDepartment={handleToggleDepartment}
          />
          <div className="flex items-center gap-2">
            <Eye className={`w-5 h-5 ${showSalaries ? 'text-green-500' : 'text-gray-500'}`} />
            <div 
              className={`relative inline-flex h-8 w-14 cursor-pointer rounded-full transition-colors duration-200 ease-in-out ${
                showSalaries ? 'bg-green-500' : 'bg-gray-400'
              }`}
              onClick={() => setShowSalaries(prev => !prev)}
            >
              <span 
                className={`inline-block h-7 w-7 transform rounded-full bg-white shadow-lg transition duration-200 ease-in-out mt-0.5 ${
                  !showSalaries ? 'translate-x-1' : 'translate-x-6'
                }`}
              />
            </div>
            <EyeOff className={`w-5 h-5 ${!showSalaries ? 'text-gray-400' : 'text-gray-500'}`} />
          </div>
        </div>
      )}

      {/* Groups */}
      <div className="border rounded-lg">
        {groups.map((group, index) => (
          <GroupComponent
            key={group.group}
            group={{
              ...group,
              groupsalary: salaryMode === '60h' ? convertSalary(group.groupsalary, '60h')! : group.groupsalary,
            }}
            jobs={group.jobs.map(job => ({
              ...job,
              salary: job.salary !== undefined 
                ? (salaryMode === '60h' ? convertSalary(job.salary, '60h') : job.salary)
                : undefined,
            }))}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onGroupSalaryChange={handleGroupSalaryChange}
            onDeleteGroup={handleDeleteGroup}
            onUpdateJob={handleUpdateJob}
            onDeleteJob={handleDeleteJob}
            isOdd={index % 2 === 1}
            visibleDepartments={selectedDepartments}
            showSalaries={showSalaries}
          />
        ))}
      </div>

      {/* Export Dialog */}
      <AlertDialog open={isExportDialogOpen} onOpenChange={setIsExportDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Bitte Dateinamen angeben</AlertDialogTitle>
          </AlertDialogHeader>
          <Input
            value={exportFilename}
            onChange={(e) => setExportFilename(e.target.value)}
            placeholder="dateiname.json"
            className="my-4"
          />
          <div className="flex justify-end space-x-2">
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction onClick={handleExport} disabled={!exportFilename}>
              Exportieren
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
};

export default GagengruppenTool;
