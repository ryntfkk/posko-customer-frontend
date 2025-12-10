'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import { uploadApi } from '@/features/upload/api';

interface ImageUploaderProps {
  label?: string;
  defaultImage?: string;
  onUploadSuccess: (url: string) => void;
  className?: string;
}

export default function ImageUploader({ 
  label = "Upload Image", 
  defaultImage = "", 
  onUploadSuccess,
  className = "" 
}: ImageUploaderProps) {
  const [preview, setPreview] = useState<string>(defaultImage);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validasi sederhana di sisi client
    if (!file.type.startsWith('image/')) {
      setError('Mohon upload file gambar (JPG, PNG, dll).');
      return;
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB
      setError('Ukuran file maksimal 5MB.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // 1. Buat preview lokal agar user merasa responsif
      const objectUrl = URL.createObjectURL(file);
      setPreview(objectUrl);

      // 2. Upload ke Backend -> S3
      const s3Url = await uploadApi.uploadImage(file);
      
      // 3. Kirim URL S3 ke parent component (misal: form state)
      onUploadSuccess(s3Url);
      
      // Update preview dengan URL asli dari server (opsional, tapi bagus untuk memastikan)
      setPreview(s3Url);
    } catch (err: any) {
      console.error('Upload failed:', err);
      setError(err?.response?.data?.message || 'Gagal mengupload gambar. Silakan coba lagi.');
      // Reset preview jika gagal
      setPreview(defaultImage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <label className="text-sm font-medium text-gray-700">
        {label}
      </label>
      
      <div className="flex items-start gap-4">
        {/* Preview Box */}
        <div className="relative w-24 h-24 border rounded-lg overflow-hidden bg-gray-50 flex-shrink-0">
          {preview ? (
            <Image 
              src={preview} 
              alt="Preview" 
              fill 
              className="object-cover"
            />
          ) : (
            <div className="flex items-center justify-center w-full h-full text-gray-300">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          )}
          
          {isLoading && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
            disabled={isLoading}
          />
          
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading}
            className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {isLoading ? 'Mengupload...' : 'Pilih Gambar'}
          </button>
          
          <p className="text-xs text-gray-500">
            JPG, PNG atau GIF. Maks 5MB.
          </p>

          {error && (
            <p className="text-xs text-red-600 mt-1">
              {error}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}