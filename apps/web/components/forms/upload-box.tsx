"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface UploadBoxProps {
  /** Accepted MIME types or extensions, e.g. ".pdf,.docx" or "image/*" */
  accept?: string;
  multiple?: boolean;
  maxSizeMB?: number;
  /** Called whenever the selected file list changes */
  onFilesChange?: (files: File[]) => void;
  /** Hint text shown inside the box */
  hint?: string;
  /** Disable the upload box */
  disabled?: boolean;
  error?: string;
  className?: string;
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function UploadBox({
  accept,
  multiple = false,
  maxSizeMB,
  onFilesChange,
  hint,
  disabled = false,
  error,
  className,
}: UploadBoxProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = React.useState(false);
  const [files, setFiles] = React.useState<File[]>([]);
  const [sizeError, setSizeError] = React.useState<string | null>(null);

  function addFiles(incoming: FileList | null) {
    if (!incoming) return;
    const arr = Array.from(incoming);
    if (maxSizeMB) {
      const oversize = arr.find((f) => f.size > maxSizeMB * 1024 * 1024);
      if (oversize) {
        setSizeError(`文件 "${oversize.name}" 超过 ${maxSizeMB} MB 限制`);
        return;
      }
    }
    setSizeError(null);
    const next = multiple ? [...files, ...arr] : arr;
    setFiles(next);
    onFilesChange?.(next);
  }

  function removeFile(index: number) {
    const next = files.filter((_, i) => i !== index);
    setFiles(next);
    onFilesChange?.(next);
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    if (!disabled) addFiles(e.dataTransfer.files);
  }

  const displayError = error ?? sizeError;

  return (
    <div className={cn("space-y-2", className)}>
      <div
        onClick={() => !disabled && inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); if (!disabled) setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={cn(
          "relative flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed px-6 py-10 text-center transition-colors",
          dragging
            ? "border-blue-400 bg-blue-50"
            : displayError
            ? "border-red-300 bg-red-50"
            : "border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-white",
          disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          disabled={disabled}
          className="sr-only"
          onChange={(e) => addFiles(e.target.files)}
        />
        {/* Upload icon */}
        <div className={cn("flex h-12 w-12 items-center justify-center rounded-2xl", dragging ? "bg-blue-100" : "bg-slate-100")}>
          <svg className={cn("h-6 w-6", dragging ? "text-blue-600" : "text-slate-400")} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
          </svg>
        </div>
        <div>
          <p className="text-sm font-medium text-slate-700">
            <span className="text-blue-600">点击上传</span>
            {" "}或拖拽文件至此
          </p>
          {hint && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
          {maxSizeMB && !hint && (
            <p className="mt-1 text-xs text-slate-400">最大 {maxSizeMB} MB</p>
          )}
        </div>
      </div>

      {/* Error */}
      {displayError && (
        <p className="flex items-center gap-1.5 text-xs text-red-600">
          <svg className="h-3.5 w-3.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {displayError}
        </p>
      )}

      {/* File list */}
      {files.length > 0 && (
        <ul className="space-y-1.5">
          {files.map((f, i) => (
            <li key={i} className="flex items-center gap-3 rounded-xl border border-slate-100 bg-white px-3 py-2">
              <svg className="h-4 w-4 shrink-0 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
              </svg>
              <span className="min-w-0 flex-1 truncate text-sm text-slate-700">{f.name}</span>
              <span className="shrink-0 text-xs text-slate-400">{formatBytes(f.size)}</span>
              <button
                type="button"
                onClick={() => removeFile(i)}
                className="shrink-0 rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
