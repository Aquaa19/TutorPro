import { Student, TutorProfile, Performance } from '../types';

export function printTranscript(
  student: Student,
  tutor: TutorProfile,
  metrics: {
    totalSessions: number;
    presents: number;
    attendancePercentage: number;
    averageScoreRate: number | null;
    junePaymentInfo: { status: string; totalPaid: number; outstanding: number };
  },
  studentPerformance: Performance[]
) {
  const printDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const docTitle = `${student.name.replace(/\s+/g, '_')}_Academic_Transcript`;

  const feeStatusText = metrics.junePaymentInfo.status === 'paid' 
    ? 'PAID & CLEAR' 
    : metrics.junePaymentInfo.status === 'half_paid'
    ? 'HALF PAID'
    : metrics.junePaymentInfo.status === 'partially_paid'
    ? 'PARTIALLY PAID'
    : 'DUES PENDING';

  const feeStatusColor = metrics.junePaymentInfo.status === 'paid'
    ? '#166534' // green-800 / emerald dark
    : metrics.junePaymentInfo.status === 'half_paid'
    ? '#b45309' // amber-700
    : '#b91c1c'; // red-700

  // Format recent exam logs (last 5 exams) in chronological order or as logged
  const examRows = studentPerformance.slice(-5).map(p => {
    const rate = Math.round((p.marksObtained / p.totalMarks) * 100);
    return `
      <tr>
        <td style="padding: 12px 16px; border-bottom: 1px solid #e2e8f0; text-align: left; font-size: 13px;">
          <strong>${p.testName}</strong><br/>
          <span style="font-size: 11px; color: #64748b;">${p.date}</span>
        </td>
        <td style="padding: 12px 16px; border-bottom: 1px solid #e2e8f0; text-align: right; font-weight: 600; font-family: monospace; font-size: 13px;">
          ${p.marksObtained} / ${p.totalMarks}
        </td>
        <td style="padding: 12px 16px; border-bottom: 1px solid #e2e8f0; text-align: right; font-weight: 600; font-family: monospace; font-size: 13px; color: ${rate >= 85 ? '#0284c7' : rate >= 70 ? '#b45309' : '#b91c1c'}">
          ${rate}%
        </td>
      </tr>
    `;
  }).join('\n');

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>${student.name.replace(/\s+/g, '_')}_Academic_Transcript</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@500;700&family=Outfit:wght@300;400;600;700&display=swap');
          
          @font-face {
            font-family: 'Ballet';
            src: url('/Ballet_48pt-Regular.ttf') format('truetype');
          }
          
          body {
            font-family: 'Outfit', sans-serif;
            color: #1e293b;
            margin: 0;
            padding: 24px;
            background: #ffffff;
            -webkit-print-color-adjust: exact;
          }
          .transcript-container {
            max-width: 800px;
            margin: 0 auto;
            border: 1px solid #e2e8f0;
            padding: 24px;
            border-radius: 16px;
            box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.05);
            position: relative;
            background: #ffffff;
            box-sizing: border-box;
          }
          .header {
            text-align: center;
            border-bottom: 2px solid #f1f5f9;
            padding-bottom: 12px;
            margin-bottom: 18px;
            position: relative;
          }
          .header .institute-tag {
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 2px;
            color: #854d0e;
            font-weight: 700;
            margin: 0 0 4px 0;
          }
          .header h1 {
            font-family: 'Cinzel', serif;
            font-size: 22px;
            color: #0f172a;
            margin: 4px 0;
            font-weight: 700;
            letter-spacing: 1.5px;
          }
          .header p {
            font-size: 11px;
            color: #64748b;
            margin: 4px 0 0 0;
            font-family: monospace;
          }
          .details-grid {
            display: flex !important;
            flex-direction: row !important;
            justify-content: space-between !important;
            gap: 24px !important;
            margin-bottom: 18px !important;
            background: #f8fafc !important;
            padding: 16px !important;
            border-radius: 12px !important;
            border: 1px solid #f1f5f9 !important;
          }
          .details-block {
            flex: 1 !important;
            min-width: 0 !important;
          }
          .details-block h3 {
            font-size: 10px;
            text-transform: uppercase;
            letter-spacing: 1.5px;
            color: #475569;
            margin: 0 0 6px 0;
            border-bottom: 1px solid #e2e8f0;
            padding-bottom: 4px;
          }
          .details-block p {
            font-size: 13px;
            margin: 4px 0;
            color: #334155;
          }
          .details-block p strong {
            color: #0f172a;
          }
          .metrics-grid {
            display: flex !important;
            flex-direction: row !important;
            justify-content: space-between !important;
            gap: 16px !important;
            margin-bottom: 18px !important;
            width: 100% !important;
          }
          .metric-card {
            flex: 1 !important;
            min-width: 0 !important;
            background: #ffffff !important;
            border: 1px solid #e2e8f0 !important;
            padding: 12px !important;
            border-radius: 12px !important;
            text-align: center !important;
            box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.02) !important;
            box-sizing: border-box !important;
          }
          .metric-val {
            font-size: 18px;
            font-weight: 700;
            color: #0f172a;
            margin-top: 4px;
          }
          .metric-lbl {
            font-size: 9px;
            color: #64748b;
            text-transform: uppercase;
            letter-spacing: 1px;
            font-weight: 600;
          }
          .metric-sub {
            font-size: 10px;
            color: #94a3b8;
            margin-top: 2px;
          }
          .ledger-section h3 {
            font-size: 10px;
            text-transform: uppercase;
            letter-spacing: 1.5px;
            color: #475569;
            margin: 0 0 8px 0;
            border-bottom: 1px solid #e2e8f0;
            padding-bottom: 4px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            text-align: left;
            font-size: 13px;
            margin-bottom: 20px;
          }
          th {
            font-size: 10px;
            text-transform: uppercase;
            letter-spacing: 1px;
            color: #475569;
            background: #f8fafc;
            padding: 8px 16px;
            border-bottom: 2px solid #e2e8f0;
          }
          .footer-section {
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
            margin-top: 24px;
            padding-top: 16px;
            border-top: 2px solid #f1f5f9;
          }
          .doc-status-badge {
            background: #f0fdf4;
            color: #166534;
            border: 1px solid #bbf7d0;
            padding: 6px 12px;
            border-radius: 9999px;
            font-size: 10px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 1px;
            display: inline-block;
          }
          .signature-area {
            text-align: center;
            width: 240px;
          }
          .signature-name {
            font-family: 'Ballet', cursive;
            font-size: 34px;
            color: #0f172a;
            margin: 0;
            line-height: 1.1;
            white-space: nowrap;
          }
          .signature-line {
            border-bottom: 1.5px dotted #94a3b8;
            margin-bottom: 8px;
            margin-top: -8px;
            height: 10px;
          }
          .signature-title {
            font-size: 11px;
            color: #475569;
            text-transform: uppercase;
            letter-spacing: 1px;
          }
          .watermark {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) rotate(-30deg);
            font-size: 70px;
            font-weight: 700;
            color: rgba(212, 175, 55, 0.02);
            font-family: 'Cinzel', serif;
            letter-spacing: 4px;
            white-space: nowrap;
            pointer-events: none;
            user-select: none;
            text-transform: uppercase;
          }
          .system-note {
            text-align: center;
            font-size: 10px;
            color: #64748b;
            margin-top: 30px;
            line-height: 1.5;
            border-top: 1px solid #f1f5f9;
            padding-top: 15px;
          }
          .copyright-note {
            font-size: 9px;
            color: #94a3b8;
            margin-top: 4px;
            letter-spacing: 0.5px;
          }
          
          @media print {
            .no-print {
              display: none !important;
            }
          }
        </style>
      </head>
      <body>
        <div class="transcript-container">
          <div class="watermark">${tutor.instituteName || 'TutorPro'}</div>
          
          <div class="header">
            <div class="institute-tag">${tutor.instituteName || 'Private Tutoring'}</div>
            <h1>STUDENT ACADEMIC TRANSCRIPT</h1>
            <p>Compiled Date: ${printDate}</p>
          </div>
          
          <div class="details-grid">
            <div class="details-block">
              <h3>STUDENT DETAILS</h3>
              <p><strong>Student Name:</strong> ${student.name}</p>
              <p><strong>Class/Grade:</strong> ${student.grade}</p>
              <p><strong>Subject:</strong> ${student.subject}</p>
              <p><strong>Parent Contact:</strong> ${student.parentPhone}</p>
            </div>
            <div class="details-block">
              <h3>EDUCATOR DETAILS</h3>
              <p><strong>Educator Name:</strong> ${tutor.name}</p>
              ${tutor.instituteName ? `<p><strong>Academy:</strong> ${tutor.instituteName}</p>` : ''}
              <p><strong>Educator Email:</strong> ${tutor.email}</p>
              ${tutor.phone ? `<p><strong>Educator Phone:</strong> ${tutor.phone}</p>` : ''}
            </div>
          </div>
          
          <div class="metrics-grid">
            <div class="metric-card">
              <div class="metric-lbl">Attendance Rate</div>
              <div class="metric-val" style="font-family: monospace;">${metrics.attendancePercentage}%</div>
              <div class="metric-sub">${metrics.presents} / ${metrics.totalSessions} classes</div>
            </div>
            <div class="metric-card">
              <div class="metric-lbl">Average Score</div>
              <div class="metric-val" style="font-family: monospace;">${metrics.averageScoreRate !== null ? `${metrics.averageScoreRate}%` : 'N/A'}</div>
              <div class="metric-sub">Across ${studentPerformance.length} exams</div>
            </div>
            <div class="metric-card">
              <div class="metric-lbl">Fee Account Status</div>
              <div class="metric-val" style="font-size: 13px; font-weight: 700; color: ${feeStatusColor}; line-height: 2.2;">
                ${feeStatusText}
              </div>
              <div class="metric-sub">June 2026 cycle</div>
            </div>
          </div>
          
          <div class="ledger-section">
            <h3>CHRONOLOGICAL EXAMINATION LEDGER</h3>
            ${studentPerformance.length === 0 ? `
              <p style="font-style: italic; color: #64748b; font-size: 13px;">No exams registered yet for this student.</p>
            ` : `
              <table>
                <thead>
                  <tr>
                    <th style="text-align: left;">Exam / Test Details</th>
                    <th style="text-align: right;">Marks Obtained</th>
                    <th style="text-align: right;">Percentage Grade</th>
                  </tr>
                </thead>
                <tbody>
                  ${examRows}
                </tbody>
              </table>
            `}
          </div>
          
          <div class="footer-section">
            <div>
              <div class="doc-status-badge">OFFICIAL TRANSCRIPT</div>
            </div>
            <div class="signature-area">
              <div class="signature-name">${tutor.signatureText || tutor.name || 'Arkadyuti Mandal'}</div>
              <div class="signature-line"></div>
              <div class="signature-title">Educator Signature</div>
            </div>
          </div>
          
          <div class="system-note">
            <div>This student academic transcript is a compiled record generated by the TutorPro.OS database dashboard system.</div>
            <div class="copyright-note">© 2026 TutorPro • AquaaX. All rights reserved.</div>
          </div>
        </div>
        
        <script>
          window.onload = function() {
            const isIframe = window.self !== window.top;
            if (isIframe) {
              const originalTitle = window.parent.document.title;
              window.parent.document.title = "${student.name.replace(/\s+/g, '_').replace(/\\/g, '\\\\').replace(/"/g, '\\"')}_Academic_Transcript";
              
              window.focus();
              window.print();
              
              const cleanup = function() {
                window.parent.document.title = originalTitle;
                try {
                  window.parent.document.body.removeChild(window.frameElement);
                } catch (e) {}
              };
              window.onafterprint = cleanup;
            } else {
              window.focus();
              try {
                window.print();
              } catch (e) {
                console.log("Auto-print blocked.");
              }
            }
          };
        </script>
      </body>
    </html>
  `;

  // Desktop browser fallback (invisible iframe with layout size, positioned offscreen)
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.left = '-9999px';
  iframe.style.top = '-9999px';
  iframe.style.width = '1024px';
  iframe.style.height = '768px';
  iframe.style.border = '0';
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document || iframe.contentDocument;
  if (!doc) return;

  doc.open();
  doc.write(htmlContent);
  doc.close();
}
