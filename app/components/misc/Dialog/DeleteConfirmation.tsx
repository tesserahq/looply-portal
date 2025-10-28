import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { cn } from '@/utils/misc'
import { FetcherWithComponents } from '@remix-run/react'
import { Trash2 } from 'lucide-react'
import { useState } from 'react'

interface DeleteConfirmationProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  onDelete: () => void
  fetcher: FetcherWithComponents<unknown>
  showInputValidation?: boolean
}

export default function DeleteConfirmation({
  open,
  onOpenChange,
  title,
  description,
  onDelete,
  fetcher,
  showInputValidation,
}: DeleteConfirmationProps) {
  const [confirmMsg, setConfirmMsg] = useState<string>('')

  const handleOpenChange = (newOpen: boolean) => {
    onOpenChange(newOpen)
    if (!newOpen) {
      setConfirmMsg('')
    }
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
            <h1 className="text-3xl font-semibold text-black dark:text-secondary-foreground">
              {title}
            </h1>
            <p
              className={cn(
                'mt-3 text-center text-lg text-black dark:text-secondary-foreground',
                !showInputValidation && 'mb-3 text-base text-secondary-foreground',
              )}>
              {description}
            </p>
            {showInputValidation && (
              <div>
                <p className="mb-3 mt-5 text-sm">
                  To confirm, type &quot;delete&quot; in the box below
                </p>
                <Input
                  name="delete_confirm"
                  className="text-center text-black dark:text-white"
                  value={confirmMsg}
                  onChange={(e) => setConfirmMsg(e.target.value)}
                />
              </div>
            )}
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
              onClick={onDelete}
              disabled={
                fetcher?.state !== 'idle' ||
                (showInputValidation && confirmMsg.toLowerCase() !== 'delete')
              }>
              {fetcher?.state !== 'idle' ? 'Deleting...' : 'Confirm'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
