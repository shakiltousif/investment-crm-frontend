'use client';

import React, { useState } from 'react';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, FileText, Calendar, TrendingUp, DollarSign } from 'lucide-react';

export default function ReportsPage() {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');

  const handleDownloadCSV = async () => {
    try {
      setGenerating(true);
      setError('');

      const params: any = {};
      if (startDate) params.startDate = new Date(startDate).toISOString();
      if (endDate) params.endDate = new Date(endDate).toISOString();

      const response = await api.reports.getPortfolioReportCSV(params);

      // Create blob and download
      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `portfolio-report-${Date.now()}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err: any) {
      console.error('Failed to generate report:', err);
      setError(err.response?.data?.message || 'Failed to generate report');
    } finally {
      setGenerating(false);
    }
  };

  const handleViewReport = async () => {
    try {
      setGenerating(true);
      setError('');

      const params: any = {};
      if (startDate) params.startDate = new Date(startDate).toISOString();
      if (endDate) params.endDate = new Date(endDate).toISOString();

      const response = await api.reports.getPortfolioReport(params);
      const reportData = response.data.data;

      // Open report in new window/tab with formatted view
      const reportWindow = window.open('', '_blank');
      if (reportWindow) {
        reportWindow.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>Portfolio Report - FIL LIMITED</title>
              <style>
                body { font-family: Arial, sans-serif; margin: 40px; color: #333; }
                .header { border-bottom: 3px solid #007bff; padding-bottom: 20px; margin-bottom: 30px; }
                .header h1 { color: #007bff; margin: 0; }
                .header p { margin: 5px 0; color: #666; }
                .summary { background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 30px; }
                .summary h2 { margin-top: 0; color: #333; }
                .summary-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin-top: 15px; }
                .summary-item { padding: 10px; background: white; border-radius: 4px; }
                .summary-item label { font-size: 12px; color: #666; display: block; }
                .summary-item value { font-size: 18px; font-weight: bold; color: #333; display: block; }
                .portfolio { margin-bottom: 40px; }
                .portfolio h2 { color: #007bff; border-bottom: 2px solid #007bff; padding-bottom: 10px; }
                table { width: 100%; border-collapse: collapse; margin-top: 15px; }
                th { background: #007bff; color: white; padding: 12px; text-align: left; }
                td { padding: 10px; border-bottom: 1px solid #ddd; }
                tr:hover { background: #f5f5f5; }
                .positive { color: #28a745; }
                .negative { color: #dc3545; }
                .footer { margin-top: 40px; padding-top: 20px; border-top: 2px solid #ddd; text-align: center; color: #666; font-size: 12px; }
              </style>
            </head>
            <body>
              <div class="header">
                <h1>FIL LIMITED</h1>
                <h2>Portfolio Report</h2>
                <p><strong>Client:</strong> ${reportData.userName} (${reportData.userEmail})</p>
                <p><strong>Report Date:</strong> ${new Date(reportData.reportDate).toLocaleDateString()}</p>
                ${reportData.startDate && reportData.endDate ? `<p><strong>Period:</strong> ${new Date(reportData.startDate).toLocaleDateString()} to ${new Date(reportData.endDate).toLocaleDateString()}</p>` : ''}
              </div>

              <div class="summary">
                <h2>Summary</h2>
                <div class="summary-grid">
                  <div class="summary-item">
                    <label>Total Portfolio Value</label>
                    <value>£{reportData.summary.totalPortfolioValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</value>
                  </div>
                  <div class="summary-item">
                    <label>Total Invested</label>
                    <value>£{reportData.summary.totalInvested.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</value>
                  </div>
                  <div class="summary-item">
                    <label>Total Gain/Loss</label>
                    <value class="${reportData.summary.totalGain >= 0 ? 'positive' : 'negative'}">
                      £{reportData.summary.totalGain.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </value>
                  </div>
                  <div class="summary-item">
                    <label>Gain Percentage</label>
                    <value class="${reportData.summary.gainPercentage >= 0 ? 'positive' : 'negative'}">
                      ${reportData.summary.gainPercentage.toFixed(2)}%
                    </value>
                  </div>
                  <div class="summary-item">
                    <label>Total Deposits</label>
                    <value>£{reportData.summary.totalDeposits.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</value>
                  </div>
                  <div class="summary-item">
                    <label>Total Withdrawals</label>
                    <value>£{reportData.summary.totalWithdrawals.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</value>
                  </div>
                  <div class="summary-item">
                    <label>Net Cash Flow</label>
                    <value class="${reportData.summary.netCashFlow >= 0 ? 'positive' : 'negative'}">
                      £{reportData.summary.netCashFlow.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </value>
                  </div>
                </div>
              </div>

              ${reportData.portfolios.map((portfolio: any) => `
                <div class="portfolio">
                  <h2>${portfolio.name}</h2>
                  <table>
                    <thead>
                      <tr>
                        <th>Investment</th>
                        <th>Symbol</th>
                        <th>Type</th>
                        <th>Quantity</th>
                        <th>Purchase Price</th>
                        <th>Current Price</th>
                        <th>Total Value</th>
                        <th>Gain/Loss</th>
                        <th>Gain %</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${portfolio.investments.map((inv: any) => `
                        <tr>
                          <td>${inv.name}</td>
                          <td>${inv.symbol || '-'}</td>
                          <td>${inv.type}</td>
                          <td>${inv.quantity}</td>
                          <td>£{inv.purchasePrice.toFixed(2)}</td>
                          <td>£{inv.currentPrice.toFixed(2)}</td>
                          <td>£{inv.totalValue.toFixed(2)}</td>
                          <td class="${inv.totalGain >= 0 ? 'positive' : 'negative'}">
                            £{inv.totalGain.toFixed(2)}
                          </td>
                          <td class="${inv.gainPercentage >= 0 ? 'positive' : 'negative'}">
                            ${inv.gainPercentage.toFixed(2)}%
                          </td>
                        </tr>
                      `).join('')}
                      <tr style="font-weight: bold; background: #f8f9fa;">
                        <td colspan="6">Portfolio Total</td>
                        <td>£{portfolio.totalValue.toFixed(2)}</td>
                        <td class="${portfolio.totalGain >= 0 ? 'positive' : 'negative'}">
                          £{portfolio.totalGain.toFixed(2)}
                        </td>
                        <td class="${portfolio.gainPercentage >= 0 ? 'positive' : 'negative'}">
                          ${portfolio.gainPercentage.toFixed(2)}%
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              `).join('')}

              ${reportData.transactions.length > 0 ? `
                <div class="portfolio">
                  <h2>Recent Transactions</h2>
                  <table>
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Type</th>
                        <th>Amount</th>
                        <th>Currency</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${reportData.transactions.map((t: any) => `
                        <tr>
                          <td>${new Date(t.createdAt).toLocaleDateString()}</td>
                          <td>${t.type}</td>
                          <td>£{t.amount.toFixed(2)}</td>
                          <td>GBP</td>
                          <td>${t.status}</td>
                        </tr>
                      `).join('')}
                    </tbody>
                  </table>
                </div>
              ` : ''}

              <div class="footer">
                <p>FIL LIMITED Investment Management Platform</p>
                <p>This report is generated for informational purposes only.</p>
                <p>Generated on ${new Date().toLocaleString()}</p>
              </div>
            </body>
          </html>
        `);
        reportWindow.document.close();
      }
    } catch (err: any) {
      console.error('Failed to generate report:', err);
      setError(err.response?.data?.message || 'Failed to generate report');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Portfolio Reports</h1>
        <p className="text-gray-600 mt-2">Generate and download your portfolio reports</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Generate Report
          </CardTitle>
          <CardDescription>
            Select a date range to generate your portfolio report
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="h-4 w-4 inline mr-1" />
                Start Date (Optional)
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="h-4 w-4 inline mr-1" />
                End Date (Optional)
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <Button
              onClick={handleViewReport}
              disabled={generating}
              className="flex-1 bg-primary hover:bg-primary/90"
            >
              <FileText className="h-4 w-4 mr-2" />
              {generating ? 'Generating...' : 'View Report'}
            </Button>
            <Button
              onClick={handleDownloadCSV}
              disabled={generating}
              variant="outline"
              className="flex-1"
            >
              <Download className="h-4 w-4 mr-2" />
              {generating ? 'Generating...' : 'Download CSV'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              Report Features
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>• Complete portfolio overview</li>
              <li>• Investment performance details</li>
              <li>• Transaction history</li>
              <li>• Gain/loss calculations</li>
              <li>• Custom date range support</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-primary" />
              Export Options
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>• View in browser (HTML format)</li>
              <li>• Download as CSV file</li>
              <li>• Print-friendly format</li>
              <li>• Professional layout</li>
              <li>• FIL LIMITED branding</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

