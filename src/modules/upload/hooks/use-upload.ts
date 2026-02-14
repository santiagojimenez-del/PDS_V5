"use client";

import { useState, useCallback, useRef } from "react";
import { toast } from "sonner";

interface UploadState {
    progress: number;
    status: "idle" | "uploading" | "assembling" | "completed" | "error" | "cancelled";
    error: string | null;
    uploadedBytes: number;
    totalBytes: number;
    uploadId: string | null;
}

interface UseUploadOptions {
    chunkSize?: number;
    onSuccess?: (data: any) => void;
    onError?: (error: string) => void;
}

export function useUpload(options: UseUploadOptions = {}) {
    const { chunkSize = 5 * 1024 * 1024, onSuccess, onError } = options;
    const [state, setState] = useState<UploadState>({
        progress: 0,
        status: "idle",
        error: null,
        uploadedBytes: 0,
        totalBytes: 0,
        uploadId: null,
    });

    const abortControllerRef = useRef<AbortController | null>(null);

    const cancelUpload = useCallback(async () => {
        if (state.uploadId && (state.status === "uploading" || state.status === "assembling")) {
            abortControllerRef.current?.abort();
            try {
                await fetch("/api/upload/cancel", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ uploadId: state.uploadId }),
                });
            } catch (e) {
                console.error("Failed to cancel upload on server", e);
            }
        }
        setState((prev) => ({ ...prev, status: "cancelled" }));
    }, [state.uploadId, state.status]);

    const uploadFile = useCallback(async (file: File) => {
        abortControllerRef.current = new AbortController();
        const signal = abortControllerRef.current.signal;

        setState({
            progress: 0,
            status: "uploading",
            error: null,
            uploadedBytes: 0,
            totalBytes: file.size,
            uploadId: null,
        });

        try {
            // 1. Initiate
            const initRes = await fetch("/api/upload/initiate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    fileName: file.name,
                    fileSize: file.size,
                    mimeType: file.type,
                    chunkSize: chunkSize,
                }),
                signal,
            });

            if (!initRes.ok) throw new Error("Failed to initiate upload");
            const { data: initData } = await initRes.json();
            const { uploadId, totalChunks } = initData;

            setState((prev) => ({ ...prev, uploadId }));

            // 2. Upload Chunks
            let uploadedChunks = 0;
            for (let i = 0; i < totalChunks; i++) {
                if (signal.aborted) return;

                const start = i * chunkSize;
                const end = Math.min(start + chunkSize, file.size);
                const chunk = file.slice(start, end);

                const formData = new FormData();
                formData.append("uploadId", uploadId);
                formData.append("chunkIndex", i.toString());
                formData.append("chunk", chunk);

                const chunkRes = await fetch("/api/upload/chunk", {
                    method: "POST",
                    body: formData,
                    signal,
                });

                if (!chunkRes.ok) {
                    const errorJson = await chunkRes.json().catch(() => ({}));
                    throw new Error(errorJson.error || `Failed to upload chunk ${i}`);
                }

                uploadedChunks++;
                const currentProgress = (uploadedChunks / totalChunks) * 100;
                const currentUploadedBytes = Math.min(uploadedChunks * chunkSize, file.size);

                setState((prev) => ({
                    ...prev,
                    progress: currentProgress,
                    uploadedBytes: currentUploadedBytes,
                }));
            }

            // 3. Complete
            setState((prev) => ({ ...prev, status: "assembling" }));
            const completeRes = await fetch("/api/upload/complete", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ uploadId }),
                signal,
            });

            if (!completeRes.ok) throw new Error("Failed to assemble file");
            const { data: completeData } = await completeRes.json();

            setState((prev) => ({ ...prev, status: "completed", progress: 100 }));
            onSuccess?.(completeData);
            toast.success("File uploaded successfully");
        } catch (err: any) {
            if (err.name === "AbortError") return;
            const errorMessage = err.message || "An error occurred during upload";
            setState((prev) => ({ ...prev, status: "error", error: errorMessage }));
            onError?.(errorMessage);
            toast.error(errorMessage);
        }
    }, [chunkSize, onSuccess, onError]);

    const reset = useCallback(() => {
        setState({
            progress: 0,
            status: "idle",
            error: null,
            uploadedBytes: 0,
            totalBytes: 0,
            uploadId: null,
        });
    }, []);

    return {
        ...state,
        uploadFile,
        cancelUpload,
        reset,
    };
}
