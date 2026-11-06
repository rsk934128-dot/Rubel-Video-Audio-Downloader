import React, { useState, useRef } from 'react';
import { 
  X, 
  Download, 
  Upload, 
  FileText, 
  FileSpreadsheet, 
  CheckCircle2, 
  AlertCircle, 
  Database, 
  RefreshCw,
  FileCode,
  ShieldCheck,
  HardDrive
} from 'lucide-react';
import { DownloadTask, Language } from '../types';
import { 
  exportHistoryAsJSON, 
  exportHistoryAsCSV, 
  parseJSONHistory, 
  parseCSVHistory, 
  mergeHistoryRecords 
} from '../services/historyBackupService';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  history: DownloadTask[];
  onImportComplete: (updatedHistory: DownloadTask[], count: number, mode: 'merge' | 'replace') => void;
  language: Language;
}

export const HistoryBackupModal: React.FC<Props> = ({
  isOpen,
  onClose,
  history,
  onImportComplete,
  language,
}) => {
  const [activeTab, setActiveTab] = useState<'export' | 'import'>('export');
  const [importMode, setImportMode] = useState<'merge' | 'replace'>('merge');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [parsedTasks, setParsedTasks] = useState<DownloadTask[] | null>(null);
  const [detectedType, setDetectedType] = useState<'json' | 'csv' | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleExportJSON = () => {
    try {
      exportHistoryAsJSON(history);
      setSuccessMessage(
        language === 'bn' 
          ? 'JSON ব্যাকআপ ফাইল সফলভাবে ডাউনলোড হয়েছে!' 
          : 'JSON backup file successfully exported!'
      );
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (e: any) {
      setParseError(e?.message || 'Failed to export JSON');
    }
  };

  const handleExportCSV = () => {
    try {
      exportHistoryAsCSV(history);
      setSuccessMessage(
        language === 'bn' 
          ? 'CSV স্প্রেডশিট ফাইল সফলভাবে ডাউনলোড হয়েছে!' 
          : 'CSV spreadsheet file successfully exported!'
      );
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (e: any) {
      setParseError(e?.message || 'Failed to export CSV');
    }
  };

  const processFile = async (file: File) => {
    setParseError(null);
    setSuccessMessage(null);
    setSelectedFile(file);
    setIsProcessing(true);

    try {
      const text = await file.text();
      const isCsv = file.name.toLowerCase().endsWith('.csv') || file.type.includes('csv');
      
      let tasks: DownloadTask[] = [];
      if (isCsv) {
        tasks = parseCSVHistory(text);
        setDetectedType('csv');
      } else {
        // Try JSON first, fallback to CSV if JSON fails
        try {
          tasks = parseJSONHistory(text);
          setDetectedType('json');
        } catch (jsonErr) {
          try {
            tasks = parseCSVHistory(text);
            setDetectedType('csv');
          } catch {
            throw jsonErr; // Throw original JSON error
          }
        }
      }

      if (tasks.length === 0) {
        throw new Error(
          language === 'bn' 
            ? 'ফাইলটিতে কোনো বৈধ ডাউনলোড রেকর্ড পাওয়া যায়নি।' 
            : 'No valid download records found in this file.'
        );
      }

      setParsedTasks(tasks);
    } catch (err: any) {
      setParsedTasks(null);
      setDetectedType(null);
      setParseError(err?.message || (language === 'bn' ? 'ফাইলটি প্রসেস করতে ব্যর্থ হয়েছে' : 'Failed to parse file'));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleApplyImport = () => {
    if (!parsedTasks || parsedTasks.length === 0) return;

    const { merged, addedCount } = mergeHistoryRecords(history, parsedTasks, importMode);
    onImportComplete(merged, addedCount, importMode);

    setSuccessMessage(
      language === 'bn'
        ? `${addedCount} টি নতুন রেকর্ড সফলভাবে ইম্পোর্ট করা হয়েছে!`
        : `Successfully imported ${addedCount} records!`
    );

    setTimeout(() => {
      onClose();
    }, 1200);
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div 
        id="history-backup-modal"
        className="w-full max-w-lg rounded-3xl bg-slate-900 border border-slate-700/80 shadow-2xl shadow-rose-950/40 p-6 sm:p-7 relative overflow-hidden"
      >
        {/* Background glow */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 mb-5 border-b border-slate-800 relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-rose-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-rose-950/40">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <span>{language === 'bn' ? 'ডাউনলোড হিস্টোরি ব্যাকআপ' : 'Download History Backup'}</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                  {history.length} {language === 'bn' ? 'রেকর্ড' : 'records'}
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                {language === 'bn' ? 'JSON বা CSV আকারে সংরক্ষণ ও রিস্টোর করুন' : 'Export and restore records as JSON or CSV'}
              </p>
            </div>
          </div>

          <button
            id="close-backup-modal-btn"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switchers: Export vs Import */}
        <div className="grid grid-cols-2 p-1 rounded-2xl bg-slate-950/80 border border-slate-800 mb-5 relative z-10">
          <button
            id="tab-export-btn"
            type="button"
            onClick={() => {
              setActiveTab('export');
              setParseError(null);
            }}
            className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs sm:text-sm font-semibold transition ${
              activeTab === 'export'
                ? 'bg-gradient-to-r from-rose-600 to-rose-500 text-white shadow-md shadow-rose-950/50'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Download className="w-4 h-4" />
            <span>{language === 'bn' ? 'এক্সপোর্ট (Export)' : 'Export Backup'}</span>
          </button>

          <button
            id="tab-import-btn"
            type="button"
            onClick={() => {
              setActiveTab('import');
              setSuccessMessage(null);
            }}
            className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs sm:text-sm font-semibold transition ${
              activeTab === 'import'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-950/50'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Upload className="w-4 h-4" />
            <span>{language === 'bn' ? 'ইম্পোর্ট (Import)' : 'Import & Restore'}</span>
          </button>
        </div>

        {/* Notification alerts */}
        {successMessage && (
          <div className="mb-4 p-3 rounded-2xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2.5 animate-in fade-in duration-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {parseError && (
          <div className="mb-4 p-3 rounded-2xl bg-rose-950/80 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2.5 animate-in fade-in duration-200">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{parseError}</span>
          </div>
        )}

        {/* Tab 1: Export Content */}
        {activeTab === 'export' && (
          <div className="space-y-4 relative z-10">
            <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 text-xs text-slate-300 flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-white">
                  {language === 'bn' ? 'নিরাপদ ব্যাকআপ ব্যবস্থা' : 'Safe Offline Backup'}
                </p>
                <p className="text-slate-400 text-[11px] mt-0.5">
                  {language === 'bn'
                    ? 'আপনার ব্রাউজারের ডাউনলোড হিস্টোরি যেকোনো সময় এক্সপোর্ট করে নিজের ডিভাইস বা মেমোরি কার্ডে সংরক্ষণ করে রাখতে পারেন।'
                    : 'Download records can be safely archived offline and imported anytime into other browsers or devices.'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              {/* Export as JSON */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 hover:border-rose-500/50 transition flex flex-col justify-between group">
                <div>
                  <div className="w-9 h-9 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center mb-3 group-hover:scale-110 transition">
                    <FileCode className="w-5 h-5" />
                  </div>
                  <h4 className="text-sm font-bold text-white mb-1">
                    JSON Format (.json)
                  </h4>
                  <p className="text-[11px] text-slate-400 mb-4 leading-relaxed">
                    {language === 'bn' 
                      ? 'সম্পূর্ণ মেটাডেটা, কোয়ালিটি এবং স্ট্রিম তথ্য সহ ব্যাকআপ। পুনরায় এই অ্যাপে রিস্টোর করার জন্য সেরা।'
                      : 'Complete structured backup including metadata & formats. Best for restoring into this app.'}
                  </p>
                </div>

                <button
                  id="export-json-btn"
                  onClick={handleExportJSON}
                  disabled={history.length === 0}
                  className="w-full py-2.5 px-3 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-rose-950/40 transition active:scale-98"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>{language === 'bn' ? 'JSON এক্সপোর্ট করুন' : 'Export JSON'}</span>
                </button>
              </div>

              {/* Export as CSV */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 hover:border-emerald-500/50 transition flex flex-col justify-between group">
                <div>
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-3 group-hover:scale-110 transition">
                    <FileSpreadsheet className="w-5 h-5" />
                  </div>
                  <h4 className="text-sm font-bold text-white mb-1">
                    CSV Spreadsheet (.csv)
                  </h4>
                  <p className="text-[11px] text-slate-400 mb-4 leading-relaxed">
                    {language === 'bn' 
                      ? 'Microsoft Excel, Google Sheets বা স্প্রেডশিট অ্যাপে টেবিল আকারে দেখার জন্য উপযুক্ত।'
                      : 'Spreadsheet format ready for Microsoft Excel, Numbers, and Google Sheets.'}
                  </p>
                </div>

                <button
                  id="export-csv-btn"
                  onClick={handleExportCSV}
                  disabled={history.length === 0}
                  className="w-full py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-emerald-950/40 transition active:scale-98"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>{language === 'bn' ? 'CSV এক্সপোর্ট করুন' : 'Export CSV'}</span>
                </button>
              </div>
            </div>

            {history.length === 0 && (
              <p className="text-center text-xs text-amber-400/80 italic pt-1">
                {language === 'bn' 
                  ? '⚠️ এক্সপোর্ট করার মতো কোনো ডাউনলোড হিস্টোরি এখনও নেই।' 
                  : '⚠️ No download history records to export yet.'}
              </p>
            )}
          </div>
        )}

        {/* Tab 2: Import Content */}
        {activeTab === 'import' && (
          <div className="space-y-4 relative z-10">
            {/* File drag-and-drop / select box */}
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className="p-6 rounded-2xl border-2 border-dashed border-slate-700 hover:border-emerald-500/60 bg-slate-950/70 hover:bg-slate-950 cursor-pointer text-center transition group"
            >
              <input
                ref={fileInputRef}
                id="history-file-input"
                type="file"
                accept=".json,.csv,application/json,text/csv"
                onChange={handleFileChange}
                className="hidden"
              />

              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 mx-auto flex items-center justify-center mb-3 group-hover:scale-110 transition">
                <Upload className="w-6 h-6" />
              </div>

              <p className="text-sm font-semibold text-white mb-1">
                {selectedFile ? selectedFile.name : (language === 'bn' ? 'ব্যাকআপ ফাইল নির্বাচন করুন' : 'Choose backup file')}
              </p>
              <p className="text-xs text-slate-400">
                {language === 'bn' ? 'বা ফাইলটি এখানে ড্র্যাগ করে ছেড়ে দিন (.json বা .csv)' : 'or drag and drop here (.json or .csv)'}
              </p>
            </div>

            {/* Parsed summary preview */}
            {parsedTasks && (
              <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-300 font-medium">
                    {language === 'bn' ? 'ফাইল ফরম্যাট:' : 'File Format:'}
                  </span>
                  <span className="px-2 py-0.5 rounded-md font-mono text-[11px] uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    {detectedType}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-300 font-medium">
                    {language === 'bn' ? 'সনাক্তকৃত ডাউনলোড রেকর্ড:' : 'Detected Records:'}
                  </span>
                  <span className="text-white font-bold text-sm">
                    {parsedTasks.length} {language === 'bn' ? 'টি' : 'items'}
                  </span>
                </div>

                {/* Import merge strategy selector */}
                <div className="pt-2 border-t border-slate-800">
                  <label className="block text-xs text-slate-400 font-medium mb-2">
                    {language === 'bn' ? 'ইম্পোর্ট করার নিয়ম:' : 'Restoration Method:'}
                  </label>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <button
                      type="button"
                      id="import-mode-merge-btn"
                      onClick={() => setImportMode('merge')}
                      className={`p-2.5 rounded-xl border text-left transition ${
                        importMode === 'merge'
                          ? 'bg-emerald-950/80 border-emerald-500 text-emerald-200'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      <div className="font-bold mb-0.5">{language === 'bn' ? 'একত্রিত করুন' : 'Merge (Keep both)'}</div>
                      <div className="text-[10px] opacity-80">{language === 'bn' ? 'নতুনগুলো যুক্ত হবে' : 'Add new non-duplicates'}</div>
                    </button>

                    <button
                      type="button"
                      id="import-mode-replace-btn"
                      onClick={() => setImportMode('replace')}
                      className={`p-2.5 rounded-xl border text-left transition ${
                        importMode === 'replace'
                          ? 'bg-rose-950/80 border-rose-500 text-rose-200'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      <div className="font-bold mb-0.5">{language === 'bn' ? 'প্রতিস্থাপন করুন' : 'Replace All'}</div>
                      <div className="text-[10px] opacity-80">{language === 'bn' ? 'পুরাতন মুছে নতুন হবে' : 'Overwrite existing'}</div>
                    </button>
                  </div>
                </div>

                {/* Apply Import Button */}
                <button
                  id="apply-import-btn"
                  onClick={handleApplyImport}
                  disabled={isProcessing}
                  className="w-full mt-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/60 transition active:scale-98"
                >
                  <RefreshCw className={`w-4 h-4 ${isProcessing ? 'animate-spin' : ''}`} />
                  <span>
                    {language === 'bn'
                      ? `${parsedTasks.length} টি রেকর্ড রিস্টোর করুন`
                      : `Restore ${parsedTasks.length} Records`}
                  </span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Footer info */}
        <div className="mt-5 pt-3 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-500 relative z-10">
          <span>{language === 'bn' ? 'লোকাল অফলাইন ব্যাকআপ' : 'Local Offline Backup'}</span>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white transition"
          >
            {language === 'bn' ? 'বাতিল' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};
