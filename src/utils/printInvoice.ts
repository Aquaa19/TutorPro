import { Student, Payment, TutorProfile } from '../types';

export function printInvoice(student: Student, payment: Payment, tutor: TutorProfile) {
  const receiptId = payment.id.slice(0, 8).toUpperCase();
  const docTitle = `${student.name.replace(/\s+/g, '_')}_${payment.date}`;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>${student.name.replace(/\s+/g, '_')}_${payment.date}</title>
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
            padding: 40px;
            background: #ffffff;
            -webkit-print-color-adjust: exact;
          }
          .receipt-container {
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
            padding-bottom: 24px;
            margin-bottom: 30px;
          }
          .institute-info h1 {
            font-family: 'Cinzel', serif;
            font-size: 24px;
            color: #0f172a;
            margin: 0 0 6px 0;
            letter-spacing: 1px;
            font-weight: 700;
            text-transform: uppercase;
          }
          .institute-info p {
            font-size: 13px;
            color: #334155;
            margin: 2px 0;
          }
          .receipt-title {
            text-align: right;
          }
          .receipt-title h2 {
            font-size: 28px;
            font-weight: 700;
            color: #aa7c11;
            margin: 0;
            letter-spacing: 2px;
          }
          .receipt-title p {
            font-size: 12px;
            color: #475569;
            margin: 4px 0 0 0;
            font-family: monospace;
          }
          .details-grid {
            display: grid;
            grid-template-cols: 1fr 1fr;
            gap: 40px;
            margin-bottom: 40px;
          }
          .details-block h3 {
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 1.5px;
            color: #475569;
            margin: 0 0 10px 0;
            border-bottom: 1px solid #f1f5f9;
            padding-bottom: 6px;
          }
          .details-block p {
            font-size: 14px;
            margin: 4px 0;
            color: #1e293b;
          }
          .details-block p strong {
            color: #0f172a;
          }
          .table-container {
            margin-bottom: 40px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            text-align: left;
          }
          th {
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 1px;
            color: #334155;
            background: #f8fafc;
            padding: 12px 16px;
            border-bottom: 2px solid #e2e8f0;
          }
          td {
            padding: 16px;
            border-bottom: 1px solid #f1f5f9;
            font-size: 14px;
          }
          .total-row td {
            font-weight: 700;
            font-size: 16px;
            border-bottom: 2px solid #0f172a;
            background: #f8fafc;
          }
          .total-amount {
            color: #0f172a;
          }
          .footer-section {
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
            margin-top: 40px;
            padding-top: 24px;
            border-top: 2px solid #f1f5f9;
          }
          .payment-status-badge {
            background: #dcfce7;
            color: #15803d;
            border: 1px solid #bbf7d0;
            padding: 8px 16px;
            border-radius: 9999px;
            font-size: 12px;
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
            font-size: 90px;
            font-weight: 700;
            color: rgba(212, 175, 55, 0.03);
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
            color: #475569;
            margin-top: 30px;
            line-height: 1.5;
          }
          .copyright-note {
            font-size: 9px;
            color: #64748b;
            margin-top: 6px;
            letter-spacing: 0.5px;
          }
          
          @media print {
            .no-print {
              display: none !important;
            }
            body {
              padding: 0 !important;
            }
            .receipt-container {
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
          <span style="color: #f8fafc; font-size: 13px; font-weight: 600; letter-spacing: 0.5px; font-family: 'Outfit', sans-serif;">TUTORPRO RECEIPT</span>
          <div style="display: flex; gap: 8px;">
            <button onclick="window.print()" style="background: #aa7c11; color: white; border: none; padding: 8px 16px; border-radius: 8px; cursor: pointer; font-weight: 600; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; font-family: 'Outfit', sans-serif;">Print / Save PDF</button>
            <button onclick="window.close()" style="background: rgba(255, 255, 255, 0.1); color: #cbd5e1; border: 1px solid rgba(255,255,255,0.05); padding: 8px 16px; border-radius: 8px; cursor: pointer; font-weight: 600; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; font-family: 'Outfit', sans-serif;">Close</button>
          </div>
        </div>
        <div class="receipt-container">
          <div class="watermark">${tutor.instituteName || 'TutorPro'}</div>
          
          <div class="header">
            <div class="institute-info">
              <h1>${tutor.instituteName || 'TUTORPRO RECEIPT'}</h1>
              <p><strong>Educator:</strong> ${tutor.name}</p>
              ${tutor.phone ? `<p><strong>Phone:</strong> ${tutor.phone}</p>` : ''}
              ${tutor.email ? `<p><strong>Email:</strong> ${tutor.email}</p>` : ''}
              ${tutor.upiId ? `<p><strong>UPI ID:</strong> ${tutor.upiId}</p>` : ''}
            </div>
            <div class="receipt-title">
              <h2>RECEIPT</h2>
              <p>ID: #${receiptId}</p>
              <p>Date: ${payment.date}</p>
            </div>
          </div>
          
          <div class="details-grid">
            <div class="details-block">
              <h3>STUDENT DETAILS</h3>
              <p><strong>Name:</strong> ${student.name}</p>
              <p><strong>Class:</strong> ${student.grade}</p>
              <p><strong>Subjects:</strong> ${student.subject}</p>
              <p><strong>Parent Phone:</strong> ${student.parentPhone}</p>
            </div>
            <div class="details-block">
              <h3>PAYMENT SUMMARY</h3>
              <p><strong>Billing Month:</strong> ${payment.monthFor}</p>
              <p><strong>Payment Mode:</strong> ${payment.mode}</p>
              <p><strong>Status:</strong> Paid</p>
            </div>
          </div>
          
          <div class="table-container">
            <table>
              <thead>
                <tr>
                  <th>Description</th>
                  <th style="text-align: right;">Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>
                    <strong>Tuition Fees</strong><br>
                    <span style="font-size: 12px; color: #64748b;">
                      Monthly tuition fee for ${payment.monthFor} - (${student.subject})
                    </span>
                  </td>
                  <td style="text-align: right; font-weight: 600;">₹${payment.amountPaid}</td>
                </tr>
                <tr class="total-row">
                  <td>Total Paid</td>
                  <td style="text-align: right;" class="total-amount">₹${payment.amountPaid}</td>
                </tr>
              </tbody>
            </table>
          </div>
          
          <div class="footer-section">
            <div>
              <div class="payment-status-badge">PAID</div>
            </div>
            <div class="signature-area">
              <div class="signature-name">${tutor.signatureText || tutor.name || 'Arkadyuti Mandal'}</div>
              <div class="signature-line"></div>
              <div class="signature-title">Authorized Signature</div>
            </div>
          </div>
          
          <div class="system-note">
            <div>This is a computer-generated document and does not require a physical signature.</div>
            <div class="copyright-note">© 2026 TutorPro • AquaaX. All rights reserved.</div>
          </div>
        </div>
        
        <script>
          window.onload = function() {
            const isIframe = window.self !== window.top;
            if (isIframe) {
              document.documentElement.classList.add('is-iframe');
              const originalTitle = window.parent.document.title;
              window.parent.document.title = "${student.name.replace(/\s+/g, '_')}_${payment.date}";
              
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
