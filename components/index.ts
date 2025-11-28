// Atomic Design System Components - Optimized for tree shaking

// Atoms - Basic UI elements
export * from './atoms';

// Molecules - Simple combinations of atoms
export * from './molecules';

// Organisms - Complex UI components built from molecules and atoms
export * from './organisms';

// Templates - Page layouts and structures
export * from './templates';

// Main Components - Following SOLID principles
export { default as EncodeDecode } from './encode-decode';
export { default as EncodeDecodeLegacy } from './encode-decode-legacy';

// Utility Components
export { default as MatrixEffects } from './matrix-effects';