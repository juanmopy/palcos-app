"use client";

import { FileImage, FileText, LoaderCircle, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { prepareReceipt } from "@/lib/image";
import { createClient } from "@/lib/supabase/client";

type ReceiptUploaderProps = {
  paymentId: string;
  folder?: "pagos" | "devoluciones";
  onUploaded: (path: string | null) => void;
};

export function ReceiptUploader({
  paymentId,
  folder = "pagos",
  onUploaded,
}: ReceiptUploaderProps) {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  async function handleFileChange(fileToUpload: File | undefined) {
    if (!fileToUpload) {
      return;
    }

    if (fileToUpload.size > 10 * 1024 * 1024) {
      toast.error("El comprobante no puede superar 10 MB.");
      return;
    }

    setIsUploading(true);
    setProgress(10);
    try {
      const prepared = await prepareReceipt(fileToUpload);
      setProgress(45);
      setFile(prepared);
      setPreviewUrl(
        prepared.type.startsWith("image/")
          ? URL.createObjectURL(prepared)
          : null,
      );

      const extension = prepared.type === "application/pdf" ? "pdf" : "jpg";
      const path = `${folder}/${paymentId}/${crypto.randomUUID()}.${extension}`;
      const supabase = createClient();
      const { error } = await supabase.storage
        .from("comprobantes")
        .upload(path, prepared, {
          contentType: prepared.type,
          upsert: false,
        });
      if (error) {
        throw new Error("No se pudo subir el comprobante.");
      }

      setProgress(100);
      onUploaded(path);
    } catch (error) {
      setFile(null);
      setPreviewUrl(null);
      onUploaded(null);
      toast.error(
        error instanceof Error
          ? error.message
          : "No se pudo preparar el comprobante.",
      );
    } finally {
      setIsUploading(false);
    }
  }

  function removeFile() {
    setFile(null);
    setPreviewUrl(null);
    setProgress(0);
    onUploaded(null);
  }

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-slate-900">
        Comprobante
        <input
          type="file"
          accept="image/*,application/pdf"
          capture="environment"
          disabled={isUploading}
          onChange={(event) => void handleFileChange(event.target.files?.[0])}
          className="mt-2 block min-h-11 w-full rounded-lg border border-slate-300 p-2 text-base file:mr-3 file:rounded-md file:border-0 file:bg-blue-50 file:px-3 file:py-2 file:font-semibold file:text-blue-800"
        />
      </label>

      {isUploading ? (
        <div className="space-y-1" aria-live="polite">
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <LoaderCircle
              className="animate-spin"
              aria-hidden="true"
              size={16}
            />
            Subiendo comprobante...
          </div>
          <div
            className="h-2 overflow-hidden rounded-full bg-slate-200"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={progress}
          >
            <div
              className="h-full bg-blue-700"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      ) : file ? (
        <div className="flex items-center gap-3 rounded-lg border border-slate-200 p-3">
          {previewUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={previewUrl}
              alt="Vista previa del comprobante"
              className="size-16 rounded object-cover"
            />
          ) : file.type === "application/pdf" ? (
            <FileText aria-hidden="true" size={28} />
          ) : (
            <FileImage aria-hidden="true" size={28} />
          )}
          <p className="min-w-0 flex-1 truncate text-sm text-slate-700">
            {file.name}
          </p>
          <button
            type="button"
            onClick={removeFile}
            className="flex size-11 items-center justify-center rounded-lg text-red-700 hover:bg-red-50 focus-visible:ring-2 focus-visible:ring-red-700 focus-visible:outline-none"
            aria-label="Quitar comprobante"
          >
            <Trash2 aria-hidden="true" size={18} />
          </button>
        </div>
      ) : (
        <p className="text-sm text-amber-800">
          Recomendado adjuntar el comprobante.
        </p>
      )}
    </div>
  );
}
