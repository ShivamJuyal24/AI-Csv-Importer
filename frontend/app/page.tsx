"use client";

import { useState } from "react";
import Papa from "papaparse";
import ResultTable from "@/components/ResultTable";
import api from "@/lib/api";
import SummaryCards from "@/components/SummaryCards";
import UploadBox from "@/components/UploadBox";
import PreviewTable from "@/components/PreviewTable";
import ImportButton from "@/components/ImportButton";
import SkippedTable from "@/components/SkippedTable";
export default function Home() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<Record<string, string>[]>([]);
  const [totalRows, setTotalRows] = useState(0);

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);

    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,

      complete: (results) => {
        setTotalRows(results.data.length);
        setPreviewData(results.data.slice(0, 10));
      },

      error: (error) => {
        console.error(error);
      },
    });
  };

  const handleImport = async () => {
    if (!selectedFile) return;

    try {
      setLoading(true);

      const formData = new FormData();
      formData.append("file", selectedFile);

      const response = await api.post("/upload", formData);

      setResult(response.data);
    } catch (error) {
      console.error(error);
      alert("Import failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-5xl px-6 py-12">
        <h1 className="text-center text-4xl font-bold">
          AI Powered CSV Importer
        </h1>

        <p className="mt-3 text-center text-muted-foreground">
          Upload any CSV and let AI convert it into GrowEasy CRM records.
        </p>

        <div className="mt-10">
          <UploadBox onFileSelect={handleFileSelect} />
        </div>

        {selectedFile && (
          <div className="mt-6 rounded-lg border bg-white p-4">
            <p className="font-medium">Selected File</p>

            <p className="mt-2 text-muted-foreground">
              {selectedFile.name}
            </p>

            <p className="text-sm text-muted-foreground">
              {(selectedFile.size / 1024).toFixed(2)} KB
            </p>
          </div>
        )}

        {previewData.length > 0 && (
          <>
            <p className="mt-8 text-sm text-muted-foreground">
              Showing first {previewData.length} of {totalRows} rows
            </p>

            <PreviewTable data={previewData} />

            <ImportButton
              onImport={handleImport}
              loading={loading}
            />
          </>
        )}

       {result && (
  <>
    <SummaryCards
      totalRows={result.totalRows}
      imported={result.imported}
      skipped={result.skipped}
    />

    <ResultTable data={result.data} />

    <SkippedTable skipped={result.skippedRecords} />
  </>
)}
      </div>
    </main>
  );
}