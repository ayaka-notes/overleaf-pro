import { useEffect } from 'react'

export function useFocusTrap(ref: React.RefObject<HTMLElement>, enabled = true) {
  useEffect(() => {
    if (!enabled || !ref.current) return

    const element = ref.current
    const previouslyFocusedElement = document.activeElement as HTMLElement
    const focusableElements = element.querySelectorAll<HTMLElement>(
      'a[href], button, textarea, input, select, [tabindex]:not([tabindex="-1"])'
    )

    const firstElement = focusableElements[0]
    const lastElement = focusableElements[focusableElements.length - 1]

    // Don't override if something inside already received focus
    const isAlreadyFocusedInside = element.contains(document.activeElement)

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key !== 'Tab') return

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault()
          lastElement?.focus()
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault()
          firstElement?.focus()
        }
      }
    }

    element.addEventListener('keydown', handleKeyDown)

    if (!isAlreadyFocusedInside) {
      firstElement?.focus()
    }

    return () => {
      element.removeEventListener('keydown', handleKeyDown)
      previouslyFocusedElement?.focus()
    }
  }, [ref, enabled])
}
