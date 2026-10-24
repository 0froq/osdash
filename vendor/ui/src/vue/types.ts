export interface CodeSpan {
  text: string
  color?: string
}

export interface ChoiceOption<T extends string = string> {
  value: T
  label: string
  disabled?: boolean
}

export interface NavigationItem {
  value: string
  label: string
  href?: string
}

export interface SidebarItem extends NavigationItem {
  children?: SidebarItem[]
}

export interface SidebarGroup {
  label?: string
  items: SidebarItem[]
}

export interface SidebarLinkProps {
  'class': string
  'href': string
  'aria-current': 'page' | undefined
  'onClick': (event: MouseEvent) => void
}

export interface NavigationLinkProps extends Omit<SidebarLinkProps, 'aria-current'> {
  'aria-current': 'page' | 'location' | undefined
}

export type BreadcrumbLinkProps = Omit<NavigationLinkProps, 'onClick'>

export interface PaginationControlProps {
  'class': string
  'type'?: 'button'
  'href'?: string
  'disabled'?: boolean
  'aria-disabled'?: true
  'aria-label': string
  'aria-current'?: 'page'
  'onClick': (event: MouseEvent) => void
}

export interface CollapsibleTriggerProps {
  'id': string
  'type': 'button'
  'class': string
  'disabled': boolean
  'aria-expanded': boolean
  'aria-controls': string
  'onClick': (event?: Event) => void
}

export interface FieldControlProps {
  'id': string
  'required': boolean
  'aria-labelledby': string
  'aria-describedby': string | undefined
  'aria-invalid': true | undefined
  'aria-required': true | undefined
}

export interface TableColumn<T extends object = Record<string, unknown>> {
  key: keyof T & string
  label: string
  align?: 'start' | 'center' | 'end'
}

export interface MenuItem {
  value: string
  label: string
  disabled?: boolean
  separatorBefore?: boolean
  children?: MenuItem[]
}
