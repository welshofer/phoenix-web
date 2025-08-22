/**
 * Font Loader Utility
 * Handles dynamic loading of Google Fonts based on selected typography set
 */

import { TypographySet } from '../models/typography';

/**
 * Loads Google Fonts for a typography set
 */
export function loadGoogleFonts(typographySet: TypographySet): void {
  if (!typographySet.googleFonts || typographySet.googleFonts.length === 0) {
    return;
  }

  // Check if fonts are already loaded
  const linkId = `typography-fonts-${typographySet.id}`;
  const existingLink = document.getElementById(linkId);
  
  if (existingLink) {
    return;
  }

  // Remove other typography font links
  const fontLinks = document.querySelectorAll('link[id^="typography-fonts-"]');
  fontLinks.forEach(link => link.remove());

  // Create and append new font link
  const link = document.createElement('link');
  link.id = linkId;
  link.rel = 'stylesheet';
  link.href = `https://fonts.googleapis.com/css2?${typographySet.googleFonts
    .map(font => `family=${font}`)
    .join('&')}&display=swap`;
  
  document.head.appendChild(link);
}

/**
 * Preconnect to Google Fonts for faster loading
 */
export function preconnectGoogleFonts(): void {
  const preconnectLinks = [
    { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
    { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossOrigin: 'anonymous' }
  ];

  preconnectLinks.forEach(linkProps => {
    const existingLink = document.querySelector(`link[href="${linkProps.href}"]`);
    if (!existingLink) {
      const link = document.createElement('link');
      Object.assign(link, linkProps);
      document.head.appendChild(link);
    }
  });
}

/**
 * Gets CSS variables for a typography set
 */
export function getTypographyCSSVariables(typographySet: TypographySet): Record<string, string> {
  const cssVars: Record<string, string> = {};
  
  // Set font family variables
  cssVars['--font-primary'] = Array.isArray(typographySet.primaryFont) 
    ? typographySet.primaryFont.join(', ')
    : typographySet.primaryFont;
    
  if (typographySet.secondaryFont) {
    cssVars['--font-secondary'] = Array.isArray(typographySet.secondaryFont)
      ? typographySet.secondaryFont.join(', ')
      : typographySet.secondaryFont;
  }
  
  if (typographySet.monoFont) {
    cssVars['--font-mono'] = Array.isArray(typographySet.monoFont)
      ? typographySet.monoFont.join(', ')
      : typographySet.monoFont;
  }
  
  // Set size and scale variables
  if (typographySet.baseSize) {
    cssVars['--typography-base-size'] = `${typographySet.baseSize}px`;
  }
  
  if (typographySet.scaleRatio) {
    cssVars['--typography-scale-ratio'] = typographySet.scaleRatio.toString();
  }
  
  // Set individual role variables
  Object.entries(typographySet.roles).forEach(([role, definition]) => {
    const rolePrefix = `--typography-${role}`;
    
    cssVars[`${rolePrefix}-font-family`] = Array.isArray(definition.fontFamily)
      ? definition.fontFamily.join(', ')
      : definition.fontFamily;
    cssVars[`${rolePrefix}-font-size`] = `${definition.fontSize}px`;
    cssVars[`${rolePrefix}-font-weight`] = definition.fontWeight.toString();
    
    if (definition.fontStyle) {
      cssVars[`${rolePrefix}-font-style`] = definition.fontStyle;
    }
    
    if (definition.lineHeight) {
      cssVars[`${rolePrefix}-line-height`] = typeof definition.lineHeight === 'number'
        ? definition.lineHeight.toString()
        : definition.lineHeight;
    }
    
    if (definition.letterSpacing) {
      cssVars[`${rolePrefix}-letter-spacing`] = typeof definition.letterSpacing === 'number'
        ? `${definition.letterSpacing}em`
        : definition.letterSpacing;
    }
    
    if (definition.textTransform) {
      cssVars[`${rolePrefix}-text-transform`] = definition.textTransform;
    }
    
    if (definition.textAlign) {
      cssVars[`${rolePrefix}-text-align`] = definition.textAlign;
    }
  });
  
  return cssVars;
}

/**
 * Applies typography CSS variables to an element
 */
export function applyTypographyToElement(
  element: HTMLElement,
  typographySet: TypographySet
): void {
  const cssVars = getTypographyCSSVariables(typographySet);
  
  Object.entries(cssVars).forEach(([property, value]) => {
    element.style.setProperty(property, value);
  });
}

/**
 * Creates CSS classes for typography roles
 */
export function generateTypographyCSS(typographySet: TypographySet): string {
  const cssRules: string[] = [];
  
  // Generate CSS for each role
  Object.entries(typographySet.roles).forEach(([role, definition]) => {
    const className = `.typography-${role}`;
    const properties: string[] = [];
    
    properties.push(`font-family: ${
      Array.isArray(definition.fontFamily)
        ? definition.fontFamily.join(', ')
        : definition.fontFamily
    };`);
    
    properties.push(`font-size: ${definition.fontSize}px;`);
    properties.push(`font-weight: ${definition.fontWeight};`);
    
    if (definition.fontStyle) {
      properties.push(`font-style: ${definition.fontStyle};`);
    }
    
    if (definition.lineHeight) {
      properties.push(`line-height: ${definition.lineHeight};`);
    }
    
    if (definition.letterSpacing) {
      const spacing = typeof definition.letterSpacing === 'number'
        ? `${definition.letterSpacing}em`
        : definition.letterSpacing;
      properties.push(`letter-spacing: ${spacing};`);
    }
    
    if (definition.textTransform) {
      properties.push(`text-transform: ${definition.textTransform};`);
    }
    
    if (definition.textAlign) {
      properties.push(`text-align: ${definition.textAlign};`);
    }
    
    if (definition.textDecoration) {
      properties.push(`text-decoration: ${definition.textDecoration};`);
    }
    
    cssRules.push(`${className} {\n  ${properties.join('\n  ')}\n}`);
  });
  
  return cssRules.join('\n\n');
}

/**
 * Responsive font size calculation
 */
export function getResponsiveFontSize(
  baseFontSize: number,
  viewportWidth: number,
  minSize?: number,
  maxSize?: number,
  scaleFactor: number = 1
): number {
  const referenceWidth = 1920; // Reference viewport width
  const scaledSize = (baseFontSize * viewportWidth / referenceWidth) * scaleFactor;
  
  if (minSize && scaledSize < minSize) return minSize;
  if (maxSize && scaledSize > maxSize) return maxSize;
  
  return Math.round(scaledSize);
}