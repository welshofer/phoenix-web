# Typography Sets Documentation

## Overview
We've created 10 carefully crafted typography sets for presentation content. Each set combines serif and sans-serif fonts with various sizes, styles, and weights, all easily deployable through Google Fonts.

## Typography Sets

### 1. Classic Professional
- **Primary Font**: Playfair Display (Serif)
- **Secondary Font**: Inter (Sans-serif)
- **Use Cases**: Corporate presentations, formal business meetings, annual reports
- **Character**: Elegant, authoritative, timeless
- **Tags**: professional, corporate, elegant, formal

### 2. Modern Tech
- **Primary Font**: Poppins (Sans-serif)
- **Secondary Font**: Roboto (Sans-serif)
- **Use Cases**: Tech startups, product launches, software demos
- **Character**: Clean, geometric, contemporary
- **Tags**: modern, tech, startup, clean, minimal

### 3. Editorial Elegance
- **Primary Font**: Merriweather (Serif)
- **Secondary Font**: Lato (Sans-serif)
- **Use Cases**: Educational content, research presentations, academic conferences
- **Character**: Readable, balanced, sophisticated
- **Tags**: editorial, readable, educational, content-heavy

### 4. Creative Bold
- **Primary Font**: Bebas Neue (Display)
- **Secondary Font**: Open Sans (Sans-serif)
- **Use Cases**: Marketing campaigns, creative pitches, brand presentations
- **Character**: Impactful, energetic, attention-grabbing
- **Tags**: creative, bold, marketing, impact, modern

### 5. Sophisticated Minimal
- **Primary Font**: Cormorant Garamond (Serif)
- **Secondary Font**: Montserrat (Sans-serif)
- **Use Cases**: Luxury brands, fashion, architecture, design portfolios
- **Character**: Refined, elegant, minimalist
- **Tags**: sophisticated, minimal, luxury, fashion, design

### 6. Academic Authority
- **Primary Font**: Crimson Text (Serif)
- **Secondary Font**: Source Sans Pro (Sans-serif)
- **Use Cases**: Scientific research, academic papers, scholarly presentations
- **Character**: Traditional, authoritative, scholarly
- **Tags**: academic, research, scientific, traditional, authoritative

### 7. Friendly Approachable
- **Primary Font**: Nunito (Sans-serif)
- **Secondary Font**: Raleway (Sans-serif)
- **Use Cases**: Community presentations, educational workshops, team meetings
- **Character**: Warm, welcoming, accessible
- **Tags**: friendly, approachable, educational, community, warm

### 8. Corporate Clean
- **Primary Font**: Roboto Slab (Slab Serif)
- **Secondary Font**: Roboto (Sans-serif)
- **Use Cases**: Business consulting, financial reports, professional services
- **Character**: Modern, professional, structured
- **Tags**: corporate, business, consulting, modern, clean

### 9. Artistic Expression
- **Primary Font**: Spectral (Serif)
- **Secondary Font**: Work Sans (Sans-serif)
- **Use Cases**: Creative agencies, art presentations, design showcases
- **Character**: Expressive, unique, creative
- **Tags**: artistic, creative, design, expressive, unique

### 10. Bold Statement
- **Primary Font**: Oswald (Display)
- **Secondary Font**: Libre Franklin (Sans-serif)
- **Use Cases**: Motivational talks, sports presentations, dynamic pitches
- **Character**: Bold, energetic, powerful
- **Tags**: bold, impactful, energetic, statement, dynamic

## Implementation

### Loading Fonts
All typography sets use Google Fonts, which are loaded dynamically when selected:

```typescript
import { loadGoogleFonts } from '@/lib/typography/font-loader';
import { typographySets } from '@/lib/typography/typography-sets';

// Load fonts for a specific set
const selectedSet = typographySets[0]; // Classic Professional
loadGoogleFonts(selectedSet);
```

### Using Typography in Components
```typescript
import { getTypographySetById } from '@/lib/typography/typography-sets';

const typography = getTypographySetById('modern-tech');

// Apply to element
const titleStyle = typography.roles.title;
```

### Typography Roles
Each set defines styles for these roles:
- **title**: Main slide title
- **subtitle**: Secondary title
- **sectionHeader**: Section dividers
- **heading1/2/3**: Hierarchical headings
- **body/bodyLarge/bodySmall**: Body text variations
- **bullet**: Bullet point text
- **quote/citation**: Quotations and attributions
- **caption**: Image/table captions
- **label**: UI labels
- **footnote**: Small annotations
- **code**: Monospace text
- **emphasis/strong**: Inline text emphasis
- **pageNumber/date**: Metadata
- **footer/header**: Page elements
- **watermark**: Background watermarks

## Typography Scales
All sets use mathematical scales for consistent size hierarchies:
- Minor Third (1.2)
- Major Third (1.25)
- Perfect Fourth (1.333)
- Augmented Fourth (1.414)
- Perfect Fifth (1.5)
- Golden Ratio (1.618)

## Responsive Considerations
Font sizes are designed for 1920x1080 presentations and scale proportionally with viewport size.

## Demo Page
View all typography sets at: `/typography-demo`

## Next Steps
1. Integrate typography selection into presentation creation flow
2. Add typography preview in presentation editor
3. Apply selected typography to slide exports (PowerPoint, PDF)
4. Create theme presets that combine typography with color palettes