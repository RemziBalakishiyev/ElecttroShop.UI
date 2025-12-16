import apiClient from "./apiClient";
import type { ApiResponse } from "../types/auth.types";

// --- Types ---

export interface Image {
    id: string;
    url: string;
    fileName: string;
    contentType: string;
    size: number;
    uploadedAt: string;
}

export interface UploadImageResponse {
    imageId: string;
}

// --- API Functions ---

export const imagesApi = {
    uploadImage: async (file: File) => {
        const formData = new FormData();
        formData.append("file", file);

        const response = await apiClient.post<ApiResponse<UploadImageResponse>>(
            "/images/upload",
            formData,
            {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            }
        );
        return response.data;
    },

    deleteImage: async (imageId: string) => {
        const response = await apiClient.delete<ApiResponse<null>>(
            `/images/${imageId}`
        );
        return response.data;
    },
};


