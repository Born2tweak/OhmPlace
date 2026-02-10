'use client'

import { useState, useCallback } from 'react'
import { X, Upload, Image as ImageIcon } from 'lucide-react'

interface ImageUploaderProps {
    maxImages?: number
    onImagesChange: (files: File[]) => void
    existingImages?: string[]
}

export default function ImageUploader({
    maxImages = 5,
    onImagesChange,
    existingImages = []
}: ImageUploaderProps) {
    const [files, setFiles] = useState<File[]>([])
    const [previews, setPreviews] = useState<string[]>(existingImages)
    const [isDragging, setIsDragging] = useState(false)
    const [error, setError] = useState<string>('')

    const validateAndAddFiles = useCallback(
        (newFiles: FileList | File[]) => {
            const filesArray = Array.from(newFiles)
            setError('')

            // Check total count
            if (files.length + filesArray.length > maxImages) {
                setError(`Maximum ${maxImages} images allowed`)
                return
            }

            // Validate each file
            const validFiles: File[] = []
            for (const file of filesArray) {
                // Check file type
                if (!file.type.startsWith('image/')) {
                    setError('Only image files are allowed')
                    continue
                }

                // Check file size (5MB)
                if (file.size > 5 * 1024 * 1024) {
                    setError('Images must be less than 5MB')
                    continue
                }

                validFiles.push(file)
            }

            if (validFiles.length === 0) return

            // Update files
            const updatedFiles = [...files, ...validFiles]
            setFiles(updatedFiles)
            onImagesChange(updatedFiles)

            // Generate previews
            validFiles.forEach((file) => {
                const reader = new FileReader()
                reader.onloadend = () => {
                    setPreviews((prev) => [...prev, reader.result as string])
                }
                reader.readAsDataURL(file)
            })
        },
        [files, maxImages, onImagesChange]
    )

    const handleDrop = useCallback(
        (e: React.DragEvent) => {
            e.preventDefault()
            setIsDragging(false)
            validateAndAddFiles(e.dataTransfer.files)
        },
        [validateAndAddFiles]
    )

    const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            validateAndAddFiles(e.target.files)
        }
    }

    const removeImage = (index: number) => {
        const isExisting = index < existingImages.length
        if (isExisting) {
            // Remove from existing images
            const newExisting = existingImages.filter((_, i) => i !== index)
            setPreviews([...newExisting, ...previews.slice(existingImages.length)])
        } else {
            // Remove from new files
            const fileIndex = index - existingImages.length
            const newFiles = files.filter((_, i) => i !== fileIndex)
            setFiles(newFiles)
            onImagesChange(newFiles)
            setPreviews([
                ...existingImages,
                ...previews.slice(existingImages.length).filter((_, i) => i !== fileIndex)
            ])
        }
        setError('')
    }

    return (
        <div className="w-full">
            <div
                onDrop={handleDrop}
                onDragOver={(e) => {
                    e.preventDefault()
                    setIsDragging(true)
                }}
                onDragLeave={() => setIsDragging(false)}
                className={`
          border-2 border-dashed rounded-lg p-8 text-center transition-colors
          ${isDragging ? 'border-[#22c1c3] bg-[#f4fafb]' : 'border-[#d4e8ea] bg-white'}
          ${files.length >= maxImages ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-[#22c1c3]'}
        `}
            >
                <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleFileInput}
                    disabled={files.length >= maxImages}
                    className="hidden"
                    id="image-upload"
                />
                <label
                    htmlFor="image-upload"
                    className={`cursor-pointer ${files.length >= maxImages ? 'cursor-not-allowed' : ''}`}
                >
                    <Upload className="w-12 h-12 text-[#22c1c3] mx-auto mb-4" />
                    <p className="text-[#2c3e50] font-medium mb-2">
                        {files.length >= maxImages ? 'Maximum images reached' : 'Drop images here or click to upload'}
                    </p>
                    <p className="text-sm text-[#5a6c7d]">
                        {files.length}/{maxImages} images • Max 5MB each
                    </p>
                </label>
            </div>

            {error && (
                <p className="mt-2 text-sm text-red-500">{error}</p>
            )}

            {previews.length > 0 && (
                <div className="mt-6 grid grid-cols-2 md:grid-cols-3 gap-4">
                    {previews.map((preview, index) => (
                        <div key={index} className="relative group">
                            <img
                                src={preview}
                                alt={`Preview ${index + 1}`}
                                className="w-full h-32 object-cover rounded-lg border border-[#d4e8ea]"
                            />
                            <button
                                onClick={() => removeImage(index)}
                                className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                                type="button"
                            >
                                <X className="w-4 h-4" />
                            </button>
                            {index === 0 && (
                                <span className="absolute bottom-2 left-2 bg-[#22c1c3] text-white text-xs px-2 py-1 rounded">
                                    Cover
                                </span>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {files.length === 0 && existingImages.length === 0 && (
                <p className="mt-4 text-sm text-[#95a5a6] text-center">
                    <ImageIcon className="w-4 h-4 inline mr-1" />
                    At least 1 image required
                </p>
            )}
        </div>
    )
}
