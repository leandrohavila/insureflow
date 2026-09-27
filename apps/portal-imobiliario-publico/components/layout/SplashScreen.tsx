"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";

import { SPLASH_STORAGE_KEY, SPLASH_VISIBLE_MS } from "@/lib/splash";

import styles from "./SplashScreen.module.css";

const EASE_OUT = [0.22, 1, 0.36, 1] as const;

function hasSeenSplash() {
  try {
    return window.sessionStorage.getItem(SPLASH_STORAGE_KEY) === "true";
  } catch {
    return true;
  }
}

function markSplashSeen() {
  try {
    window.sessionStorage.setItem(SPLASH_STORAGE_KEY, "true");
  } catch {
    // sessionStorage pode estar bloqueado (navegação privada).
  }
}

export function SplashScreen({ logoUrl, name }: { logoUrl?: string | null; name: string }) {
  const [visible, setVisible] = useState(true);
  const [logoFailed, setLogoFailed] = useState(false);
  const reduceMotion = useReducedMotion();
  const src = logoUrl?.trim();

  useEffect(() => {
    if (hasSeenSplash()) {
      setVisible(false);
      return;
    }
    const timer = window.setTimeout(() => {
      markSplashSeen();
      setVisible(false);
    }, SPLASH_VISIBLE_MS);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!visible) return;
    const root = document.documentElement;
    const previous = root.style.overflow;
    root.style.overflow = "hidden";
    return () => {
      root.style.overflow = previous;
    };
  }, [visible]);

  return (
    <AnimatePresence>
      {visible ? (
        <motion.div
          key="portal-splash"
          className={styles.splash}
          role="presentation"
          aria-hidden="true"
          initial={false}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6, ease: "easeInOut" }}
        >
          <motion.div
            className={styles.logoWrapper}
            initial={{ opacity: 0, scale: reduceMotion ? 1 : 0.95 }}
            animate={{ opacity: 1, scale: reduceMotion ? 1 : 1.05 }}
            transition={{ duration: reduceMotion ? 0.4 : 1.2, ease: EASE_OUT }}
          >
            <motion.span
              className={styles.glow}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: reduceMotion ? 0.4 : 1.4, ease: "easeOut" }}
            />
            {src && !logoFailed ? (
              <span className={styles.plate}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={src}
                  alt=""
                  className={styles.logo}
                  decoding="async"
                  fetchPriority="high"
                  onError={() => setLogoFailed(true)}
                />
              </span>
            ) : (
              <span className={styles.wordmark}>{name}</span>
            )}
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
