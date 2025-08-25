import { z } from 'zod';

// Common validation patterns
const emailSchema = z.string().email('Invalid email address');
const uuidSchema = z.string().uuid('Invalid UUID format');
const urlSchema = z.string().url('Invalid URL format');
const dateSchema = z.string().datetime('Invalid date format');

// Presentation validation schemas
export const PresentationStyleSchema = z.enum(['professional', 'creative', 'educational'], {
  errorMap: () => ({ message: 'Style must be professional, creative, or educational' }),
});

export const GeneratePresentationSchema = z.object({
  topic: z
    .string()
    .min(3, 'Topic must be at least 3 characters')
    .max(200, 'Topic must be less than 200 characters')
    .trim(),
  slideCount: z
    .number()
    .int('Slide count must be an integer')
    .min(3, 'Minimum 3 slides required')
    .max(20, 'Maximum 20 slides allowed')
    .optional()
    .default(10),
  style: PresentationStyleSchema.optional().default('professional'),
  userId: z.string().min(1, 'User ID is required'),
  idToken: z.string().min(1, 'Authentication token is required'),
});

export type GeneratePresentationInput = z.infer<typeof GeneratePresentationSchema>;

// Slide validation schemas
export const SlideTypeSchema = z.enum([
  'title',
  'bullets',
  'content',
  'image',
  'threeImages',
  'twoColumn',
  'quote',
]);

export const SlideSchema = z.object({
  id: z.string(),
  type: SlideTypeSchema,
  heading: z.string().max(100, 'Heading too long'),
  subheading: z.string().max(200, 'Subheading too long').optional(),
  bullets: z.array(z.string().max(200)).max(10).optional(),
  body: z.string().max(1000, 'Body text too long').optional(),
  imageUrl: urlSchema.optional(),
  imageDescription: z.string().max(500).optional(),
  imageDescriptions: z.array(z.string().max(500)).max(3).optional(),
  leftColumn: z.string().max(500).optional(),
  rightColumn: z.string().max(500).optional(),
  quote: z.string().max(300).optional(),
  author: z.string().max(100).optional(),
  theme: z.string().optional(),
});

export type Slide = z.infer<typeof SlideSchema>;

// User validation schemas
export const CreateUserSchema = z.object({
  email: emailSchema,
  displayName: z
    .string()
    .min(2, 'Display name must be at least 2 characters')
    .max(50, 'Display name too long')
    .optional(),
  photoURL: urlSchema.optional(),
  phoneNumber: z
    .string()
    .regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format')
    .optional(),
});

export const UpdateUserSchema = CreateUserSchema.partial();

export type CreateUserInput = z.infer<typeof CreateUserSchema>;
export type UpdateUserInput = z.infer<typeof UpdateUserSchema>;

// Presentation model validation
export const PresentationSchema = z.object({
  id: uuidSchema,
  title: z.string().min(1, 'Title is required').max(100),
  subtitle: z.string().max(200).optional(),
  userId: z.string().min(1),
  slides: z.array(SlideSchema).min(1, 'At least one slide is required'),
  createdAt: dateSchema,
  updatedAt: dateSchema,
  isPublic: z.boolean().default(false),
  sharedWith: z.array(z.string()).default([]),
  tags: z.array(z.string().max(30)).max(10).optional(),
  metadata: z
    .object({
      generatedAt: dateSchema,
      topic: z.string(),
      slideCount: z.number(),
      style: PresentationStyleSchema,
      version: z.string().optional(),
    })
    .optional(),
});

export type Presentation = z.infer<typeof PresentationSchema>;

// Image generation validation
export const GenerateImageSchema = z.object({
  prompt: z
    .string()
    .min(10, 'Prompt must be at least 10 characters')
    .max(1000, 'Prompt too long'),
  width: z.number().int().min(256).max(2048).optional().default(1024),
  height: z.number().int().min(256).max(2048).optional().default(1024),
  aspectRatio: z.enum(['1:1', '16:9', '9:16', '4:3', '3:4']).optional(),
  style: z
    .enum(['realistic', 'artistic', 'cartoon', 'sketch'])
    .optional()
    .default('realistic'),
  quality: z.enum(['low', 'medium', 'high']).optional().default('medium'),
  negativePrompt: z.string().max(500).optional(),
});

export type GenerateImageInput = z.infer<typeof GenerateImageSchema>;

// Podcast generation validation
export const GeneratePodcastSchema = z.object({
  presentationId: uuidSchema,
  voice: z.enum(['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer']).default('alloy'),
  speed: z.number().min(0.5).max(2.0).default(1.0),
  language: z.string().length(2).default('en'),
  format: z.enum(['mp3', 'wav', 'ogg']).default('mp3'),
});

