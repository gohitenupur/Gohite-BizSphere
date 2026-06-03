const neutralSurfaces = {
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
    ...neutralSurfaces,
    primary: '#4f378a',
    onPrimary: '#ffffff',
    primaryContainer: '#e9ddff',
    onPrimaryContainer: '#22005d',
    secondaryContainer: '#e1d4fd',
    tertiaryContainer: '#c9a74d',
  },
  krishi: {
    surface: '#fbfdfb',
    surfaceContainer: '#f1f5f1',
    surfaceContainerLow: '#f8fbf8',
    surfaceContainerLowest: '#ffffff',
    surfaceContainerHigh: '#e8ece8',
    surfaceVariant: '#dce1dc',
    onSurface: '#1a1c1a',
    onSurfaceVariant: '#424942',
    outline: '#747974',
    outlineVariant: '#c4cdc4',
    error: '#ba1a1a',
    errorContainer: '#ffdad6',
    primary: '#4caf50',
    onPrimary: '#ffffff',
    primaryContainer: '#c8e6c9',
    onPrimaryContainer: '#003300',
    secondaryContainer: '#c8e6c9',
    tertiaryContainer: '#dcedc8',
  },
  hardware: {
    surface: '#fdfdff',
    surfaceContainer: '#f2f6fc',
    surfaceContainerLow: '#f8fafd',
    surfaceContainerLowest: '#ffffff',
    surfaceContainerHigh: '#e8f0fe',
    surfaceVariant: '#e1e5eb',
    onSurface: '#1a1b1e',
    onSurfaceVariant: '#44474e',
    outline: '#74777f',
    outlineVariant: '#c2c7cf',
    error: '#ba1a1a',
    errorContainer: '#ffdad6',
    primary: '#2196f3',
    onPrimary: '#ffffff',
    primaryContainer: '#bbdefb',
    onPrimaryContainer: '#0d47a1',
    secondaryContainer: '#e3f2fd',
    tertiaryContainer: '#c9a74d',
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
  root.style.setProperty('--color-secondary-container', t.secondaryContainer);
  root.style.setProperty('--color-tertiary-container', t.tertiaryContainer);
  root.style.setProperty('--color-error', t.error);
  root.style.setProperty('--color-error-container', t.errorContainer);
}

