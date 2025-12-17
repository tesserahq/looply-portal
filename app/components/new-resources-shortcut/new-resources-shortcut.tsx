import { Button } from '@shadcn/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@shadcn/ui/popover'
import { Link } from '@remix-run/react'
import { BookUser, Contact, Plus, SquareUser, Users2 } from 'lucide-react'
import { useState } from 'react'
import Separator from '@shadcn/ui/separator'

type ResourceType = {
  id: 'contacts' | 'contact-lists' | 'waiting-lists' | 'contact-interactions'
  name: string
  href: string
  icon: typeof SquareUser
}

const resourceTypes: ResourceType[] = [
  { id: 'contacts', name: 'Contacts', icon: SquareUser, href: '/contacts/new' },
  {
    id: 'contact-lists',
    name: 'Contact Lists',
    icon: BookUser,
    href: '/contact-lists/new',
  },
  {
    id: 'waiting-lists',
    name: 'Waiting Lists',
    icon: Users2,
    href: '/waiting-lists/new',
  },
  {
    id: 'contact-interactions',
    name: 'Contact Interactions',
    icon: Contact,
    href: '/contact-interactions/new',
  },
]

export default function NewResourceShortcut() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Separator orientation="vertical" className="-ml-1 hidden h-8" />
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className="border-accent bg-accent border">
            <Plus />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[250px]" align="end" side="bottom" sideOffset={8}>
          <h3 className="text-muted-foreground mb-3 text-xs font-medium uppercase">
            Create New Resources
          </h3>
          <div className="flex flex-col">
            {resourceTypes.map((resource) => {
              const Icon = resource.icon
              return (
                <Link
                  key={resource.id}
                  to={resource.href}
                  onClick={() => setOpen(false)}
                  aria-label={`Create new ${resource.name}`}
                  className="group flex items-center gap-1 rounded-lg transition-colors">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg transition-colors">
                    <Icon className="group-hover:text-primary h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="group-hover:text-primary text-sm font-medium">
                      {resource.name}
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        </PopoverContent>
      </Popover>
    </>
  )
}
