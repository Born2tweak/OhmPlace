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

            if (files.length + filesArray.length > maxImages) {
                setError(`Maximum ${maxImages} images allowed`)
                return
            }

            const validFiles: File[] = []
            for (const file of filesArray) {
                if (!file.type.startsWith('image/')) {
                    setError('Only image files are allowed')
                    continue
                }
                if (file.size > 5 * 1024 * 1024) {
                    setError('Images must be less than 5MB')
                    continue
                }
                validFiles.push(file)
            }

            if (validFiles.length === 0) return

            const updatedFiles = [...files, ...validFiles]
            setFiles(updatedFiles)
            onImagesChange(updatedFiles)

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
            const newExisting = existingImages.filter((_, i) => i !== index)
            setPreviews([...newExisting, ...previews.slice(existingImages.length)])
        } else {
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
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
                onDragLeave={() => setIsDragging(false)}
                className="border-2 border-dashed rounded-lg p-8 text-center transition-colors"
                style={{
                    borderColor: isDragging ? 'var(--brand-primary)' : 'var(--border-subtle)',
                    background: isDragging ? 'var(--bg-lighter)' : 'var(--bg-card)',
                    opacity: files.length >= maxImages ? 0.5 : 1,
                    cursor: files.length >= maxImages ? 'not-allowed' : 'pointer',
                }}
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
                    <Upload className="w-12 h-12 mx-auto mb-4" style={{ color: 'var(--brand-primary)' }} />
                    <p className="font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                        {files.length >= maxImages ? 'Maximum images reached' : 'Drop images here or click to upload'}
                    </p>
                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
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
                                className="w-full h-32 object-cover rounded-lg"
                                style={{ border: '1px solid var(--border-subtle)' }}
                            />
                            <button
                                onClick={() => removeImage(index)}
                                className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                                type="button"
                            >
                                <X className="w-4 h-4" />
                            </button>
                            {index === 0 && (
                                <span className="absolute bottom-2 left-2 text-white text-xs px-2 py-1 rounded"
                                    style={{ background: 'var(--brand-primary)' }}>
                                    Cover
                                </span>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {files.length === 0 && existingImages.length === 0 && (
                <p className="mt-4 text-sm text-center" style={{ color: 'var(--text-muted)' }}>
                    <ImageIcon className="w-4 h-4 inline mr-1" />
                    At least 1 image required
                </p>
            )}
        </div>
    )
}
