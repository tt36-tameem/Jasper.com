'use client'

import { createContext, useContext, useEffect, useState } from 'react'

type Theme = 'light' | 'dark'

interface ThemeContextValue {
  theme: Theme
  toggle: (coords?: { x: number; y: number }) => void
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: 'light',
  toggle: () => {},
})

export function useTheme() {
  return useContext(ThemeContext)
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window === 'undefined') return 'light'
    const stored = localStorage.getItem('aura-theme') as Theme | null
    const preferred = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    return stored ?? preferred
  })

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function applyTheme(next: Theme) {
    setTheme(next)
    localStorage.setItem('aura-theme', next)
    document.documentElement.classList.toggle('dark', next === 'dark')
  }

  function toggle(coords?: { x: number; y: number }) {
    const next = theme === 'light' ? 'dark' : 'light'

    // Dark → light originates from top-right; light → dark from click point
    const x = next === 'light' ? window.innerWidth : (coords?.x ?? window.innerWidth / 2)
    const y = next === 'light' ? 0               : (coords?.y ?? window.innerHeight / 2)
    const endRadius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y)
    )

    // View Transitions API circular reveal
    if (!('startViewTransition' in document)) {
      applyTheme(next)
      return
    }

    // @ts-expect-error — View Transitions API not yet in TS lib
    const transition = document.startViewTransition(() => applyTheme(next))

    transition.ready.then(() => {
      document.documentElement.animate(
        {
          clipPath: [
            `circle(0px at ${x}px ${y}px)`,
            `circle(${endRadius}px at ${x}px ${y}px)`,
          ],
        },
        {
          duration: 600,
          easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
          pseudoElement: '::view-transition-new(root)',
        }
      )
    })
  }

  return (
    <ThemeContext.Provider value={{ theme, toggle }}>
      {children}
    </ThemeContext.Provider>
  )
}
