import React, { useState, useEffect } from 'react';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Job, DepartmentName, DEPARTMENT_COLORS } from './types';

interface JobEditDialogProps {
  job: Job | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedJob: Job) => void;
  onDelete: (jobId: string) => void;
  groupSalary: number;
}

export function JobEditDialog({ job, isOpen, onClose, onSave, onDelete, groupSalary }: JobEditDialogProps) {
  const [editedJob, setEditedJob] = useState<Job | null>(null);
  const [isExistingJob, setIsExistingJob] = useState(true);

  useEffect(() => {
    if (job) {
      setEditedJob(job);
      setIsExistingJob(job.salary !== undefined);
    }
  }, [job]);

  if (!editedJob) return null;

  const handleSave = () => {
    if (editedJob) {
      // If it's not an existing job (neue Position), set salary to undefined
      const finalJob = {
        ...editedJob,
        salary: isExistingJob ? editedJob.salary : undefined
      };
      onSave(finalJob);
    }
    onClose();
  };

  const handleDelete = () => {
    onDelete(editedJob.id);
    onClose();
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className="sm:max-w-[425px]">
        <AlertDialogHeader>
          <AlertDialogTitle>Position bearbeiten</AlertDialogTitle>
        </AlertDialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <label htmlFor="title" className="text-right">
              Titel
            </label>
            <Input
              id="title"
              value={editedJob.title}
              onChange={(e) => setEditedJob({ ...editedJob, title: e.target.value })}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <label htmlFor="department" className="text-right">
              Department
            </label>
            <select
              id="department"
              value={editedJob.department}
              onChange={(e) => setEditedJob({ ...editedJob, department: e.target.value as DepartmentName })}
              className="col-span-3 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
            >
              {Object.keys(DEPARTMENT_COLORS).map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <label className="text-right">
              Position
            </label>
            <div className="col-span-3 flex items-center space-x-2">
              <div 
                className={`relative inline-flex h-6 w-11 cursor-pointer rounded-full transition-colors duration-200 ease-in-out ${
                  isExistingJob ? 'bg-green-500' : 'bg-blue-500'
                }`}
                onClick={() => setIsExistingJob(!isExistingJob)}
              >
                <span 
                  className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-lg transition duration-200 ease-in-out mt-0.5 ${
                    isExistingJob ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </div>
              <span className="text-sm">
                {isExistingJob ? 'KV-Position' : 'Neue Position'}
              </span>
            </div>
          </div>
          {isExistingJob && (
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="salary" className="text-right">
                Gage
              </label>
              <Input
                id="salary"
                type="number"
                value={editedJob.salary}
                onChange={(e) => setEditedJob({ ...editedJob, salary: parseFloat(e.target.value) || 0 })}
                className="col-span-3"
                step="0.01"
              />
            </div>
          )}
        </div>
        <AlertDialogFooter className="sm:justify-between">
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
          >
            Löschen
          </Button>
          <div className="flex space-x-2">
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction onClick={handleSave}>
              Speichern
            </AlertDialogAction>
          </div>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
