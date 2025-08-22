import { useEffect, useState } from 'react';
import { typographySets } from '@/lib/typography/typography-sets';
import { TypographySet } from '@/lib/models/typography';
import { loadGoogleFonts } from '@/lib/typography/font-loader';

export function useTypography(typographySetId?: string) {
  const [currentSet, setCurrentSet] = useState<TypographySet | null>(null);
  const [fontsLoaded, setFontsLoaded] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadTypography = async () => {
      setLoading(true);
      
      // Find the typography set
      const set = typographySets.find(s => s.id === typographySetId) || typographySets[0];
      setCurrentSet(set);
      
      // Load Google Fonts if needed
      if (set.googleFonts && set.googleFonts.length > 0) {
        try {
          await loadGoogleFonts(set.googleFonts);
          setFontsLoaded(true);
        } catch (error) {
          console.error('Failed to load fonts:', error);
          setFontsLoaded(false);
        }
      } else {
        setFontsLoaded(true);
      }
      
      setLoading(false);
    };

    loadTypography();
  }, [typographySetId]);

  return {
    typographySet: currentSet,
    fontsLoaded,
    loading,
  };
}

// Helper function to get typography styles for a specific role
export function getTypographyStyles(
  typographySet: TypographySet | null,
  role: string
): React.CSSProperties {
  if (!typographySet || !typographySet.roles[role]) {
    // Return default styles if no typography set or role not found
    return {
      fontSize: 32,
      fontWeight: 400,
      lineHeight: 1.5,
    };
  }

  const roleStyles = typographySet.roles[role];
  
  return {
    fontFamily: Array.isArray(roleStyles.fontFamily) 
      ? roleStyles.fontFamily.join(', ')
      : roleStyles.fontFamily,
    fontSize: roleStyles.fontSize,
    fontWeight: roleStyles.fontWeight,
    lineHeight: roleStyles.lineHeight,
    letterSpacing: roleStyles.letterSpacing,
    textAlign: roleStyles.textAlign as any,
    textTransform: roleStyles.textTransform,
    fontStyle: roleStyles.fontStyle,
  };
}

// Map slide text roles to typography roles
export function mapSlideRoleToTypographyRole(slideRole: string): string {
  const roleMapping: Record<string, string> = {
    'title': 'title',
    'subtitle': 'subtitle',
    'heading': 'heading1',
    'header': 'heading1',
    'subheading': 'heading2',
    'subheader': 'heading2',
    'body': 'body',
    'bullets': 'bullets',
    'quote': 'quote',
    'citation': 'citation',
    'caption': 'caption',
    'footer': 'footer',
    'pageNumber': 'footer',
    'label': 'label',
    'button': 'body',
    'link': 'body',
  };
  
  return roleMapping[slideRole] || 'body';
}