export type GeneratePodcastInput = z.infer<typeof GeneratePodcastSchema>;

// Export validation
export const ExportPresentationSchema = z.object({
  presentationId: uuidSchema,
  format: z.enum(['pptx', 'pdf', 'html', 'json']),
  includeNotes: z.boolean().optional().default(false),
  includeImages: z.boolean().optional().default(true),
  quality: z.enum(['low', 'medium', 'high']).optional().default('high'),
});

export type ExportPresentationInput = z.infer<typeof ExportPresentationSchema>;

// Feedback validation
export const CreateFeedbackSchema = z.object({
  userId: z.string().min(1),
  presentationId: uuidSchema.optional(),
  type: z.enum(['bug', 'feature', 'improvement', 'other']),
  title: z.string().min(5).max(100),
  description: z.string().min(20).max(2000),
  rating: z.number().int().min(1).max(5).optional(),
  email: emailSchema.optional(),
  attachments: z.array(urlSchema).max(5).optional(),
});

export type CreateFeedbackInput = z.infer<typeof CreateFeedbackSchema>;

// Analytics event validation
export const AnalyticsEventSchema = z.object({
  userId: z.string().optional(),
  sessionId: uuidSchema,
  event: z.string().max(50),
  category: z.string().max(50),
  action: z.string().max(50).optional(),
  label: z.string().max(100).optional(),
  value: z.number().optional(),
  properties: z.record(z.unknown()).optional(),
  timestamp: dateSchema,
  userAgent: z.string().optional(),
  ip: z.string().ip().optional(),
});

export type AnalyticsEvent = z.infer<typeof AnalyticsEventSchema>;

// API response validation
export const ApiSuccessResponseSchema = <T extends z.ZodType>(dataSchema: T) =>
  z.object({
    success: z.literal(true),
    data: dataSchema,
    metadata: z
      .object({
        timestamp: dateSchema,
        requestId: z.string().optional(),
        version: z.string().optional(),
      })
      .optional(),
  });

export const ApiErrorResponseSchema = z.object({
  success: z.literal(false),
  error: z.object({
    message: z.string(),
    code: z.string().optional(),
    statusCode: z.number(),
    details: z.unknown().optional(),
  }),
  timestamp: dateSchema,
  requestId: z.string().optional(),
});

// Pagination validation
export const PaginationSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

export type PaginationInput = z.infer<typeof PaginationSchema>;

// Search validation
export const SearchSchema = z.object({
  query: z.string().min(1).max(200),
  filters: z
    .object({
      userId: z.string().optional(),
      tags: z.array(z.string()).optional(),
      createdAfter: dateSchema.optional(),
      createdBefore: dateSchema.optional(),
      isPublic: z.boolean().optional(),
    })
    .optional(),
  pagination: PaginationSchema.optional(),
});

export type SearchInput = z.infer<typeof SearchSchema>;

// Validation helper functions
export function validateInput<T>(
  schema: z.ZodType<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: string[] } {
  try {
    const validated = schema.parse(data);
    return { success: true, data: validated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.errors.map((e) => {
        const path = e.path.join('.');
        return path ? `${path}: ${e.message}` : e.message;
      });
      return { success: false, errors };
    }
    return { success: false, errors: ['Validation failed'] };
  }
}

export function validatePartial<T>(
  schema: z.ZodType<T>,
  data: unknown
): { success: true; data: Partial<T> } | { success: false; errors: string[] } {
  const partialSchema = schema.partial();
  return validateInput(partialSchema, data) as any;
}

// Sanitization helpers
export function sanitizeString(input: string, maxLength: number = 1000): string {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .slice(0, maxLength);
}

export function sanitizeHtml(input: string): string {
  // Basic HTML sanitization - in production, use a library like DOMPurify
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/on\w+\s*=\s*"[^"]*"/gi, '') // Remove event handlers
    .replace(/on\w+\s*=\s*'[^']*'/gi, '');
}

// Export all schemas for easy access
export const schemas = {
  presentation: {
    generate: GeneratePresentationSchema,
    model: PresentationSchema,
    export: ExportPresentationSchema,
  },
  user: {
    create: CreateUserSchema,
    update: UpdateUserSchema,
  },
  slide: SlideSchema,
  image: GenerateImageSchema,
  podcast: GeneratePodcastSchema,
  feedback: CreateFeedbackSchema,
  analytics: AnalyticsEventSchema,
  pagination: PaginationSchema,
  search: SearchSchema,
};