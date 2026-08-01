"use client";

import { FileText, FileSpreadsheet, FileDown } from "lucide-react";
import { Button } from "@/components/ui/button";

type Row = Record<string, string | number>;

function toCSV(rows: Row[]): string {
  if (!rows.length) return "";
  const headers = Object.keys(rows[0]);
  const escape = (v: string | number) => {
    const s = String(v).replace(/"/g, '""');
    return /[",\n;]/.test(s) ? `"${s}"` : s;
  };
  const lines = [
    headers.join(";"),
    ...rows.map((r) => headers.map((h) => escape(r[h])).join(";")),
  ];
  return "﻿" + lines.join("\n");
}

function download(content: string, filename: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function ExportButtons({
  rows,
  filename,
}: {
  rows: Row[];
  filename: string;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={() => download(toCSV(rows), `${filename}.csv`, "text/csv;charset=utf-8")}
      >
        <FileDown className="size-4" /> CSV
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() =>
          download(toCSV(rows), `${filename}.xls`, "application/vnd.ms-excel")
        }
      >
        <FileSpreadsheet className="size-4" /> Excel
      </Button>
      <Button variant="outline" size="sm" onClick={() => window.print()}>
        <FileText className="size-4" /> PDF / Imprimir
      </Button>
    </div>
  );
}
