import { useEffect, useState, useRef, RefObject } from 'react'

interface UseIntersectionObserverProps {
  threshold?: number
  root?: Element | null
  rootMargin?: string
  freezeOnceVisible?: boolean
}

export function useIntersectionObserver({
  threshold = 0,
  root = null,
  rootMargin = '0%',
  freezeOnceVisible = false,
}: UseIntersectionObserverProps): [RefObject<HTMLDivElement | null>, boolean] {
  const [entry, setEntry] = useState<IntersectionObserverEntry>()
  const [frozen, setFrozen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const frozenRef = useRef(frozen)
  frozenRef.current = frozen

  useEffect(() => {
    const node = ref.current
    if (!node || frozenRef.current) return

    if (typeof IntersectionObserver === 'undefined') {
        // Fallback for environments without IntersectionObserver
        setEntry({ isIntersecting: true } as IntersectionObserverEntry)
        return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        setEntry(entry)
        if (freezeOnceVisible && entry.isIntersecting) {
          setFrozen(true)
        }
      },
      { threshold, root, rootMargin }
    )

    observer.observe(node)

    return () => {
      observer.disconnect()
    }
  }, [threshold, root, rootMargin, freezeOnceVisible])

  return [ref, !!entry?.isIntersecting]
}
