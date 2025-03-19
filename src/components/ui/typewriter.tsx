import { useEffect, useState, useCallback } from "react";
import { motion, Variants } from "framer-motion";

import { cn } from "@/src/lib/utils";

interface TypewriterProps {
  text: string | string[];
  speed?: number;
  initialDelay?: number;
  waitTime?: number;
  deleteSpeed?: number;
  loop?: boolean;
  className?: string;
  showCursor?: boolean;
  hideCursorOnType?: boolean;
  cursorChar?: string | React.ReactNode;
  cursorAnimationVariants?: {
    initial: Variants["initial"];
    animate: Variants["animate"];
  };
  cursorClassName?: string;
}

const Typewriter = ({
  text,
  speed = 50,
  initialDelay = 0,
  waitTime = 2000,
  deleteSpeed = 30,
  loop = true,
  className,
  showCursor = true,
  hideCursorOnType = false,
  cursorChar = "|",
  cursorClassName = "ml-1",
  cursorAnimationVariants = {
    initial: { opacity: 0 },
    animate: {
      opacity: 1,
      transition: {
        duration: 0.01,
        repeat: Infinity,
        repeatDelay: 0.4,
        repeatType: "reverse",
      },
    },
  },
}: TypewriterProps) => {
  const [displayText, setDisplayText] = useState("");
  const [phase, setPhase] = useState<"typing" | "waiting" | "deleting">(
    "typing",
  );
  const [currentTextIndex, setCurrentTextIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);

  const texts = Array.isArray(text) ? text : [text];
  const currentText = texts[currentTextIndex];

  const handleTyping = useCallback(() => {
    if (phase === "typing") {
      if (charIndex < currentText.length) {
        setDisplayText(currentText.substring(0, charIndex + 1));
        setCharIndex(charIndex + 1);
      } else {
        // Finished typing, wait before deleting
        setPhase("waiting");
      }
    } else if (phase === "waiting") {
      // Start deleting after waiting
      setPhase("deleting");
    } else if (phase === "deleting") {
      if (charIndex > 0) {
        setDisplayText(currentText.substring(0, charIndex - 1));
        setCharIndex(charIndex - 1);
      } else {
        // Move to next text
        const nextTextIndex = (currentTextIndex + 1) % texts.length;
        if (currentTextIndex === texts.length - 1 && !loop) {
          // Stop here if we're at the last text and not looping
          return;
        }

        setCurrentTextIndex(nextTextIndex);
        setPhase("typing");
      }
    }
  }, [phase, charIndex, currentText, currentTextIndex, texts.length, loop]);

  useEffect(() => {
    const getDelay = () => {
      if (phase === "typing") return speed;
      if (phase === "waiting") return waitTime;
      return deleteSpeed;
    };

    const timeout = setTimeout(handleTyping, getDelay());

    return () => clearTimeout(timeout);
  }, [handleTyping, phase, speed, waitTime, deleteSpeed]);

  // Apply initial delay only at the start
  useEffect(() => {
    if (
      initialDelay > 0 &&
      currentTextIndex === 0 &&
      charIndex === 0 &&
      phase === "typing" &&
      displayText === ""
    ) {
      const timeout = setTimeout(
        () => setDisplayText(currentText.substring(0, 1)),
        initialDelay,
      );
      return () => clearTimeout(timeout);
    }
  }, [
    initialDelay,
    currentTextIndex,
    charIndex,
    phase,
    displayText,
    currentText,
  ]);

  return (
    <div className={`inline whitespace-pre-wrap tracking-tight ${className}`}>
      <span>{displayText}</span>
      {showCursor && (
        <motion.span
          variants={cursorAnimationVariants}
          className={cn(
            cursorClassName,
            hideCursorOnType && charIndex < currentText.length ? "hidden" : "",
          )}
          initial="initial"
          animate="animate"
        >
          {cursorChar}
        </motion.span>
      )}
    </div>
  );
};

export { Typewriter };
