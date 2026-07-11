"use client";

import { useDropzone } from "react-dropzone";
import { UploadCloud } from "lucide-react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface UploadBoxProps {
  onFileSelect: (file: File) => void;
}

export default function UploadBox({ onFileSelect }: UploadBoxProps) {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    multiple: false,
    accept: {
      "text/csv": [".csv"],
    },
    onDrop: (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        onFileSelect(acceptedFiles[0]);
      }
    },
  });

  return (
    <Card
      {...getRootProps()}
      className={`cursor-pointer transition-all border-2 border-dashed ${
        isDragActive
          ? "border-blue-500 bg-blue-50"
          : "border-muted hover:border-blue-400"
      }`}
    >
      <input {...getInputProps()} />

      <CardHeader>
        <CardTitle className="text-center">
          Upload Your CSV
        </CardTitle>
      </CardHeader>

      <CardContent className="flex flex-col items-center justify-center py-16 space-y-4">
        <UploadCloud className="w-14 h-14 text-muted-foreground" />

        <div className="text-center">
          <p className="text-lg font-medium">
            Drag & Drop your CSV here
          </p>

          <p className="text-sm text-muted-foreground mt-2">
            or click anywhere to browse
          </p>
        </div>
      </CardContent>
    </Card>
  );
}