export interface NavItem {
  label: string
  to: string
  children?: NavItem[]
}

export interface NavGroup {
  label?: string
  items: NavItem[]
}
