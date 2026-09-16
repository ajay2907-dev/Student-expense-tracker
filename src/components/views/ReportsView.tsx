import React, { useState } from 'react';
import { Download, FileSpreadsheet, FileText, CheckCircle2, ShieldCheck } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { User, Expense, Budget } from '../../types';
import { formatCurrency } from '../../lib/api';

interface ReportsViewProps {
  user: User;
  expenses: Expense[];
  budgets: Budget[];
}

export const ReportsView: React.FC<ReportsViewProps> = ({ user, expenses, budgets }) => {
  const currency = user.currency || '₹';
  const currentMonthStr = new Date().toISOString().substring(0, 7);

  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [downloadingCsv, setDownloadingCsv] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // CSV Exporter
  const handleDownloadCsv = () => {
    setDownloadingCsv(true);
    try {
      const headers = ['Expense ID', 'Date', 'Description', 'Category', 'Payment Method', 'Amount'];
      const rows = expenses.map((e) => [
        e.expense_id,
        e.date,
        `"${e.description.replace(/"/g, '""')}"`,
        e.category,
        e.payment_method,
        e.amount,
      ]);

      const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `student_expenses_${currentMonthStr}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setSuccessMsg('CSV transaction statement downloaded successfully!');
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      alert('Failed to generate CSV: ' + err.message);
    } finally {
      setDownloadingCsv(false);
    }
  };

  // PDF Exporter using jsPDF & autoTable
  const handleDownloadPdf = () => {
    setDownloadingPdf(true);
    try {
      const doc = new jsPDF();

      // Title & Header Branding
      doc.setFontSize(18);
      doc.setTextColor(109, 59, 215); // #6d3bd7
      doc.text('Expense Tracker Financial Statement', 14, 20);

      doc.setFontSize(10);
      doc.setTextColor(70, 70, 70);
      doc.text(`User Name: ${user.name} (${user.email})`, 14, 28);
      doc.text(`Statement Period: ${currentMonthStr}`, 14, 34);

      // Financial Summary Box
      const budgetObj = budgets.find((b) => b.month === currentMonthStr);
      const budgetAmt = budgetObj ? budgetObj.amount : 15000;
      const monthExpenses = expenses.filter((e) => e.date.startsWith(currentMonthStr));
      const totalSpent = monthExpenses.reduce((s, e) => s + e.amount, 0);

      autoTable(doc, {
        startY: 42,
        head: [['Monthly Budget', 'Total Spent', 'Remaining Balance', 'Recorded Items']],
        body: [
          [
            `${currency}${budgetAmt.toLocaleString()}`,
            `${currency}${totalSpent.toLocaleString()}`,
            `${currency}${(budgetAmt - totalSpent).toLocaleString()}`,
            `${monthExpenses.length}`,
          ],
        ],
        theme: 'grid',
        headStyles: { fillColor: [109, 59, 215], textColor: [255, 255, 255] },
      });

      // Transaction Table
      doc.setFontSize(12);
      doc.setTextColor(20, 20, 20);
      doc.text('Transaction Breakdown History', 14, (doc as any).lastAutoTable.finalY + 12);

      const tableRows = expenses.slice(0, 40).map((e) => [
        e.date,
        e.description || e.category,
        e.category,
        e.payment_method,
        `${currency}${e.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
      ]);

      autoTable(doc, {
        startY: (doc as any).lastAutoTable.finalY + 16,
        head: [['Date', 'Description', 'Category', 'Payment', 'Amount']],
        body: tableRows,
        theme: 'striped',
        headStyles: { fillColor: [35, 45, 70], textColor: [255, 255, 255] },
      });

      doc.save(`expense_statement_${user.name.replace(/\s+/g, '_')}_${currentMonthStr}.pdf`);
      setSuccessMsg('PDF financial statement downloaded successfully!');
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      alert('Failed to generate PDF: ' + err.message);
    } finally {
      setDownloadingPdf(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 max-w-4xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold text-white light:text-slate-900">Reports & Statement Export</h2>
        <p className="text-sm text-[#cbc3d7] light:text-slate-500">
          Download formatted PDF financial statements or raw CSV data spreadsheets for university audits.
        </p>
      </div>

      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 light:text-emerald-700 light:bg-emerald-50 text-sm flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* CSV Card */}
        <div className="glass-panel glass-panel-hover rounded-3xl p-6 sm:p-8 border border-white/10 flex flex-col justify-between space-y-6">
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 light:bg-emerald-100 flex items-center justify-center text-emerald-400 light:text-emerald-700">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-lg text-white light:text-slate-900">Raw CSV Spreadsheet</h3>
            <p className="text-xs text-[#cbc3d7] light:text-slate-600 leading-relaxed">
              Export all your recorded transactions including expense IDs, timestamps, descriptions, categories, and payment channels in raw CSV format for Excel/Google Sheets.
            </p>
          </div>

          <button
            onClick={handleDownloadCsv}
            disabled={downloadingCsv}
            className="w-full py-3.5 rounded-2xl bg-emerald-500/20 light:bg-emerald-100 hover:bg-emerald-500/30 text-emerald-300 light:text-emerald-800 border border-emerald-500/30 light:border-emerald-300 font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>{downloadingCsv ? 'Generating CSV...' : 'Download CSV File'}</span>
          </button>
        </div>

        {/* PDF Statement Card */}
        <div className="glass-panel glass-panel-hover rounded-3xl p-6 sm:p-8 border border-white/10 flex flex-col justify-between space-y-6">
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-purple-500/20 light:bg-purple-100 flex items-center justify-center text-[#d0bcff] light:text-purple-700">
              <FileText className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-lg text-white light:text-slate-900">Official PDF Statement</h3>
            <p className="text-xs text-[#cbc3d7] light:text-slate-600 leading-relaxed">
              Generate a formatted PDF document complete with student identity header, monthly budget summary, remaining balances, and itemized transaction tables.
            </p>
          </div>

          <button
            onClick={handleDownloadPdf}
            disabled={downloadingPdf}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#d0bcff] to-[#ffb0cd] text-[#3c0091] font-bold text-sm flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>{downloadingPdf ? 'Building PDF...' : 'Download PDF Statement'}</span>
          </button>
        </div>
      </div>

      <div className="glass-panel rounded-3xl p-6 border border-white/10 flex items-center gap-4">
        <ShieldCheck className="w-8 h-8 text-[#d0bcff] light:text-purple-700 shrink-0" />
        <div>
          <h4 className="font-bold text-sm text-white light:text-slate-900">Verified Privacy Guarantee</h4>
          <p className="text-xs text-[#cbc3d7] light:text-slate-500 mt-0.5">
            Statements are generated locally on client runtime with zero third-party data tracking.
          </p>
        </div>
      </div>
    </div>
  );
};
