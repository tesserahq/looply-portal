import { Avatar, AvatarImage } from '@/modules/shadcn/ui/avatar'
import { Button } from '@/modules/shadcn/ui/button'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/modules/shadcn/ui/dropdown'
import { cn } from '@shadcn/lib/utils'
import { Link } from 'react-router'
import { Grip } from 'lucide-react'
import { useMemo, useState } from 'react'

export interface IAppMenusProps {
  quoreHostUrl: string
  custosHostUrl: string
  vaultaHostUrl: string
  identiesHostUrl: string
}

export default function AppMenus({ appHostUrls }: { appHostUrls: IAppMenusProps }) {
  const [isOpenAppMenu, setIsOpenAppMenu] = useState(false)
  const { quoreHostUrl, custosHostUrl, vaultaHostUrl, identiesHostUrl } = appHostUrls

  const apps = useMemo(() => {
    return [
      {
        name: 'quore',
        link: `${quoreHostUrl}?autologin=true`,
      },
      {
        name: 'custos',
        link: `${custosHostUrl}?autologin=true`,
      },
      {
        name: 'vaulta',
        link: `${vaultaHostUrl}?autologin=true`,
      },
      {
        name: 'identies',
        link: `${identiesHostUrl}?autologin=true`,
      },
    ]
  }, [vaultaHostUrl, custosHostUrl, identiesHostUrl])

  return (
    <DropdownMenu open={isOpenAppMenu} onOpenChange={setIsOpenAppMenu}>
      <DropdownMenuTrigger asChild className="cursor-pointer">
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            'focus-visible:ring-0 focus-visible:ring-transparent focus-visible:ring-offset-0',
            isOpenAppMenu && 'bg-accent'
          )}>
          <Grip />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="grid max-h-[400px] grid-cols-2 gap-1 overflow-auto px-5 py-3"
        align="end">
        {apps.map((app) => {
          return (
            <Link
              key={app.name}
              to={app.link}
              target="_blank"
              rel="noreferrer"
              className="flex flex-col items-center justify-center rounded-lg px-4 py-2
                transition-all duration-200 hover:bg-accent">
              <Avatar>
                <AvatarImage src={`/images/apps/${app.name}-logo.png`} />
              </Avatar>
              <span className="text-xs capitalize">{app.name}</span>
            </Link>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
