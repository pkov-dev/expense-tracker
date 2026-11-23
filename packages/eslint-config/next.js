import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';
import prettier from 'eslint-config-prettier';
import base from './base.js';

/** Config for the Next.js app. */
export default [...base, ...nextVitals, ...nextTs, prettier];
