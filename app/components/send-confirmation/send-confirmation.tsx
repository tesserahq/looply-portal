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
import { Loader2, Send } from 'lucide-react'
import { forwardRef, useImperativeHandle, useState } from 'react'

export interface SendConfirmationHandle {
  open: (config?: SendConfirmationConfig) => void
  close: () => void
  updateConfig: (updates: Partial<SendConfirmationConfig>) => void
}

export interface SendConfirmationConfig {
  title: string
  description: string
  onSend: () => void | Promise<void>
  isLoading?: boolean
}

interface SendConfirmationProps {
  defaultConfig?: SendConfirmationConfig
}

const SendConfirmation = forwardRef<SendConfirmationHandle, SendConfirmationProps>(
  ({ defaultConfig }, ref) => {
    const [open, setOpen] = useState(false)
    const [config, setConfig] = useState<SendConfirmationConfig>(
      defaultConfig || {
        title: '',
        description: '',
        onSend: () => {},
      }
    )

    useImperativeHandle(ref, () => ({
      open: (newConfig?: SendConfirmationConfig) => {
        if (newConfig) {
          setConfig(newConfig)
        }
        setOpen(true)
      },
      close: () => {
        setOpen(false)
      },
      updateConfig: (updates: Partial<SendConfirmationConfig>) => {
        setConfig((prev) => ({ ...prev, ...updates }))
      },
    }))

    const handleOpenChange = (newOpen: boolean) => {
      setOpen(newOpen)
    }

    const handleSend = async () => {
      await config.onSend()
    }

    return (
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="max-w-md border-t-4 border-t-primary">
          <DialogHeader className="flex flex-col items-center">
            <div
              className="bg-primary -mt-16 flex h-16 w-16 items-center justify-center rounded-full
                p-3">
              <Send size={100} className="text-white" />
            </div>
            <DialogTitle className="hidden"></DialogTitle>
          </DialogHeader>
          <DialogDescription className="px-3" asChild>
            <div className="flex flex-col items-center">
              <h1
                className="dark:text-secondary-foreground text-center text-3xl font-semibold
                  text-black">
                {config.title}
              </h1>
              <p className="dark:text-secondary-foreground mt-3 text-center text-base text-black">
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

              <Button className="w-full" onClick={handleSend} disabled={config.isLoading}>
                {config.isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>Send</>
                )}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
  }
)

SendConfirmation.displayName = 'SendConfirmation'

export default SendConfirmation
