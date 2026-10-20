import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  canonical?: string;
  ogImage?: string;
  ogType?: 'website' | 'article' | 'product';
  noIndex?: boolean;
  jsonLd?: Record<string, any> | Array<Record<string, any>>;
}

const DEFAULT_TITLE = 'YAH Hope | Fé em Ação, Nutrição Infantil e Transformação Social';
const DEFAULT_DESCRIPTION = 'A YAH Hope é uma agência humanitária dedicada a erradicar a desnutrição infantil, garantir acesso à água potável, saúde e educação em Moçambique e no Brasil.';
const DEFAULT_IMAGE = 'https://yahhope.com/hero_bg.jpg';
const SITE_URL = 'https://yahhope.com';

function setMetaTag(attributeName: string, attributeValue: string, content: string) {
  let element = document.querySelector(`meta[${attributeName}="${attributeValue}"]`);
  if (!element) {
    element = document.createElement('meta');
    element.setAttribute(attributeName, attributeValue);
    document.head.appendChild(element);
  }
  element.setAttribute('content', content);
}

function setCanonicalLink(href: string) {
  let link = document.querySelector('link[rel="canonical"]');
  if (!link) {
    link = document.createElement('link');
    link.setAttribute('rel', 'canonical');
    document.head.appendChild(link);
  }
  link.setAttribute('href', href);
}

function setHreflangLink(hreflang: string, href: string) {
  let link = document.querySelector(`link[rel="alternate"][hreflang="${hreflang}"]`);
  if (!link) {
    link = document.createElement('link');
    link.setAttribute('rel', 'alternate');
    link.setAttribute('hreflang', hreflang);
    document.head.appendChild(link);
  }
  link.setAttribute('href', href);
}

export function SEO({
  title,
  description = DEFAULT_DESCRIPTION,
  keywords,
  canonical,
  ogImage = DEFAULT_IMAGE,
  ogType = 'website',
  noIndex = false,
  jsonLd
}: SEOProps) {
  const location = useLocation();

  useEffect(() => {
    // 1. Page Title
    const formattedTitle = title 
      ? (title.includes('YAH Hope') ? title : `${title} | YAH Hope`) 
      : DEFAULT_TITLE;
    document.title = formattedTitle;

    // 2. Primary Meta Tags
    setMetaTag('name', 'title', formattedTitle);
    setMetaTag('name', 'description', description);
    if (keywords) {
      setMetaTag('name', 'keywords', keywords);
    }
    setMetaTag('name', 'robots', noIndex ? 'noindex, nofollow' : 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1');

    // 3. Canonical & Hreflang URLs (strip query strings unless explicitly provided via canonical prop)
    const cleanPath = location.pathname === '/' ? '/' : location.pathname.replace(/\/$/, '');
    const currentUrl = canonical || `${SITE_URL}${cleanPath}`;
    const resolvedOgImage = ogImage.startsWith('http') ? ogImage : `${SITE_URL}${ogImage.startsWith('/') ? '' : '/'}${ogImage}`;
    setCanonicalLink(currentUrl);
    if (!noIndex) {
      setHreflangLink('pt-BR', currentUrl);
      setHreflangLink('pt-MZ', currentUrl);
      setHreflangLink('x-default', currentUrl);
    }

    // 4. Open Graph Tags
    setMetaTag('property', 'og:title', formattedTitle);
    setMetaTag('property', 'og:description', description);
    setMetaTag('property', 'og:url', currentUrl);
    setMetaTag('property', 'og:type', ogType);
    setMetaTag('property', 'og:image', resolvedOgImage);

    // 5. Twitter Card Tags
    setMetaTag('name', 'twitter:url', currentUrl);
    setMetaTag('name', 'twitter:title', formattedTitle);
    setMetaTag('name', 'twitter:description', description);
    setMetaTag('name', 'twitter:image', resolvedOgImage);

    // 6. JSON-LD Dynamic Schema (with automatic BreadcrumbList for internal public pages)
    const scriptId = 'dynamic-route-schema-jsonld';
    let scriptElement = document.getElementById(scriptId) as HTMLScriptElement | null;
    
    const schemas: Array<Record<string, any>> = [];
    if (jsonLd) {
      if (Array.isArray(jsonLd)) {
        schemas.push(...jsonLd);
      } else {
        schemas.push(jsonLd);
      }
    }

    if (!noIndex && cleanPath !== '/') {
      const pageLabel = formattedTitle.split('|')[0].trim();
      schemas.push({
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: 'Início',
            item: `${SITE_URL}/`
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: pageLabel,
            item: currentUrl
          }
        ]
      });
    }

    if (schemas.length > 0) {
      if (!scriptElement) {
        scriptElement = document.createElement('script');
        scriptElement.id = scriptId;
        scriptElement.type = 'application/ld+json';
        document.head.appendChild(scriptElement);
      }
      scriptElement.textContent = JSON.stringify(schemas.length === 1 ? schemas[0] : schemas);
    } else if (scriptElement) {
      scriptElement.remove();
    }

    return () => {
      // Optional cleanup for route-specific schema
      const dynamicSchema = document.getElementById(scriptId);
      if (dynamicSchema) {
        dynamicSchema.remove();
      }
    };
  }, [title, description, keywords, canonical, ogImage, ogType, noIndex, jsonLd, location.pathname, location.search]);

  return null;
}
