"use client";

import { Button } from "@/components/ui/button";

interface ImportButtonProps {
  onImport: () => void;
  loading: boolean;
}

export default function ImportButton({
  onImport,
  loading,
}: ImportButtonProps) {
  return (
    <div className="mt-6 flex justify-center">
      <Button
        onClick={onImport}
        disabled={loading}
      >
        {loading ? "Importing..." : "Confirm Import"}
      </Button>
    </div>
  );
}