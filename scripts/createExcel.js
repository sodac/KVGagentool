import { readFileSync } from 'fs';
import XLSX from 'xlsx';

// Read the JSON file
const jsonData = JSON.parse(readFileSync('2025_Gagengruppen_Sitzung_30.1..json', 'utf8'));

// Prepare data for Excel
const rows = [];

// Add header row
rows.push([
    'Gruppe',
    'Gruppengehalt',
    'Job Titel',
    'Abteilung',
    'Gehalt'
]);

// Process each group and its jobs
jsonData.groups.forEach(group => {
    group.jobs.forEach(job => {
        rows.push([
            group.group,
            parseFloat(group.groupsalary).toFixed(2),
            job.title,
            job.department,
            parseFloat(job.salary).toFixed(2)
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

// Write to file
XLSX.writeFile(wb, 'Gagengruppen_2025.xlsx');
