import { useState, useEffect, useCallback } from 'react'

interface WelcomeSceneProps {
  onComplete: () => void
}

export function WelcomeScene({ onComplete }: WelcomeSceneProps) {
  const [isVisible, setIsVisible] = useState(true)

  const handleDismiss = useCallback(() => {
  // Add 1 second delay before starting the transition
  setTimeout(() => {  // ← This is LINE 12
    setIsVisible(false)
    // Wait for animation to complete before calling onComplete
    setTimeout(() => {
      onComplete()
    }, 500) // Match the CSS transition duration
  }, 50) // 1 second delay ← This is the delay value
}, [onComplete])

  const handleClick = useCallback(() => {
    handleDismiss()
  }, [handleDismiss])

  const handleScroll = useCallback(() => {
    handleDismiss()
  }, [handleDismiss])

  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault()
      handleScroll()
    }

    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault()
      handleScroll()
    }

    // Add scroll event listeners
    window.addEventListener('wheel', handleWheel, { passive: false })
    window.addEventListener('touchmove', handleTouchMove, { passive: false })

    // Cleanup
    return () => {
      window.removeEventListener('wheel', handleWheel)
      window.removeEventListener('touchmove', handleTouchMove)
    }
  }, [handleScroll])

  // Auto-dismiss after 1 second
  useEffect(() => {
    const autoTimer = setTimeout(() => {
      handleDismiss()
    }, 1000)

    return () => clearTimeout(autoTimer)
  }, [handleDismiss])

  return (
    <div
      className={`welcome-scene ${!isVisible ? 'toggled' : ''}`}
      onClick={handleClick}
    >
      <div className="welcome-content">
        <h2 className="welcome-title">ZeroCrust</h2>
        <p className="welcome-subtitle">Your personal companion for sustainable eating</p>
        <div className="welcome-animation">
          <div className="floating-elements">
            <div className="floating-element element-1">🥗</div>
            <div className="floating-element element-2">🌱</div>
            <div className="floating-element element-3">🍎</div>
            <div className="floating-element element-4">🌿</div>
            <div className="floating-element element-5">🥕</div>
          </div>
        </div>
        <p className="welcome-instruction">Click anywhere or scroll to continue</p>
      </div>
    </div>
  )
}