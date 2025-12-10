import { Button } from '@shadcn/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@shadcn/ui/dialog'
import { Loader2, Trash2 } from 'lucide-react'
import { forwardRef, useImperativeHandle, useState } from 'react'

export interface DeleteConfirmationHandle {
  open: (config?: DeleteConfirmationConfig) => void
  close: () => void
  updateConfig: (updates: Partial<DeleteConfirmationConfig>) => void
}

export interface DeleteConfirmationConfig {
  title: string
  description: string
  onDelete: () => void | Promise<void>
  isLoading?: boolean
}

interface DeleteConfirmationProps {
  defaultConfig?: DeleteConfirmationConfig
}

const DeleteConfirmation = forwardRef<DeleteConfirmationHandle, DeleteConfirmationProps>(
  ({ defaultConfig }, ref) => {
    const [open, setOpen] = useState(false)
    const [config, setConfig] = useState<DeleteConfirmationConfig>(
      defaultConfig || {
        title: '',
        description: '',
        onDelete: () => {},
      },
    )

    useImperativeHandle(ref, () => ({
      open: (newConfig?: DeleteConfirmationConfig) => {
        if (newConfig) {
          setConfig(newConfig)
        }
        setOpen(true)
      },
      close: () => {
        setOpen(false)
      },
      updateConfig: (updates: Partial<DeleteConfirmationConfig>) => {
        setConfig((prev) => ({ ...prev, ...updates }))
      },
    }))

    const handleOpenChange = (newOpen: boolean) => {
      setOpen(newOpen)
    }

    const handleDelete = async () => {
      await config.onDelete()
    }

    return (
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="max-w-md border-t-4 border-t-destructive">
          <DialogHeader className="flex flex-col items-center">
            <div className="-mt-16 flex h-16 w-16 items-center justify-center rounded-full bg-destructive p-3">
              <Trash2 size={100} className="text-white" />
            </div>
            <DialogTitle className="hidden"></DialogTitle>
          </DialogHeader>
          <DialogDescription className="px-3" asChild>
            <div className="flex flex-col items-center">
              <h1 className="text-center text-3xl font-semibold text-black dark:text-secondary-foreground">
                {config.title}
              </h1>
              <p className="mt-3 text-center text-base text-black dark:text-secondary-foreground">
                {config.description}
              </p>
            </div>
          </DialogDescription>

          <DialogFooter className="mt-3">
            <div className="flex w-full justify-center gap-2">
              <DialogClose asChild>
                <Button variant="outline" className="w-full">
                  Cancel
                </Button>
              </DialogClose>

              <Button
                variant="destructive"
                className="w-full"
                onClick={handleDelete}
                disabled={config.isLoading}>
                {config.isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>Confirm</>
                )}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
  },
)

DeleteConfirmation.displayName = 'DeleteConfirmation'

export default DeleteConfirmation
