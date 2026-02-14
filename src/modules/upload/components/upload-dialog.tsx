"use client";

import { useDropzone } from "react-dropzone";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useUpload } from "../hooks/use-upload";
import {
    IconUpload,
    IconFile,
    IconX,
    IconCheck,
    IconLoader2,
    IconAlertCircle,
} from "@tabler/icons-react";
import { formatBytes } from "@/lib/utils";

interface UploadDialogProps {
    open: boolean;
    onClose: () => void;
    onUploadComplete?: (data: any) => void;
    title?: string;
    description?: string;
    maxSize?: number; // in bytes
    accept?: Record<string, string[]>;
}

export function UploadDialog({
    open,
    onClose,
    onUploadComplete,
    title = "Upload File",
    description = "Upload large files using chunked transmission.",
    maxSize = 10 * 1024 * 1024 * 1024, // 10GB default
    accept,
}: UploadDialogProps) {
    const {
        uploadFile,
        cancelUpload,
        status,
        progress,
        uploadedBytes,
        totalBytes,
        error,
        reset,
    } = useUpload({
        onSuccess: (data) => {
            onUploadComplete?.(data);
        },
    });

    const onDrop = (acceptedFiles: File[]) => {
        if (acceptedFiles.length > 0) {
            uploadFile(acceptedFiles[0]);
        }
    };

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        maxFiles: 1,
        maxSize,
        accept,
        disabled: status !== "idle" && status !== "error" && status !== "cancelled",
    });

    const handleClose = () => {
        if (status === "uploading" || status === "assembling") {
            if (confirm("Upload is in progress. Are you sure you want to cancel?")) {
                cancelUpload();
                onClose();
                reset();
            }
        } else {
            onClose();
            reset();
        }
    };

    return (
        <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription>{description}</DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    {(status === "idle" || status === "error" || status === "cancelled") && (
                        <div
                            {...getRootProps()}
                            className={`flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-10 transition-colors ${isDragActive
                                    ? "border-primary bg-primary/5"
                                    : "border-muted-foreground/25 hover:border-primary/50"
                                } cursor-pointer`}
                        >
                            <input {...getInputProps()} />
                            <IconUpload className="mb-4 h-10 w-10 text-muted-foreground" />
                            <p className="text-sm font-medium">
                                {isDragActive ? "Drop the file here" : "Drag & drop or click to select"}
                            </p>
                            <p className="mt-1 text-xs text-muted-foreground">
                                Max file size: {formatBytes(maxSize)}
                            </p>
                            {error && (
                                <div className="mt-4 flex items-center gap-2 text-xs text-destructive">
                                    <IconAlertCircle className="h-4 w-4" />
                                    <span>{error}</span>
                                </div>
                            )}
                        </div>
                    )}

                    {(status === "uploading" || status === "assembling" || status === "completed") && (
                        <div className="space-y-4 rounded-lg border p-4">
                            <div className="flex items-center gap-3">
                                <div className="rounded-full bg-primary/10 p-2 text-primary">
                                    {status === "completed" ? (
                                        <IconCheck className="h-5 w-5" />
                                    ) : (
                                        <IconFile className="h-5 w-5" />
                                    )}
                                </div>
                                <div className="flex-1 overflow-hidden">
                                    <p className="truncate text-sm font-medium">
                                        {status === "assembling" ? "Assembling file..." : "Uploading..."}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        {status === "completed"
                                            ? "Success"
                                            : `${formatBytes(uploadedBytes)} of ${formatBytes(totalBytes)}`}
                                    </p>
                                </div>
                                {status !== "completed" && (
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                        onClick={cancelUpload}
                                    >
                                        <IconX className="h-4 w-4" />
                                    </Button>
                                )}
                            </div>

                            <div className="space-y-1">
                                <Progress value={progress} className="h-2" />
                                <div className="flex justify-between text-[10px] text-muted-foreground">
                                    <span>{progress.toFixed(0)}%</span>
                                    {status === "assembling" && (
                                        <span className="flex items-center gap-1">
                                            <IconLoader2 className="h-3 w-3 animate-spin" /> Finalizing
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={handleClose}
                        disabled={status === "assembling"}
                    >
                        {status === "completed" ? "Done" : "Cancel"}
                    </Button>
                    {(status === "error" || status === "cancelled") && (
                        <Button onClick={reset}>Try Again</Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
