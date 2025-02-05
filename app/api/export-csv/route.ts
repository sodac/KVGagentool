import { NextResponse } from 'next/server';
import { Group, Job } from '@/components/types';

export async function POST(request: Request) {
  try {
    const data = await request.json();
    
    // Prepare CSV header
    const rows = [
      ['Gruppe', 'Gruppengehalt', 'Job Titel', 'Abteilung', 'Gehalt']
    ];

    // Process each group and its jobs
    data.groups.forEach((group: Group) => {
      group.jobs.forEach((job: Job) => {
        rows.push([
          group.group.toString(),
          Number(group.groupsalary).toFixed(2),
          job.title,
          job.department,
          job.salary ? Number(job.salary).toFixed(2) : ''
        ]);
      });
    });

    // Convert to CSV
    const csvContent = rows
      .map(row => 
        row.map(cell => 
          // Escape quotes and wrap in quotes if contains comma or quote
          typeof cell === 'string' && (cell.includes(',') || cell.includes('"'))
            ? `"${cell.replace(/"/g, '""')}"`
            : cell
        ).join(',')
      )
      .join('\n');

    // Return as downloadable file
    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="Gagengruppen_2025.csv"'
      }
    });
  } catch (error) {
    console.error('Error generating CSV:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: `Failed to generate CSV file: ${errorMessage}` }, { status: 500 });
  }
}
