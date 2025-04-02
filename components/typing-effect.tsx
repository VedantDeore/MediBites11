"use client"

import { useEffect, useState } from "react"

interface TypingEffectProps {
  text: string
  typingSpeed?: number
  onComplete?: () => void
}

export const TypingEffect = ({ text, typingSpeed = 30, onComplete }: TypingEffectProps) => {
  const [displayedText, setDisplayedText] = useState("")
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isComplete, setIsComplete] = useState(false)

  useEffect(() => {
    // Reset when text changes
    setDisplayedText("")
    setCurrentIndex(0)
    setIsComplete(false)
  }, [text])

  useEffect(() => {
    if (currentIndex < text.length) {
      const timer = setTimeout(() => {
        setDisplayedText((prev) => prev + text[currentIndex])
        setCurrentIndex((prev) => prev + 1)
      }, typingSpeed)

      return () => clearTimeout(timer)
    } else if (!isComplete) {
      setIsComplete(true)
      onComplete?.()
    }
  }, [currentIndex, text, typingSpeed, isComplete, onComplete])

  // Function to format text with bold styling
  const formatText = (text: string) => {
    // Split the text by bold markers
    const parts = text.split(/(\*\*.*?\*\*|\*.*?\*)/g)

    return parts.map((part, index) => {
      // Check for double asterisks (strong emphasis)
      if (part.startsWith("**") && part.endsWith("**")) {
        return <strong key={index}>{part.slice(2, -2)}</strong>
      }
      // Check for single asterisks (emphasis)
      else if (part.startsWith("*") && part.endsWith("*")) {
        return <strong key={index}>{part.slice(1, -1)}</strong>
      }
      // Regular text
      return <span key={index}>{part}</span>
    })
  }

  return <div className="whitespace-pre-wrap">{formatText(displayedText)}</div>
}

