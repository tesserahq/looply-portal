import { Badge } from '@shadcn/ui/badge'
import { Card, CardContent, CardHeader } from '@shadcn/ui/card'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@shadcn/ui/tooltip'
import { AlertCircle, CheckCircle2, FileText } from 'lucide-react'
import { Activity, useEffect, useRef, useState } from 'react'

export type JsonObject = Record<string, unknown>

export interface JsonEditorProps {
  initialValue?: JsonObject
  onChange?: (parsed: JsonObject) => void
  readOnly?: boolean
}

export function JsonEditor({
  initialValue,
  onChange = () => {},
  readOnly = false,
}: JsonEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const lineNumbersRef = useRef<HTMLDivElement>(null)

  const [text, setText] = useState(() => JSON.stringify(initialValue ?? {}, null, 2))
  const [isValid, setIsValid] = useState(true)
  const [error, setError] = useState<string>()
  const [parsed, setParsed] = useState<JsonObject>(initialValue ?? {})

  useEffect(() => {
    if (isValid) onChange(parsed)
  }, [isValid, parsed])

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value
    setText(value)
    try {
      const next = JSON.parse(value)
      setParsed(next)
      setIsValid(true)
      setError(undefined)
    } catch (err) {
      setIsValid(false)
      setError(err instanceof Error ? err.message : 'Invalid JSON')
    }
  }

  const handleScroll = () => {
    if (textareaRef.current && lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = textareaRef.current.scrollTop
    }
  }

  const lineCount = text.split('\n').length
  const lines = Array.from({ length: lineCount }, (_, i) => i + 1)

  return (
    <Card className="flex min-h-[200px] w-full flex-col overflow-hidden shadow-none">
      <CardHeader className="flex flex-row items-center justify-between border-b bg-muted/30 py-1">
        <div className="flex items-center gap-2 py-1">
          <FileText className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-semibold text-foreground">JSON</span>
          <Activity mode={readOnly ? 'hidden' : 'visible'}>
            {!isValid && (
              <TooltipProvider delayDuration={100}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge variant="destructive" className="flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      Invalid
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    <span>{error}</span>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
            {isValid && text.trim() && (
              <Badge variant="default" className="flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" />
                Valid
              </Badge>
            )}
          </Activity>
        </div>
      </CardHeader>
      <CardContent className="relative flex-1 overflow-auto rounded-tr-none p-0">
        <div className="flex h-full">
          <div
            ref={lineNumbersRef}
            className="shrink-0 overflow-hidden border-r bg-muted/20 px-3 py-1 text-right font-mono
              text-xs text-muted-foreground"
            style={{ width: '50px' }}>
            {lines.map((line) => (
              <div key={line} className="leading-6">
                {line}
              </div>
            ))}
          </div>
          <div className="relative flex-1">
            <textarea
              ref={textareaRef}
              value={text}
              onChange={handleTextChange}
              onScroll={handleScroll}
              readOnly={readOnly}
              spellCheck={false}
              className="absolute inset-0 h-full min-h-[150px] w-full resize-none bg-transparent
                px-3 py-1 font-mono text-sm leading-6 text-foreground outline-hidden
                selection:bg-primary/20 selection:text-black dark:selection:bg-primary
                dark:selection:text-white"
              style={{ tabSize: 2 }}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
