const sharedSurfaces = {
  surface: '#fdf7ff',
  surfaceContainer: '#f2ecf4',
  surfaceContainerLow: '#f8f2fa',
  surfaceContainerLowest: '#ffffff',
  surfaceContainerHigh: '#ece6ee',
  surfaceVariant: '#e6e0e9',
  onSurface: '#1d1b20',
  onSurfaceVariant: '#494551',
  outline: '#7a7582',
  outlineVariant: '#cbc4d2',
  error: '#ba1a1a',
  errorContainer: '#ffdad6',
};

export const themes = {
  neutral: {
    ...sharedSurfaces,
    primary: '#4f378a',
    onPrimary: '#ffffff',
    primaryContainer: '#e9ddff',
    onPrimaryContainer: '#22005d',
  },
  krishi: {
    ...sharedSurfaces,
    primary: '#5c9e31',
    onPrimary: '#ffffff',
    primaryContainer: '#d7f0c3',
    onPrimaryContainer: '#1d3809',
  },
  hardware: {
    ...sharedSurfaces,
    primary: '#29659a',
    onPrimary: '#ffffff',
    primaryContainer: '#d4e8f7',
    onPrimaryContainer: '#0d2d4a',
  },
};

export function applyTheme(themeName) {
  const t = themes[themeName] || themes.neutral;
  const root = document.documentElement;
  root.dataset.theme = themeName;
  root.style.setProperty('--color-surface', t.surface);
  root.style.setProperty('--color-surface-container', t.surfaceContainer);
  root.style.setProperty('--color-surface-container-low', t.surfaceContainerLow);
  root.style.setProperty('--color-surface-container-lowest', t.surfaceContainerLowest);
  root.style.setProperty('--color-surface-container-high', t.surfaceContainerHigh);
  root.style.setProperty('--color-surface-variant', t.surfaceVariant);
  root.style.setProperty('--color-on-surface', t.onSurface);
  root.style.setProperty('--color-on-surface-variant', t.onSurfaceVariant);
  root.style.setProperty('--color-outline', t.outline);
  root.style.setProperty('--color-outline-variant', t.outlineVariant);
  root.style.setProperty('--color-primary', t.primary);
  root.style.setProperty('--color-on-primary', t.onPrimary);
  root.style.setProperty('--color-primary-container', t.primaryContainer);
  root.style.setProperty('--color-on-primary-container', t.onPrimaryContainer);
  root.style.setProperty('--color-error', t.error);
  root.style.setProperty('--color-error-container', t.errorContainer);
}
