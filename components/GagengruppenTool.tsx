"use client";import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { PlusCircle, FileUp, Download } from 'lucide-react';
import { Group, Job, DepartmentName,DEPARTMENT_COLORS } from './types';
import GroupComponent from './group';
import DepartmentFilter from './departmentFilter';
import DepartmentOverview from './department-overview';

interface ImportedJob {
  id: string;
  title: string;
  salary: string | number;
  department: DepartmentName;  // Update this to use DepartmentName
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

  const convertSalary = (salary: number, to: '40h' | '60h') => {
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
              department: j.department as DepartmentName,  // Add type assertion here
              salary: parseFloat(j.salary.toString())
            }))
          }));
        }
        
        // And in the else if block:
         else if (content.groups) {
          importedGroups = content.groups.map((g: ImportedGroup) => ({
            ...g,
            groupsalary: parseFloat(g.groupsalary.toString()),
            jobs: g.jobs.map((j: ImportedJob) => ({
              id: j.id,
              title: j.title,
              department: j.department as DepartmentName,  // Add type assertion here
              salary: parseFloat(j.salary.toString())
            }))
          }));
        }else {
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

  const handleExport = () => {
    if (!exportFilename) return;
    
    const exportData = {
      groups: groups.map(({ group, groupsalary, jobs }) => ({
        group,
        groupsalary: groupsalary.toFixed(2),
        jobs: jobs.map(({ id, title, salary, department }) => ({
          id,
          title,
          salary: salary.toFixed(2),
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
            jobs: [...group.jobs, job].sort((a, b) => b.salary - a.salary)
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
      </div>

      {/* Floating Add Group Button */}
      <Button 
        onClick={addNewGroup}
        className="fixed bottom-6 right-6 rounded-full shadow-lg"
      >
        <PlusCircle className="mr-2" size={20} />
        Neue Gruppe
      </Button>

      {/* Department Filter */}
      {groups.length > 0 && (
        <DepartmentFilter
          selectedDepartments={selectedDepartments}
          onToggleDepartment={handleToggleDepartment}
        />
      )}

      {/* Groups */}
      <div className="border rounded-lg">
        {groups.map((group, index) => (
          <GroupComponent
            key={group.group}
            group={{
              ...group,
              groupsalary: salaryMode === '60h' ? convertSalary(group.groupsalary, '60h') : group.groupsalary,
            }}
            jobs={group.jobs.map(job => ({
              ...job,
              salary: salaryMode === '60h' ? convertSalary(job.salary, '60h') : job.salary,
            }))}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onGroupSalaryChange={handleGroupSalaryChange}
            onDeleteGroup={handleDeleteGroup}
            isOdd={index % 2 === 1}
            visibleDepartments={selectedDepartments}
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

      {/* Department Overview or Message */}
      {groups.length > 0 ? (
        <DepartmentOverview groups={groups} salaryMode={salaryMode} />
      ) : (
        <div className="mt-8 text-center text-gray-500">
          Bitte zuerst eine passende .json Datei öffnen
        </div>
      )}
    </div>
  );
};

export default GagengruppenTool;
