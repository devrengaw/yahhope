import { useEffect, useMemo, useState } from 'react';
import { BlogPost } from '../contexts/BlogContext';
import { getTranslationCache, translateHtmlOrPlainText } from './autoTranslate';

interface BlogPostTranslation {
  title?: string;
  excerpt?: string;
  content?: string;
  category?: string;
  author?: string;
}

const KNOWN_BLOG_POSTS_BY_ID: Record<string, BlogPostTranslation> = {
  'post-1': {
    title: 'The purpose of an island',
    excerpt:
      'Our nutrition center welcomes children in critical food vulnerability, providing balanced diets and continuous medical care.',
    content: `
      <p>In the province of Nampula, Mozambique, severe child malnutrition is one of the greatest threats to the development and survival of children in their early years.</p>
      <p>Casa Nutri was born to transform this reality. With weekly clinical monitoring, fortified food introduction, and nutritional education for mothers, we rescue children from the critical curve of malnutrition.</p>
      <h3>Direct Impact</h3>
      <ul>
        <li>Over 1,800 therapeutic meals distributed every month.</li>
        <li>Recovery of ideal weight and immune strengthening.</li>
        <li>Medical and psychological follow-up with the family.</li>
      </ul>
      <p>Every restored smile represents a future reborn on fertile ground of hope and solidarity.</p>
    `,
    category: 'Nutrition & Child Health',
  },
  'post-2': {
    title: 'A chronic problem',
    excerpt:
      'Understanding the historical and structural roots of food hardship and how community empowerment breaks generational cycles.',
    content: `
      <p>Access to clean drinking water and dignified nutrition in Mozambique remains a challenge for millions of vulnerable families.</p>
      <p>Our mission acts not only in immediate emergency relief, but in the sustainable empowerment of the community with artesian wells and agroecological gardens.</p>
      <h3>Steps Toward Sustainability</h3>
      <p>Health education and family autonomy ensure that today's nutritional achievements remain tomorrow.</p>
    `,
    category: 'All About Mozambique',
  },
  'post-3': {
    title: 'Do you have firm conviction?',
    excerpt:
      'A reflection on faith in practical action, purposeful generosity, and the individual call to turn another’s pain into hope.',
    content: `
      <p>Compassion that does not move toward those in need remains merely a pleasant feeling. The living Gospel is manifested in the plate of food and the medicine delivered.</p>
      <p>When we ask ourselves about the impact of our lives, the measure is not how much we accumulate, but how many lives were able to breathe easier because of our presence.</p>
    `,
    category: 'Think & Reflect',
  },
  'post-4': {
    title: 'The beginning',
    excerpt:
      'A look back at YAH Hope’s first steps in the villages of Nampula, the challenges of welcoming families, and the seeds that sprouted.',
    content: `
      <p>Arriving in a new community requires respect, attentive listening, and sincere connection. Before any project, we sat down with the elders and local mothers.</p>
      <p>It was through that dialogue that we understood the urgent needs: child nutrition, vocational training, and access to clean water.</p>
    `,
    category: 'Journeys',
  },
  'post-5': {
    title: 'A little about Mozambique',
    excerpt:
      'Culture, resilience, and the human stories behind the landscapes and our humanitarian work.',
    content: `
      <p>Mozambique is a land of rich cultural heritage, warm hospitality, and extraordinarily resilient people.</p>
      <p>Every community holds tremendous potential that only needs support to flourish with autonomy and dignity.</p>
    `,
    category: 'All About Mozambique',
  },
};

const KNOWN_EXCERPTS: Record<string, string> = {
  'nosso centro nutricional acolhe crianças em estado crítico de vulnerabilidade alimentar, fornecendo dietas balanceadas e assistência médica contínua.':
    'Our nutrition center welcomes children in critical food vulnerability, providing balanced diets and continuous medical care.',
  'compreendendo as raízes históricas e estruturais das dificuldades alimentares e como a capacitação comunitária rompe ciclos geracionais.':
    'Understanding the historical and structural roots of food hardship and how community empowerment breaks generational cycles.',
  'uma reflexão sobre fé em ação prática, generosidade com propósito e o chamado individual para transformar a dor do próximo em esperança.':
    'A reflection on faith in practical action, purposeful generosity, and the individual call to turn another’s pain into hope.',
  'relato dos primeiros passos da yah hope nas aldeias de nampula, os desafios do acolhimento e as sementes que germinaram.':
    'A look back at YAH Hope’s first steps in the villages of Nampula, the challenges of welcoming families, and the seeds that sprouted.',
  'cultura, resiliência e as histórias humanas por trás das paisagens e da nossa frente de atuação humanitária.':
    'Culture, resilience, and the human stories behind the landscapes and our humanitarian work.',
};

