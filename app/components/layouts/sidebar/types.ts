interface ItemProps {
  title: string
  path: string
  icon: React.ReactNode
}
export interface IMenuItemProps {
  title: string
  path: string
  icon: React.ReactNode
  children?: ItemProps[]
  divider?: boolean
}

export interface ISidebarPanelProps {
  menuItems: IMenuItemProps[]
}
