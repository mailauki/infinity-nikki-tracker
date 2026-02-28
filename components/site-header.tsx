'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { Toolbar, Tabs, Tab } from '@mui/material'
import React from 'react'
import { navLinksData } from '@/lib/nav-links'
import { NavMainLink } from '@/lib/types/types'

function samePageLinkNavigation(event: React.MouseEvent<HTMLAnchorElement, MouseEvent>) {
  if (
    event.defaultPrevented ||
    event.button !== 0 || // ignore everything but left-click
    event.metaKey ||
    event.ctrlKey ||
    event.altKey ||
    event.shiftKey
  ) {
    return false
  }
  return true
}

interface LinkTabProps {
  label?: string
  href?: string
  selected?: boolean
}

function LinkTab(props: LinkTabProps) {
  return (
    <Tab
      component="a"
      onClick={(event: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => {
        // Routing libraries handle this, you can remove the onClick handle when using them.
        if (samePageLinkNavigation(event)) {
          event.preventDefault()
        }
      }}
      aria-current={props.selected && 'page'}
      {...props}
    />
  )
}

export function SiteHeader() {
  const pathname = usePathname()
  const path = pathname.split('/')
  const title = pathname === '/' ? 'home' : path[1]
  const slug = path.length > 2 ? path[2] : ''
  const navLink = { title, url: `/${title}` } as NavMainLink
  const navLinks =
    (navLinksData.navMain.find((item) => item.url === `/${title}`) as NavMainLink) || navLink
  const allNavLinks = [navLink].concat(navLinks.items!)
  const index = allNavLinks.findIndex((item) => item.title.toLowerCase() === slug)

  const [value, setValue] = React.useState(index)

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    // event.type can be equal to focus with selectionFollowsFocus.
    if (
      event.type !== 'click' ||
      (event.type === 'click' &&
        samePageLinkNavigation(event as React.MouseEvent<HTMLAnchorElement, MouseEvent>))
    ) {
      setValue(newValue)
    }
  }

  return (
    <Toolbar disableGutters>
      <Tabs
        value={value}
        onChange={handleChange}
        aria-label="page nav tabs"
        role="navigation"
        sx={{ borderBottom: 1, borderColor: 'divider', flexGrow: 1 }}
      >
        {allNavLinks.map((link) => (
          <LinkTab key={link.title} label={link.title} href={link.url} />
        ))}
      </Tabs>
    </Toolbar>
  )
}
