import { NextResponse } from 'next/server';
import * as XLSX from 'xlsx';

export async function POST(request: Request) {
  try {
    const data = await request.json();
    
    // Prepare data for Excel
    const rows = [
      [
        'Gruppe',
        'Gruppengehalt',
        'Job Titel',
        'Abteilung',
        'Gehalt'
      ]
    ];

    // Process each group and its jobs
    data.groups.forEach((group: any) => {
      group.jobs.forEach((job: any) => {
        rows.push([
          group.group,
          parseFloat(group.groupsalary).toFixed(2),
          job.title,
          job.department,
          job.salary ? parseFloat(job.salary).toFixed(2) : ''
        ]);
      });
    });

    // Create a new workbook and worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(rows);

    // Set column widths
    const colWidths = [
      { wch: 8 },  // Gruppe
      { wch: 12 }, // Gruppengehalt
      { wch: 40 }, // Job Titel
      { wch: 15 }, // Abteilung
      { wch: 12 }  // Gehalt
    ];
    ws['!cols'] = colWidths;

    // Add the worksheet to the workbook
    XLSX.utils.book_append_sheet(wb, ws, "Gagengruppen 2025");

    // Convert to buffer
    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    // Return as downloadable file
    return new NextResponse(buf, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="Gagengruppen_2025.xlsx"'
      }
    });
  } catch (error) {
    console.error('Error generating Excel:', error);
    return NextResponse.json({ error: 'Failed to generate Excel file' }, { status: 500 });
  }
}
