import { Student, Batch, TutorProfile } from '../types';

export function printAIDossier(
  student: Student,
  batch: Batch | undefined,
  attendanceRate: number,
  avgScore: number | null,
  tutor: TutorProfile,
  reportText: string
) {
  const printDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const docTitle = `${student.name.replace(/\s+/g, '_')}_Progress_Report_${printDate.replace(/\s+/g, '_')}`;

  // Render markdown helper specifically styled for paper printing
  const renderMarkdownForPrint = (markdown: string): string => {
    let html = markdown;

    // Escape HTML tags
    html = html
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

    // Bold (**text**)
    html = html.replace(/\*\*(.*?)\*\*/g, "<strong style='color: #0f172a; font-weight: 600;'>$1</strong>");

    // Italics (*text*)
    html = html.replace(/(?<!^\s*\*)\*(?!\s)(.*?)\*/gm, "<em style='color: #475569;'>$1</em>");

    // Horizontal rules (---)
    html = html.replace(/^---$/gm, "<hr style='border: 0; border-top: 1px solid #e2e8f0; margin: 24px 0;' />");

    // Headers (###, ##, #)
    html = html.replace(/^### (.*?)$/gm, "<h4 style='font-family: \"Outfit\", sans-serif; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; color: #854d0e; margin-top: 24px; margin-bottom: 8px;'>$1</h4>");
    html = html.replace(/^## (.*?)$/gm, "<h3 style='font-family: \"Cinzel\", serif; font-size: 16px; font-weight: 700; color: #1e293b; margin-top: 30px; margin-bottom: 12px; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px;'>$1</h3>");
    html = html.replace(/^# (.*?)$/gm, "<h2 style='font-family: \"Cinzel\", serif; font-size: 18px; font-weight: 700; color: #0f172a; margin-top: 36px; margin-bottom: 16px; border-bottom: 2px solid #cbd5e1; padding-bottom: 8px;'>$1</h2>");

    // Unordered Lists (* item)
    html = html.replace(/^[\*\-+] (.*?)$/gm, "<li style='margin-left: 20px; margin-bottom: 6px; color: #334155; font-size: 13.5px; line-height: 1.5;'>$1</li>");

    // Paragraph blocks (split by double newlines)
    const sections = html.split(/\n\n+/);
    const formatted = sections.map(sec => {
      const trimmed = sec.trim();
      if (trimmed.startsWith('<h') || trimmed.startsWith('<hr') || trimmed.startsWith('<li')) {
        return trimmed;
      }
      return `<p style="line-height: 1.6; color: #334155; margin-top: 12px; margin-bottom: 12px; font-size: 13.5px;">${trimmed.replace(/\n/g, '<br />')}</p>`;
    });

    return formatted.join('\n');
  };

  const formattedContent = renderMarkdownForPrint(reportText);

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>${student.name.replace(/\s+/g, '_')}_Progress_Report_${printDate.replace(/\s+/g, '_')}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@500;750&family=Outfit:wght@300;400;600;700&display=swap');
          
          @font-face {
            font-family: 'Ballet';
            src: url('/Ballet_48pt-Regular.ttf') format('truetype');
          }
          
          body {
            font-family: 'Outfit', sans-serif;
            color: #1e293b;
            margin: 0;
            padding: 40px;
            background: #ffffff;
            -webkit-print-color-adjust: exact;
          }
          .report-container {
            max-width: 800px;
            margin: 0 auto;
            border: 1px solid #e2e8f0;
            padding: 40px;
            border-radius: 16px;
            box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.05);
            position: relative;
            background: #ffffff;
          }
          .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            border-bottom: 2px solid #f1f5f9;
            padding-bottom: 20px;
            margin-bottom: 24px;
          }
          .institute-info h1 {
            font-family: 'Cinzel', serif;
            font-size: 22px;
            color: #0f172a;
            margin: 0 0 6px 0;
            letter-spacing: 1px;
            font-weight: 700;
            text-transform: uppercase;
          }
          .institute-info p {
            font-size: 13px;
            color: #475569;
            margin: 2px 0;
          }
          .report-title-block {
            text-align: right;
          }
          .report-title-block h2 {
            font-family: 'Cinzel', serif;
            font-size: 24px;
            font-weight: 700;
            color: #854d0e;
            margin: 0;
            letter-spacing: 1px;
          }
          .report-title-block p {
            font-size: 12px;
            color: #64748b;
            margin: 4px 0 0 0;
            font-family: monospace;
          }
          .details-grid {
            display: grid;
            grid-template-cols: 3fr 2fr;
            gap: 20px;
            margin-bottom: 30px;
            background: #f8fafc;
            padding: 20px;
            border-radius: 12px;
            border: 1px solid #f1f5f9;
          }
          .details-block h3 {
            font-size: 10px;
            text-transform: uppercase;
            letter-spacing: 1.5px;
            color: #475569;
            margin: 0 0 8px 0;
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
          .performance-stats {
            display: flex;
            gap: 16px;
            margin-top: 8px;
          }
          .stat-card {
            background: #ffffff;
            border: 1px solid #e2e8f0;
            padding: 8px 12px;
            border-radius: 8px;
            text-align: center;
            flex: 1;
          }
          .stat-val {
            font-size: 16px;
            font-weight: 700;
            color: #0f172a;
          }
          .stat-lbl {
            font-size: 9px;
            color: #64748b;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .content-area {
            margin-bottom: 40px;
          }
          .footer-section {
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
            margin-top: 50px;
            padding-top: 20px;
            border-top: 2px solid #f1f5f9;
          }
          .doc-status-badge {
            background: #fef9c3;
            color: #713f12;
            border: 1px solid #fef08a;
            padding: 6px 12px;
            border-radius: 9999px;
            font-size: 11px;
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
            body {
              padding: 0 !important;
            }
            .report-container {
              border: none !important;
              box-shadow: none !important;
              padding: 0 !important;
            }
          }
          
          @media screen {
            html.is-iframe .no-print-bar {
              display: none !important;
            }
          }
        </style>
      </head>
      <body>
        <div class="no-print no-print-bar" style="display: flex; justify-content: space-between; align-items: center; background: #0f172a; padding: 12px 20px; border-radius: 12px; margin: 0 auto 24px auto; max-width: 800px; border: 1px solid rgba(212, 175, 55, 0.2); font-family: sans-serif;">
          <span style="color: #f8fafc; font-size: 13px; font-weight: 600; letter-spacing: 0.5px; font-family: 'Outfit', sans-serif;">TUTORPRO DOSSIER VIEWER</span>
          <div style="display: flex; gap: 8px;">
            <button onclick="window.print()" style="background: #aa7c11; color: white; border: none; padding: 8px 16px; border-radius: 8px; cursor: pointer; font-weight: 600; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; font-family: 'Outfit', sans-serif;">Print / Save PDF</button>
            <button onclick="window.close()" style="background: rgba(255, 255, 255, 0.1); color: #cbd5e1; border: 1px solid rgba(255,255,255,0.05); padding: 8px 16px; border-radius: 8px; cursor: pointer; font-weight: 600; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; font-family: 'Outfit', sans-serif;">Close</button>
          </div>
        </div>
        <div class="report-container">
          <div class="watermark">${tutor.instituteName || 'TutorPro'}</div>
          
          <div class="header">
            <div class="institute-info">
              <h1>${tutor.instituteName || 'TutorPro OS'}</h1>
              <p><strong>Educator:</strong> ${tutor.name}</p>
              ${tutor.phone ? `<p><strong>Phone:</strong> ${tutor.phone}</p>` : ''}
              ${tutor.email ? `<p><strong>Email:</strong> ${tutor.email}</p>` : ''}
            </div>
            <div class="report-title-block">
              <h2>PROGRESS DOSSIER</h2>
              <p>Date: ${printDate}</p>
            </div>
          </div>
          
          <div class="details-grid">
            <div class="details-block">
              <h3>STUDENT DETAILS</h3>
              <p><strong>Student Name:</strong> ${student.name}</p>
              <p><strong>Class/Grade:</strong> ${student.grade}</p>
              <p><strong>Subject:</strong> ${student.subject}</p>
              <p><strong>Cohort Batch:</strong> ${batch?.name || 'Unassigned'}</p>
            </div>
            <div class="details-block">
              <h3>PERFORMANCE SUMMARY</h3>
              <div class="performance-stats">
                <div class="stat-card">
                  <div class="stat-val">${attendanceRate}%</div>
                  <div class="stat-lbl">Attendance</div>
                </div>
                <div class="stat-card">
                  <div class="stat-val">${avgScore !== null ? `${avgScore}%` : 'N/A'}</div>
                  <div class="stat-lbl">Avg Score</div>
                </div>
              </div>
            </div>
          </div>
          
          <div class="content-area">
            ${formattedContent}
          </div>
          
          <div class="footer-section">
            <div>
              <div class="doc-status-badge">AI SYNTHESIZED</div>
            </div>
            <div class="signature-area">
              <div class="signature-name">${tutor.name || 'Arkadyuti Mandal'}</div>
              <div class="signature-line"></div>
              <div class="signature-title">Educator Signature</div>
            </div>
          </div>
          
          <div class="system-note">
            <div>This student progress dossier was synthesized using AI based on tutoring session attendance and academic evaluation logs.</div>
            <div class="copyright-note">© 2026 TutorPro • AquaaX. All rights reserved.</div>
          </div>
        </div>
        
        <script>
          window.onload = function() {
            const isIframe = window.self !== window.top;
            if (isIframe) {
              document.documentElement.classList.add('is-iframe');
              const originalTitle = window.parent.document.title;
              window.parent.document.title = "${student.name.replace(/\s+/g, '_')}_Progress_Report_${printDate.replace(/\s+/g, '_')}";
              
              window.focus();
              window.print();
              
              const cleanup = function() {
                window.parent.document.title = originalTitle;
                try {
                  window.parent.document.body.removeChild(window.frameElement);
                } catch (e) {}
              };
              window.onafterprint = cleanup;
              setTimeout(cleanup, 2000);
            } else {
              window.focus();
              try {
                window.print();
              } catch (e) {
                console.log("Auto-print blocked, user can print manually.");
              }
            }
          };
        </script>
      </body>
    </html>
  `;

  // 1. Android Companion App WebView check
  const androidApp = (window as any).AndroidApp;
  if (androidApp && typeof androidApp.printInvoice === 'function') {
    androidApp.printInvoice(htmlContent, docTitle);
    return;
  }

  // 2. Mobile web browser check
  const isMobile = /Android|iPhone|iPad|iPod|IEMobile|Opera Mini/i.test(navigator.userAgent);
  if (isMobile) {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.open();
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      return;
    }
  }

  // 3. Desktop browser fallback (invisible iframe)
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document || iframe.contentDocument;
  if (!doc) return;

  doc.open();
  doc.write(htmlContent);
  doc.close();
}
