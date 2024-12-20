"use client";
import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { DEPARTMENT_COLORS, formatCurrency, Group, DepartmentName } from './types';


interface DepartmentOverviewProps {
  groups: Group[];
}
interface DepartmentStat {
  department: DepartmentName;
  min: number;
  max: number;
  avg: number;
}

const DepartmentOverview: React.FC<DepartmentOverviewProps> = ({ groups }) => {
  const allJobsWithSalary = groups.flatMap(g => 
    g.jobs.map(j => ({ ...j, groupSalary: g.groupsalary }))
  );

  // Calculate department statistics

  const departmentStats: DepartmentStat[] = Object.entries(
    allJobsWithSalary.reduce((acc, { department, groupSalary }) => {
      if (!acc[department]) {
        acc[department] = { min: Infinity, max: -Infinity, sum: 0, count: 0 };
      }
  
      acc[department].min = Math.min(acc[department].min, groupSalary);
      acc[department].max = Math.max(acc[department].max, groupSalary);
      acc[department].sum += groupSalary;
      acc[department].count++;
  
      return acc;
    }, {} as Record<string, { min: number; max: number; sum: number; count: number }>)
  ).map(([department, { min, max, sum, count }]) => ({
    department: department as DepartmentName,  // Add this type assertion
    min,
    max,
    avg: sum / count
  }));

  // SVG dimensions and padding
  const width = 800;
  const height = Math.max(400, departmentStats.length * 40 + 100); // Dynamic height based on departments
  const padding = {
    left: 120,   // More space for department labels
    right: 80,   // Space for salary labels
    top: 40,
    bottom: 40
  };
  const barHeight = 24;
  const barPadding = 16;

  // Scale function for x-axis
  const maxSalary = Math.max(...departmentStats.map(d => d.max));
  const scale = (x: number) => (
    ((width - padding.left - padding.right) * x / maxSalary) + padding.left
  );

  // Create tick values for x-axis
  const tickCount = 5;
  const tickValues = Array.from({ length: tickCount }, (_, i) => 
    (maxSalary * i) / (tickCount - 1)
  );

  return (
    <Card className="mt-8 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-xl font-semibold">Übersicht nach Department</CardTitle>
      </CardHeader>
      <CardContent>
        <svg 
          width={width} 
          height={height}
          className="font-sans"
        >
          {/* Background grid lines */}
          {tickValues.map((tick, i) => (
            <line
              key={i}
              x1={scale(tick)}
              y1={padding.top}
              x2={scale(tick)}
              y2={height - padding.bottom}
              stroke="#e5e7eb"
              strokeDasharray="4,4"
            />
          ))}

          {departmentStats.map((dept, index) => (
            <g 
              key={dept.department} 
              transform={`translate(0,${index * (barHeight + barPadding) + padding.top})`}
            >
              {/* Department label */}
              <text 
                x={padding.left - 8}
                y={barHeight / 2} 
                textAnchor="end"
                dominantBaseline="middle"
                className="fill-gray-700 text-sm font-medium"
              >
                {dept.department}
              </text>

              {/* Salary range bar */}
              <rect
                x={scale(dept.min)}
                y={0}
                width={scale(dept.max) - scale(dept.min)}
                height={barHeight}
                rx={4}
                fill={DEPARTMENT_COLORS[dept.department] || DEPARTMENT_COLORS['Sonstige']}
                opacity={0.8}
              />

              {/* Average salary marker */}
              <g transform={`translate(${scale(dept.avg)},${barHeight / 2})`}>
                <circle
                  r={4}
                  fill="white"
                  stroke="currentColor"
                  strokeWidth={2}
                />
                <title>Durchschnitt: {formatCurrency(dept.avg)}</title>
              </g>

              {/* Salary range labels */}
              <text
                x={scale(dept.min) - 4}
                y={barHeight / 2}
                textAnchor="end"
                dominantBaseline="middle"
                className="fill-gray-500 text-xs"
              >
                {formatCurrency(dept.min)}
              </text>
              <text
                x={scale(dept.max) + 4}
                y={barHeight / 2}
                textAnchor="start"
                dominantBaseline="middle"
                className="fill-gray-500 text-xs"
              >
                {formatCurrency(dept.max)}
              </text>
            </g>
          ))}

          {/* X-axis ticks and labels */}
          {tickValues.map((tick, i) => (
            <g key={i} transform={`translate(${scale(tick)},${height - padding.bottom})`}>
              <line
                y2={6}
                stroke="currentColor"
                strokeWidth={1}
              />
              <text
                y={20}
                textAnchor="middle"
                className="fill-gray-500 text-xs"
              >
                {formatCurrency(tick)}
              </text>
            </g>
          ))}
        </svg>
      </CardContent>
    </Card>
  );
};

export default DepartmentOverview;