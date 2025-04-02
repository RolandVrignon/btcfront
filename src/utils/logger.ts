// Fonction logger qui ne s'exécute qu'en développement
export const logger = {
  log: (...args: unknown[]) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(...args);
    }
  },
  error: (...args: unknown[]) => {
    if (process.env.NODE_ENV === 'development') {
      console.error(...args);
    }
  },
  warn: (...args: unknown[]) => {
    if (process.env.NODE_ENV === 'development') {
      console.warn(...args);
    }
  },
  info: (...args: unknown[]) => {
    if (process.env.NODE_ENV === 'development') {
      console.info(...args);
    }
  },
  debug: (...args: unknown[]) => {
    if (process.env.NODE_ENV === 'development') {
      console.debug(...args);
    }
  }
}; 