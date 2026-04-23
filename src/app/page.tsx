'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Upload, FileText, BarChart3, Users, Home, TrendingUp, AlertCircle, Loader2 } from 'lucide-react';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Initialize supabase only if URL and key are valid
const supabase = (supabaseUrl && supabaseKey) 
  ? createClient(supabaseUrl, supabaseKey) 
  : null;

export default function App() {
  const [reportData, setReportData] = useState<any>(null); 
  const [loading, setLoading] = useState(true);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchLatestReport();
  }, []);

  const fetchLatestReport = async () => {
    setLoading(true);
    
    if (!supabase) {
      setLoading(false);
      return; 
    }

    try {
      let { data, error } = await supabase
        .from('revmax_reports')
        .select('*')
        // Try fetching without property_name condition just in case, but sort by created_at
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (data && !error) {
        setReportData(data);
      }
    } catch (err) {
      console.warn("Could not fetch reports:", err);
    }
    setLoading(false);
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setUploadStatus("Uploading & Processing PDF...");
      setIsUploading(true);
      
      const formData = new FormData();
      formData.append('pdfFile', e.target.files[0]);

      try {
        const response = await fetch('/api/upload-revmax', {
          method: 'POST',
          body: formData,
        });

        if (response.ok) {
          const resJson = await response.json();
          setUploadStatus("Data successfully updated!");
          
          if (!supabase) {
            // Set mock data directly if no supabase connection available
            setReportData(resJson.data);
          } else {
            fetchLatestReport();
          }
        } else {
          const resErr = await response.json();
          setUploadStatus(`Upload failed: ${resErr.error || 'Server error'}`);
        }
      } catch (err) {
        setUploadStatus("Error connecting to server.");
      }
      
      setIsUploading(false);
      setTimeout(() => setUploadStatus(null), 5000);
      
      // Reset input
      e.target.value = '';
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-slate-200 font-sans pb-12 selection:bg-indigo-500/30">
      {/* Header with glassmorphism */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-neutral-950/80 border-b border-white/10 shadow-2xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-neutral-400">
                RevMAX Dashboard
              </h1>
              <p className="text-neutral-400 flex items-center gap-2 text-sm mt-0.5">
                {reportData?.property_name || 'No Property Data'}
                <span className="w-1 h-1 rounded-full bg-neutral-600"></span>
                <span className="text-indigo-400 font-medium">{reportData?.report_month || 'Select a Report'}</span>
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-5">
            {uploadStatus && (
              <span className={`text-sm font-medium animate-in fade-in slide-in-from-right-4 ${uploadStatus.includes('failed') || uploadStatus.includes('Error') ? 'text-red-400' : 'text-emerald-400'}`}>
                {uploadStatus}
              </span>
            )}
            <label className={`cursor-pointer transition-all duration-300 relative inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium shadow-lg hover:shadow-indigo-500/25 active:scale-95 ${
                isUploading 
                  ? 'bg-neutral-800 text-neutral-400 cursor-not-allowed border border-white/5' 
                  : 'bg-white text-neutral-900 hover:bg-neutral-100 border border-transparent'
              }`}>
              {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              {isUploading ? 'Processing...' : 'Upload PDF'}
              <input type="file" accept=".pdf" className="hidden" onChange={handleUpload} disabled={isUploading} />
            </label>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-10">
        {!supabaseUrl && (
          <div className="mb-8 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-200 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-medium text-amber-400">Database Connection Missing</h3>
              <p className="text-sm mt-1 opacity-80">You need to provide NEXT_PUBLIC_SUPABASE_ANON_KEY in your .env.local file to connect the dashboard to your database. Uploading will work in simulated mode.</p>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-32">
            <div className="w-16 h-16 relative">
              <div className="absolute inset-0 border-4 border-indigo-500/20 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
            <p className="mt-6 text-neutral-400 font-medium animate-pulse">Loading dashboard data...</p>
          </div>
        ) : !reportData ? (
          <div className="flex flex-col items-center justify-center py-32 px-4 text-center border border-dashed border-white/10 rounded-3xl bg-white/[0.02] backdrop-blur-sm">
            <div className="w-20 h-20 bg-neutral-900 rounded-full flex items-center justify-center shadow-inner mb-6 ring-1 ring-white/5">
              <FileText className="w-8 h-8 text-neutral-500" />
            </div>
            <h2 className="text-2xl font-semibold mb-2">No Report Data Available</h2>
            <p className="text-neutral-400 max-w-md mx-auto">
              Please upload your first RevMAX PDF report to populate your dashboard with insights and metrics.
            </p>
          </div>
        ) : (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Quick Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <StatCard title="Occupancy" value={reportData.str_data?.occ} icon={<Home />} trend="+2.4% vs last mo" />
              <StatCard title="ADR" value={reportData.str_data?.adr} icon={<TrendingUp />} trend="+$5.10 vs last mo" />
              <StatCard title="RevPAR" value={reportData.str_data?.revpar} icon={<BarChart3 />} trend="+$12.30 vs last mo" />
            </div>

            {/* Main Content Area */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Column: Metrics */}
              <div className="col-span-1 lg:col-span-2 space-y-8">
                {/* Rooms Information */}
                <div className="rounded-3xl bg-neutral-900/50 border border-white/5 p-8 relative overflow-hidden group hover:border-white/10 transition-colors">
                  <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                    <Home className="w-32 h-32" />
                  </div>
                  <h3 className="text-lg font-semibold mb-6 flex items-center gap-2 text-white">
                    <Home className="w-5 h-5 text-indigo-400" /> Room Statistics
                  </h3>
                  <div className="grid grid-cols-3 gap-6 relative z-10">
                    <ValueBox label="Available" value={reportData.rooms_data?.available} />
                    <ValueBox label="Sold" value={reportData.rooms_data?.sold} />
                    <ValueBox label="Complimentary" value={reportData.rooms_data?.complimentary} />
                  </div>
                </div>

                {/* Accounts Information */}
                <div className="rounded-3xl bg-neutral-900/50 border border-white/5 p-8 relative overflow-hidden group hover:border-white/10 transition-colors">
                  <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                    <Users className="w-32 h-32" />
                  </div>
                  <h3 className="text-lg font-semibold mb-6 flex items-center gap-2 text-white">
                    <Users className="w-5 h-5 text-purple-400" /> Account Breakdown
                  </h3>
                  <div className="grid grid-cols-2 gap-6 relative z-10">
                    <div className="bg-white/5 rounded-2xl p-5 border border-white/5">
                      <div className="text-sm text-neutral-400 mb-1">Top Corporate Partner</div>
                      <div className="text-xl font-semibold text-white">{reportData.accounts_data?.topCorp}</div>
                    </div>
                    <div className="bg-white/5 rounded-2xl p-5 border border-white/5">
                      <div className="text-sm text-neutral-400 mb-1">Top OTA</div>
                      <div className="text-xl font-semibold text-white">{reportData.accounts_data?.topOta}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Snapshot & Conclusion */}
              <div className="col-span-1 space-y-8">
                {/* Snapshot */}
                <div className="rounded-3xl bg-gradient-to-br from-indigo-900/40 to-purple-900/20 border border-indigo-500/20 p-8">
                  <h3 className="text-lg font-semibold mb-6 text-white">Revenue Snapshot</h3>
                  <div className="space-y-6">
                    <div>
                      <div className="text-sm text-indigo-200 mb-1">Total Revenue</div>
                      <div className="text-4xl font-bold font-mono tracking-tight text-white drop-shadow-md">
                        {reportData.snapshot_data?.totalRevenue}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-indigo-200 mb-1">Period</div>
                      <div className="flex items-center gap-2 text-white">
                        <span className="px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-sm font-medium">
                          {reportData.snapshot_data?.period}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Conclusion */}
                <div className="rounded-3xl bg-neutral-900/50 border border-white/5 p-8">
                  <h3 className="text-lg font-semibold mb-4 text-white">Executive Conclusion</h3>
                  <p className="text-neutral-400 leading-relaxed">
                    {reportData.conclusion_data?.summary || 'No summary available.'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

// Helper Components
function StatCard({ title, value, icon, trend }: { title: string, value: any, icon: React.ReactNode, trend?: string }) {
  return (
    <div className="bg-neutral-900/50 border border-white/5 p-6 rounded-3xl hover:bg-neutral-900 transition-colors group relative overflow-hidden">
      <div className="absolute w-[200px] h-[200px] bg-indigo-500/10 rounded-full blur-3xl -top-20 -right-20 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity"></div>
      <div className="flex justify-between items-start mb-6">
        <h3 className="text-neutral-400 font-medium">{title}</h3>
        <div className="p-2.5 rounded-xl bg-white/5 text-neutral-300 ring-1 ring-white/10 group-hover:scale-110 group-hover:text-white group-hover:bg-indigo-500/20 group-hover:ring-indigo-500/30 transition-all duration-300">
          {icon}
        </div>
      </div>
      <div className="flex flex-col gap-2 relative z-10">
        <div className="text-3xl font-bold tracking-tight text-white">{value || '-'}</div>
        {trend && (
          <div className="text-sm text-emerald-400 font-medium">
            {trend}
          </div>
        )}
      </div>
    </div>
  );
}

function ValueBox({ label, value }: { label: string, value: any }) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="text-sm font-medium text-neutral-500">{label}</div>
      <div className="text-2xl font-semibold text-white drop-shadow-sm">{value || 0}</div>
    </div>
  );
}
