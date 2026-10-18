import { StudentRegistration } from '../types';

export function exportRegistrationsToCsv(registrations: StudentRegistration[]) {
  const headers = [
    'Registration ID',
    'Student Name',
    'USN',
    'Semester',
    'College Email',
    'Phone Number',
    'Fee (INR)',
    'Payment Status',
    'UTR Reference',
    'Registration Status',
    'Registered At',
    'Approved At',
    'Rejection Reason'
  ];

  const rows = registrations.map((r) => [
    `"${r.registrationId}"`,
    `"${r.fullName.replace(/"/g, '""')}"`,
    `"${r.usn || 'N/A'}"`,
    `"${r.semester || 'N/A'}"`,
    `"${r.email}"`,
    `"${r.phone}"`,
    `"${r.feeAmount}"`,
    `"${r.paymentStatus}"`,
    `"${r.utrNumber || 'N/A'}"`,
    `"${r.registrationStatus}"`,
    `"${r.createdAt}"`,
    `"${r.approvedAt || 'N/A'}"`,
    `"${(r.rejectionReason || '').replace(/"/g, '""')}"`,
  ]);

  const csvContent = [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `ECO_AI_Bootcamp_Registrations_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
