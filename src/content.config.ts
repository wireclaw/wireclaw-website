import { defineCollection } from 'astro:content';
import { docsLoader } from '@astrojs/starlight/loaders';
import { docsSchema } from '@astrojs/starlight/schema';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const blogSeries = z.enum([
  'build-this',
  'under-the-hood',
  'agent-patterns',
  'versus',
  'toolbox',
  'ship-log',
]);

const docs = defineCollection({
  loader: docsLoader(),
  schema: docsSchema(),
});

const blog = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    date: z.coerce.date(),
    author: z.string(),
    tags: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
    series: blogSeries.optional(),
    image: z.string().optional(),
    keywords: z.array(z.string()).default([]),
  }),
});

export const collections = { docs, blog };
