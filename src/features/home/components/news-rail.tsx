import Image from 'next/image';
import Link from 'next/link';
import { Container } from '@/components/ui/container';
import { SectionHeading } from '@/components/ui/section-heading';
import type { ArticleCard } from '@/domain/listing';
import { formatDate } from '@/lib/format';

/** "Latest News" — three editorial cards. */
export function NewsRail({ articles }: { articles: ArticleCard[] }) {
  if (articles.length === 0) return null;

  return (
    <Container as="section" className="pt-12" aria-labelledby="latest-news-heading">
      <SectionHeading id="latest-news-heading" lead="Latest" highlight="News" viewAllHref="/blog" />

      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {articles.map((article) => (
          <li key={article.slug}>
            <article className="group relative flex h-full flex-col overflow-hidden rounded-card border border-border-subtle bg-surface shadow-card transition-shadow hover:shadow-lift">
              <div className="relative h-44 w-full overflow-hidden bg-ink-100">
                {article.coverImageUrl ? (
                  <Image
                    src={article.coverImageUrl}
                    alt=""
                    aria-hidden="true"
                    fill
                    sizes="(min-width: 1024px) 380px, (min-width: 640px) 45vw, 90vw"
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                ) : null}
              </div>

              <div className="flex flex-1 flex-col p-4">
                <p className="text-2xs text-ink-400">
                  {article.publishedAt ? formatDate(article.publishedAt) : 'Unpublished'} · {article.readMinutes} min
                  read
                </p>

                <h3 className="mt-2 text-sm leading-snug font-semibold text-ink-900">
                  <Link href={`/blog/${article.slug}`} className="after:absolute after:inset-0 after:content-['']">
                    {article.title}
                  </Link>
                </h3>

                {article.excerpt ? (
                  <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-ink-500">{article.excerpt}</p>
                ) : null}
              </div>
            </article>
          </li>
        ))}
      </ul>
    </Container>
  );
}
