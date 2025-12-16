"use client"

import { useCallback, useRef, useState } from "react"

export interface FileWithPreview {
  id: string
  file: File
  preview: string
}

interface UseFileUploadOptions {
  accept?: string
  multiple?: boolean
  maxFiles?: number
}

interface UseFileUploadReturn {
  files: FileWithPreview[]
  isDragging: boolean
}

interface UseFileUploadActions {
  handleDragEnter: (e: React.DragEvent) => void
  handleDragLeave: (e: React.DragEvent) => void
  handleDragOver: (e: React.DragEvent) => void
  handleDrop: (e: React.DragEvent) => void
  openFileDialog: () => void
  removeFile: (id: string) => void
  getInputProps: () => {
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
    accept?: string
    multiple?: boolean
  }
}

export function useFileUpload(
  options: UseFileUploadOptions = {}
): [UseFileUploadReturn, UseFileUploadActions] {
  const { accept, multiple = false, maxFiles = 1 } = options
  const [files, setFiles] = useState<FileWithPreview[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const dragCounterRef = useRef(0)
  const inputRef = useRef<HTMLInputElement | null>(null)

  const createFilePreview = useCallback((file: File): FileWithPreview => {
    const id = `${Date.now()}-${Math.random()}`
    const preview = URL.createObjectURL(file)
    return { id, file, preview }
  }, [])

  const addFiles = useCallback(
    (newFiles: FileList | File[]) => {
      const fileArray = Array.from(newFiles)
      const validFiles = fileArray.filter((file) => {
        if (accept && !file.type.match(accept.replace("*", ".*"))) {
          return false
        }
        return true
      })

      const filesToAdd = validFiles.slice(0, maxFiles - files.length)
      const newFilePreviews = filesToAdd.map(createFilePreview)

      setFiles((prev) => {
        if (multiple) {
          return [...prev, ...newFilePreviews]
        }
        return newFilePreviews.slice(0, 1)
      })
    },
    [accept, maxFiles, files.length, multiple, createFilePreview]
  )

  const removeFile = useCallback((id: string) => {
    setFiles((prev) => {
      const fileToRemove = prev.find((f) => f.id === id)
      if (fileToRemove) {
        URL.revokeObjectURL(fileToRemove.preview)
      }
      return prev.filter((f) => f.id !== id)
    })
  }, [])

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    dragCounterRef.current += 1
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true)
    }
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    dragCounterRef.current -= 1
    if (dragCounterRef.current === 0) {
      setIsDragging(false)
    }
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setIsDragging(false)
      dragCounterRef.current = 0

      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        addFiles(e.dataTransfer.files)
      }
    },
    [addFiles]
  )

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        addFiles(e.target.files)
      }
      // Reset input value to allow selecting the same file again
      if (inputRef.current) {
        inputRef.current.value = ""
      }
    },
    [addFiles]
  )

  const openFileDialog = useCallback(() => {
    // Try to find the input element by data attribute
    const input = document.querySelector<HTMLInputElement>(
      'input[data-file-upload-input="true"]'
    )
    if (input) {
      input.click()
    } else {
      // Fallback: create a temporary input if not found
      const tempInput = document.createElement("input")
      tempInput.type = "file"
      tempInput.accept = accept || ""
      tempInput.multiple = multiple || false
      tempInput.style.display = "none"
      tempInput.addEventListener("change", (e) => {
        const target = e.target as HTMLInputElement
        if (target.files) {
          handleInputChange({ target } as React.ChangeEvent<HTMLInputElement>)
        }
      })
      document.body.appendChild(tempInput)
      tempInput.click()
      setTimeout(() => {
        document.body.removeChild(tempInput)
      }, 100)
    }
  }, [accept, multiple, handleInputChange])

  const getInputProps = useCallback(
    () => ({
      onChange: handleInputChange,
      accept,
      multiple,
      "data-file-upload-input": "true" as const,
    }),
    [handleInputChange, accept, multiple]
  )

  return [
    { files, isDragging },
    {
      handleDragEnter,
      handleDragLeave,
      handleDragOver,
      handleDrop,
      openFileDialog,
      removeFile,
      getInputProps,
    },
  ]
}

