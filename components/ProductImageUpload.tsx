'use client'

import { useState, useCallback, useEffect } from 'react'
import { useDropzone } from 'react-dropzone'
import Image from 'next/image'
import { FiUpload, FiX, FiPlus, FiImage, FiEdit2 } from 'react-icons/fi'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { toast } from 'sonner'

interface ProductImageUploadProps {
  styleId: number
  onImagesChange: (images: string[]) => void
  initialImages?: string[]
}

interface ImageSet {
  large: string
  medium: string
  small: string
}

export function ProductImageUpload({ 
  styleId, 
  onImagesChange,
  initialImages = [] 
}: ProductImageUploadProps) {
  const [mainImageSet, setMainImageSet] = useState<ImageSet | null>(null)
  const [alternateImages, setAlternateImages] = useState<string[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [editingImageIndex, setEditingImageIndex] = useState<number | null>(null)

  // Initialize images from props
  useEffect(() => {
    console.log('Initial images received:', initialImages)
    if (initialImages && initialImages.length > 0) {
      const mainImage = initialImages[0]
      if (mainImage) {
        setMainImageSet({
          large: mainImage,
          medium: mainImage,
          small: mainImage
        })
      }
      
      if (initialImages.length > 1) {
        setAlternateImages(initialImages.slice(1))
      }
    }
  }, [initialImages])

  const handleImageUpload = async (file: File, isAlternate: boolean = false, index?: number) => {
    setIsUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('styleId', styleId.toString())
      if (isAlternate) {
        formData.append('isAlternate', 'true')
      }

      const response = await fetch('/api/upload/product-image', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error('Failed to upload image')
      }

      const data = await response.json()
      console.log('Upload response:', data)

      if (isAlternate && typeof index === 'number') {
        // Replace specific alternate image
        const newAlternateImages = [...(alternateImages || [])]
        newAlternateImages[index] = data.mainImage
        setAlternateImages(newAlternateImages)
        onImagesChange([mainImageSet?.large || '', ...newAlternateImages])
      } else if (isAlternate) {
        // Add new alternate image
        const newAlternateImages = [...(alternateImages || []), data.mainImage]
        setAlternateImages(newAlternateImages)
        onImagesChange([mainImageSet?.large || '', ...newAlternateImages])
      } else {
        // Update main image
        setMainImageSet({
          large: data.mainImage,
          medium: data.mediumImage,
          small: data.smallImage
        })
        onImagesChange([data.mainImage, ...(alternateImages || [])])
      }

      toast.success('Image uploaded successfully')
    } catch (error) {
      console.error('Error uploading image:', error)
      toast.error('Failed to upload image')
    } finally {
      setIsUploading(false)
      setEditingImageIndex(null)
    }
  }

  // Create dropzone hooks at the top level
  const { getRootProps: getMainRootProps, getInputProps: getMainInputProps } = useDropzone({
    onDrop: async (acceptedFiles) => {
      if (acceptedFiles.length === 0) return
      await handleImageUpload(acceptedFiles[0])
    },
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.webp']
    },
    maxFiles: 1,
    disabled: isUploading
  })

  const { getRootProps: getAlternateRootProps, getInputProps: getAlternateInputProps } = useDropzone({
    onDrop: async (acceptedFiles) => {
      if (acceptedFiles.length === 0) return
      await handleImageUpload(acceptedFiles[0], true)
    },
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.webp']
    },
    disabled: isUploading
  })

  const { getRootProps: getAlternateEditRootProps, getInputProps: getAlternateEditInputProps } = useDropzone({
    onDrop: async (acceptedFiles) => {
      if (acceptedFiles.length === 0 || editingImageIndex === null) return
      await handleImageUpload(acceptedFiles[0], true, editingImageIndex)
    },
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.webp']
    },
    maxFiles: 1,
    disabled: isUploading
  })

  const removeAlternateImage = (index: number) => {
    const newAlternateImages = (alternateImages || []).filter((_, i) => i !== index)
    setAlternateImages(newAlternateImages)
    onImagesChange([mainImageSet?.large || '', ...newAlternateImages])
  }

  console.log('Current state:', { mainImageSet, alternateImages })

  return (
    <div className="space-y-6">
      {/* Main Image Upload */}
      <div className="space-y-2">
        <h3 className="text-lg font-medium">Main Product Image</h3>
        <p className="text-sm text-muted-foreground">
          Upload a high-quality image. The system will automatically create medium and small versions.
        </p>
        <Card className="p-4">
          {isUploading ? (
            <div className="flex items-center justify-center p-8">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                <p className="text-sm text-gray-500">Processing images...</p>
              </div>
            </div>
          ) : mainImageSet ? (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                {/* Large Image */}
                <div className="space-y-2">
                  <div className="relative aspect-square w-full group">
                    <Image
                      src={mainImageSet.large}
                      alt="Large product image"
                      fill
                      className="object-cover rounded-lg"
                    />
                    <div className="absolute top-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
                      Large (1200px)
                    </div>
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2">
                      <div {...getMainRootProps()}>
                        <input {...getMainInputProps()} />
                        <Button
                          variant="secondary"
                          size="icon"
                          className="h-8 w-8"
                        >
                          <FiEdit2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <Button
                        variant="destructive"
                        size="icon"
                        onClick={() => {
                          setMainImageSet(null)
                          onImagesChange(alternateImages || [])
                        }}
                        className="h-8 w-8"
                      >
                        <FiX className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <p className="text-xs text-center text-muted-foreground">Large</p>
                </div>

                {/* Medium Image */}
                <div className="space-y-2">
                  <div className="relative aspect-square w-full">
                    <Image
                      src={mainImageSet.medium}
                      alt="Medium product image"
                      fill
                      className="object-cover rounded-lg"
                    />
                    <div className="absolute top-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
                      Medium (600px)
                    </div>
                  </div>
                  <p className="text-xs text-center text-muted-foreground">Medium</p>
                </div>

                {/* Small Image */}
                <div className="space-y-2">
                  <div className="relative aspect-square w-full">
                    <Image
                      src={mainImageSet.small}
                      alt="Small product image"
                      fill
                      className="object-cover rounded-lg"
                    />
                    <div className="absolute top-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
                      Small (300px)
                    </div>
                  </div>
                  <p className="text-xs text-center text-muted-foreground">Small</p>
                </div>
              </div>
            </div>
          ) : (
            <div
              {...getMainRootProps()}
              className="border-2 border-dashed border-gray-200 rounded-lg p-8 text-center cursor-pointer hover:border-gray-300 transition-colors"
            >
              <input {...getMainInputProps()} />
              <div className="flex flex-col items-center gap-2">
                <FiUpload className="h-8 w-8 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Click to upload or drag and drop</p>
                  <p className="text-xs text-gray-500">PNG, JPG, JPEG or WEBP (max. 10MB)</p>
                </div>
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Alternate Images */}
      <div className="space-y-2">
        <h3 className="text-lg font-medium">Alternate Images</h3>
        <p className="text-sm text-muted-foreground">
          Add additional product images to showcase different angles or features.
        </p>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {(alternateImages || []).map((image, index) => (
            <Card key={index} className="relative aspect-square group">
              <Image
                src={image}
                alt={`Alternate image ${index + 1}`}
                fill
                className="object-cover rounded-lg"
              />
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2">
                <div {...getAlternateEditRootProps()} onClick={() => setEditingImageIndex(index)}>
                  <input {...getAlternateEditInputProps()} />
                  <Button
                    variant="secondary"
                    size="icon"
                    className="h-8 w-8"
                  >
                    <FiEdit2 className="h-4 w-4" />
                  </Button>
                </div>
                <Button
                  variant="destructive"
                  size="icon"
                  onClick={() => removeAlternateImage(index)}
                  className="h-8 w-8"
                >
                  <FiX className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          ))}
          <Card
            {...getAlternateRootProps()}
            className="aspect-square border-2 border-dashed rounded-lg p-4 flex items-center justify-center cursor-pointer hover:border-primary transition-colors"
          >
            <input {...getAlternateInputProps()} />
            <div className="text-center">
              <FiPlus className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Add more images
              </p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
} 