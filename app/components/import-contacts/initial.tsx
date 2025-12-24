/* eslint-disable @typescript-eslint/no-explicit-any */
import { Button } from '@/modules/shadcn/ui/button'
import { cn } from '@shadcn/lib/utils'
import { AlertCircle, File, FileCheck, FileDown, Import, Loader2, XCircle } from 'lucide-react'
import { useState } from 'react'
import CSVReader, { IFileInfo } from 'react-csv-reader'

interface IProps {
  onFileLoaded: (data: any[], fileInfo: IFileInfo) => void
  onError: (error: Error) => void
  maxFileSize: number
}

export function ImportContactsInitial({ onFileLoaded, onError, maxFileSize }: IProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const csvReaderInputId = 'csv-file-input'

  const parseOptions = {
    header: true,
    dynamicTyping: true,
    skipEmptyLines: true,
    transformHeader: (header: string) => header.toLowerCase().replace(/\W/g, '_'),
  }

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    // Only set isDragging to false if we're actually leaving the drop zone
    // (not just moving over a child element)
    const currentTarget = e.currentTarget as HTMLElement
    const relatedTarget = e.relatedTarget as HTMLElement | null

    if (!currentTarget.contains(relatedTarget)) {
      setIsDragging(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    const files = e.dataTransfer.files
    if (files && files.length > 0) {
      const file = files[0]

      // Validate file type
      if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
        setError('Please upload a valid CSV file.')
        return
      }

      // Validate file size
      if (file.size > maxFileSize) {
        setError(
          `File size exceeds the maximum limit of 500KB. Current file size: ${(file.size / 1024).toFixed(2)}KB`
        )
        return
      }

      setIsLoading(true)
      setIsProcessing(true)
      setError(null)
      setUploadProgress(0)

      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress((p) => {
          if (p >= 90) {
            clearInterval(progressInterval)
            return p
          }
          return p + 10
        })
      }, 100)

      // Trigger CSVReader to process the file
      const input = document.getElementById(csvReaderInputId) as HTMLInputElement
      if (input) {
        const dataTransfer = new DataTransfer()
        dataTransfer.items.add(file)
        input.files = dataTransfer.files
        input.dispatchEvent(new Event('change', { bubbles: true }))
      }
    }
  }

  const handleFileLoaded = (data: any[], fileInfo: IFileInfo) => {
    setIsLoading(false)
    setIsProcessing(false)
    setUploadProgress(100)
    setError(null)
    onFileLoaded(data, fileInfo)
  }

  const handleError = (error: Error) => {
    setIsLoading(false)
    setIsProcessing(false)
    setError(`Error reading CSV file: ${error.message}`)
    onError(error)
  }

  return (
    <>
      <div
        className={cn(
          `flex flex-col items-center justify-center gap-4 p-12 border-2 border-dashed rounded-lg
          cursor-pointer transition-colors group`,
          isDragging
            ? 'border-primary bg-primary/10'
            : 'border-muted-foreground/30 hover:border-primary',
          error && 'border-destructive bg-destructive/5',
          isProcessing && 'border-primary bg-primary/5'
        )}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => {
          const input = document.getElementById(csvReaderInputId) as HTMLInputElement
          input?.click()
        }}
        tabIndex={0}
        role="button"
        aria-label="Upload CSV file"
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            const input = document.getElementById(csvReaderInputId) as HTMLInputElement
            input?.click()
          }
        }}>
        {isProcessing || isLoading ? (
          <ImportProcessing uploadProgress={uploadProgress} isProcessing={isProcessing} />
        ) : error ? (
          <ImportError
            error={error}
            onTryAgain={() => {
              setError(null)
              setIsLoading(false)
              setIsProcessing(false)
              setUploadProgress(0)
            }}
          />
        ) : (
          <ImportUpload isDragging={isDragging} />
        )}

        <CSVReader
          cssClass="hidden"
          label=""
          onFileLoaded={handleFileLoaded}
          onError={handleError}
          parserOptions={parseOptions}
          inputId={csvReaderInputId}
        />
      </div>

      {!isProcessing && !isLoading && (
        <a
          href="/sample.csv"
          download
          className="flex mt-3 items-center justify-center gap-2 p-3 border-2 border-dashed
            border-muted-foreground/30 rounded-lg cursor-pointer transition-colors
            hover:border-primary group">
          <FileDown className="h-5 w-5 group-hover:text-primary" />
          <p className="font-semibold group-hover:text-primary">Download our sample CSV</p>
        </a>
      )}
    </>
  )
}

export function ImportUpload({ isDragging }: { isDragging: boolean }) {
  return (
    <div className="flex flex-col items-center">
      <Import
        className={cn(
          'h-16 w-16 mb-2 text-muted-foreground group-hover:text-primary',
          isDragging && 'transition-all duration-500 scale-110 animate-bounce text-primary'
        )}
      />
      <div className="text-center space-y-2">
        <h3
          className={cn(
            'text-xl font-semibold transition-colors group-hover:text-primary',
            isDragging && 'text-primary'
          )}>
          {isDragging ? 'Drop your CSV file here' : 'Drag and drop your CSV file'}
        </h3>
        <p className="text-sm text-muted-foreground">
          or{' '}
          <span
            className="text-primary font-medium underline decoration-2 underline-offset-2
              group-hover:text-primary">
            browse
          </span>{' '}
          for a file
        </p>
        <div className="flex items-center justify-center gap-2 pt-2">
          <FileCheck className="h-4 w-4 text-muted-foreground" />
          <p className="text-xs text-muted-foreground">Supported format: CSV files only</p>
        </div>
      </div>
    </div>
  )
}

export function ImportProcessing({
  uploadProgress,
  isProcessing,
}: {
  uploadProgress: number
  isProcessing: boolean
}) {
  return (
    <div className="flex flex-col items-center gap-4 w-full">
      <div className="relative">
        <Loader2 className="h-16 w-16 text-primary animate-spin" />
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs font-semibold text-primary">{uploadProgress}%</span>
        </div>
      </div>
      <div className="w-full max-w-xs">
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-300 ease-out rounded-full"
            style={{ width: `${uploadProgress}%` }}
          />
        </div>
      </div>
      <div className="text-center">
        <h3 className="text-lg font-semibold">Processing CSV file...</h3>
        <p className="text-sm text-muted-foreground mt-1">
          {isProcessing ? 'Reading file contents...' : 'Validating data...'}
        </p>
      </div>
    </div>
  )
}

export function ImportError({ error, onTryAgain }: { error: string; onTryAgain: () => void }) {
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative">
        <XCircle className="h-16 w-16 text-destructive animate-in fade-in zoom-in duration-200" />
        <div className="absolute -top-1 -right-1">
          <AlertCircle className="h-6 w-6 text-destructive fill-background" />
        </div>
      </div>
      <div className="text-center">
        <h3 className="text-lg font-semibold text-destructive mb-2">Error</h3>
        <p className="text-sm text-muted-foreground text-center max-w-md mb-4">{error}</p>
        <Button
          variant="outline"
          size="sm"
          onClick={(e) => {
            e.stopPropagation()
            onTryAgain()
          }}>
          Try Again
        </Button>
      </div>
    </div>
  )
}