const KNOWN_TITLES: Record<string, string> = {
  'o propósito de uma ilha': 'The purpose of an island',
  'um problema crônico': 'A chronic problem',
  'você tem a firme certeza?': 'Do you have firm conviction?',
  'o início': 'The beginning',
  'um pouco sobre moçambique': 'A little about Mozambique',
};

const BLOG_CATEGORY_MAP: Record<string, string> = {
  'geral': 'General',
  'tudo sobre moçambique': 'All About Mozambique',
  'viagens': 'Journeys',
  'pense e reflita': 'Think & Reflect',
  'nutrição & saúde infantil': 'Nutrition & Child Health',
  'nutrição e saúde infantil': 'Nutrition & Child Health',
  'nutrição': 'Nutrition',
  'educação': 'Education',
  'histórias de impacto': 'Impact Stories',
  'notícias': 'News',
  'relatórios': 'Reports',
};

const AUTHOR_MAP: Record<string, string> = {
  'equipe yah hope': 'YAH Hope Team',
};

export function translateBlogPostSync(post: BlogPost, isEn: boolean): BlogPost {
  if (!isEn) return post;

  const known = KNOWN_BLOG_POSTS_BY_ID[post.id];
  const cache = getTranslationCache();

  const resolveField = (
    original: string | undefined,
    lookupMap?: Record<string, string>,
    knownFallback?: string
  ) => {
    if (!original) return original;
    const norm = original.trim().toLowerCase();
    if (lookupMap && lookupMap[norm]) return lookupMap[norm];
    if (knownFallback && cache[`__exact__:${norm}`]) return cache[`__exact__:${norm}`];
    if (cache[original.trim()]) return cache[original.trim()];
    if (knownFallback && norm === knownFallback.toLowerCase()) return knownFallback;
    return original;
  };

  // For content, use curated HTML only if the title & excerpt match the default post (not customized in Supabase)
  const isDefaultContent =
    known?.content &&
    KNOWN_TITLES[(post.title || '').trim().toLowerCase()] &&
    KNOWN_EXCERPTS[(post.excerpt || '').trim().toLowerCase()];

  return {
    ...post,
    title: resolveField(post.title, KNOWN_TITLES) || post.title,
    excerpt: resolveField(post.excerpt, KNOWN_EXCERPTS) || post.excerpt,
    content: (isDefaultContent ? known.content : resolveField(post.content)) || post.content,
    category: resolveField(post.category, BLOG_CATEGORY_MAP) || post.category,
    author: resolveField(post.author, AUTHOR_MAP) || post.author,
  };
}

function collectUntranslatedBlogFields(post: BlogPost): string[] {
  const known = KNOWN_BLOG_POSTS_BY_ID[post.id];
  const cache = getTranslationCache();
  const missing: string[] = [];

  const isDefaultContent =
    known?.content &&
    KNOWN_TITLES[(post.title || '').trim().toLowerCase()] &&
    KNOWN_EXCERPTS[(post.excerpt || '').trim().toLowerCase()];

  const check = (val: string | undefined, lookupMap?: Record<string, string>, skip?: boolean) => {
    if (skip || !val || !val.trim()) return;
    if (lookupMap && lookupMap[val.trim().toLowerCase()]) return;
    if (cache[val.trim()]) return;
    missing.push(val);
  };

  check(post.title, KNOWN_TITLES);
  check(post.excerpt, KNOWN_EXCERPTS);
  check(post.content, undefined, Boolean(isDefaultContent));
  check(post.category, BLOG_CATEGORY_MAP);

  return missing;
}

export function useTranslatedBlogPosts(posts: BlogPost[], isEn: boolean): BlogPost[] {
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    if (!isEn || posts.length === 0) return;

    const toTranslate = new Set<string>();
    for (const p of posts) {
      if (p.status !== 'published') continue;
      for (const field of collectUntranslatedBlogFields(p)) {
        toTranslate.add(field);
      }
    }

    if (toTranslate.size === 0) return;

    let cancelled = false;
    Promise.all(Array.from(toTranslate).map((text) => translateHtmlOrPlainText(text))).then(() => {
      if (!cancelled) {
        setRevision((r) => r + 1);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [posts, isEn]);

  return useMemo(
    () => posts.map((p) => translateBlogPostSync(p, isEn)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [posts, isEn, revision]
  );
}
