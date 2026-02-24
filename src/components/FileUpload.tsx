import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Upload, X, FileText, Image, Video, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface UploadedFile {
  id: string;
  file_name: string;
  file_url: string;
  file_type: string;
  category: string;
}

interface FileUploadProps {
  reportId: string | null;
  category: string;
  label: string;
  description: string;
  accept: string;
  multiple?: boolean;
  files: UploadedFile[];
  onFilesChange: (files: UploadedFile[]) => void;
}

const FileUpload = ({
  reportId,
  category,
  label,
  description,
  accept,
  multiple = true,
  files,
  onFilesChange,
}: FileUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles || selectedFiles.length === 0) return;

    if (!reportId) {
      toast.error("Salve o relatório como rascunho antes de enviar arquivos.");
      return;
    }

    setUploading(true);
    const newFiles: UploadedFile[] = [];

    for (const file of Array.from(selectedFiles)) {
      if (file.size > 20 * 1024 * 1024) {
        toast.error(`${file.name} excede o limite de 20MB.`);
        continue;
      }

      const ext = file.name.split(".").pop();
      const path = `${reportId}/${category}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("report-files")
        .upload(path, file);

      if (uploadError) {
        toast.error(`Erro ao enviar ${file.name}`);
        continue;
      }

      const { data: urlData } = supabase.storage
        .from("report-files")
        .getPublicUrl(path);

      const { data: attachmentData, error: dbError } = await supabase
        .from("report_attachments")
        .insert({
          report_id: reportId,
          file_name: file.name,
          file_url: urlData.publicUrl,
          file_type: file.type,
          category,
        })
        .select()
        .single();

      if (!dbError && attachmentData) {
        newFiles.push({
          id: attachmentData.id,
          file_name: attachmentData.file_name,
          file_url: attachmentData.file_url,
          file_type: attachmentData.file_type,
          category: attachmentData.category,
        });
      }
    }

    if (newFiles.length > 0) {
      onFilesChange([...files, ...newFiles]);
      toast.success(`${newFiles.length} arquivo(s) enviado(s)!`);
    }

    setUploading(false);
    if (inputRef.current) inputRef.current.value = "";
  };

  const handleRemove = async (file: UploadedFile) => {
    const { error } = await supabase
      .from("report_attachments")
      .delete()
      .eq("id", file.id);

    if (!error) {
      onFilesChange(files.filter((f) => f.id !== file.id));
      toast.success("Arquivo removido.");
    } else {
      toast.error("Erro ao remover arquivo.");
    }
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith("image/")) return <Image className="w-5 h-5 text-primary" />;
    if (type.startsWith("video/")) return <Video className="w-5 h-5 text-primary" />;
    return <FileText className="w-5 h-5 text-primary" />;
  };

  const isImage = (type: string) => type.startsWith("image/");
  const isVideo = (type: string) => type.startsWith("video/");

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-medium text-foreground text-sm">{label}</p>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </div>

      {/* Upload area */}
      <div
        onClick={() => !uploading && inputRef.current?.click()}
        className={cn(
          "border-2 border-dashed border-border rounded-xl p-6 text-center cursor-pointer transition-colors hover:border-primary/50 hover:bg-primary/5",
          uploading && "opacity-50 cursor-not-allowed"
        )}
      >
        {uploading ? (
          <Loader2 className="w-8 h-8 text-primary mx-auto animate-spin mb-2" />
        ) : (
          <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
        )}
        <p className="text-sm text-muted-foreground">
          {uploading ? "Enviando..." : "Clique para selecionar arquivos"}
        </p>
        <p className="text-xs text-muted-foreground mt-1">{accept}</p>
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleUpload}
          className="hidden"
        />
      </div>

      {/* File list / preview */}
      {files.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {files.map((file) => (
            <div
              key={file.id}
              className="relative group rounded-lg border border-border overflow-hidden bg-card"
            >
              {isImage(file.file_type) ? (
                <img
                  src={file.file_url}
                  alt={file.file_name}
                  className="w-full h-28 object-cover"
                />
              ) : isVideo(file.file_type) ? (
                <video
                  src={file.file_url}
                  className="w-full h-28 object-cover"
                  controls
                />
              ) : (
                <div className="w-full h-28 flex items-center justify-center bg-muted">
                  {getFileIcon(file.file_type)}
                </div>
              )}
              <div className="p-2">
                <p className="text-xs text-foreground truncate">{file.file_name}</p>
              </div>
              <button
                onClick={() => handleRemove(file)}
                className="absolute top-1 right-1 w-6 h-6 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FileUpload;
