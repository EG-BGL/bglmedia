import { Newspaper } from 'lucide-react';
import { useNews } from '@/hooks/useData';

interface NewsTabProps {
  homeClub: any;
  awayClub: any;
}

export default function NewsTab({ homeClub, awayClub }: NewsTabProps) {
  const { data: news, isLoading } = useNews(10);

  // Filter news that might mention either club (simple text search)
  const clubNames = [homeClub?.name, homeClub?.short_name, awayClub?.name, awayClub?.short_name].filter(Boolean).map((n: string) => n.toLowerCase());

  const relatedNews = news?.filter((n: any) => {
    const text = `${n.title} ${n.content} ${n.excerpt || ''}`.toLowerCase();
    return clubNames.some(name => text.includes(name));
  }) ?? [];

  const displayNews = relatedNews.length > 0 ? relatedNews : (news?.slice(0, 5) ?? []);
  const isRelated = relatedNews.length > 0;

  return (
    <div className="space-y-3">
      <div className="match-card overflow-hidden">
        <div className="px-4 py-3 border-b border-border/30 flex items-center gap-1.5">
          <Newspaper className="h-3.5 w-3.5 text-muted-foreground" />
          <h3 className="text-xs font-black uppercase tracking-wider text-muted-foreground">
            {isRelated ? 'Related News' : 'Latest News'}
          </h3>
        </div>
        <div className="divide-y divide-border/30">
          {isLoading ? (
            <div className="px-4 py-8 text-center text-xs text-muted-foreground">Loading news...</div>
          ) : displayNews.length > 0 ? (
            displayNews.map((article: any) => (
              <div key={article.id} className="px-4 py-3">
                <h4 className="text-xs font-bold text-foreground leading-snug mb-1">{article.title}</h4>
                {article.excerpt && <p className="text-[11px] text-muted-foreground line-clamp-2">{article.excerpt}</p>}
                {article.published_at && (
                  <p className="text-[10px] text-muted-foreground/60 mt-1.5">
                    {new Date(article.published_at).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                )}
              </div>
            ))
          ) : (
            <div className="px-4 py-8 text-center">
              <Newspaper className="h-8 w-8 text-muted-foreground/20 mx-auto mb-2" />
              <p className="text-xs text-muted-foreground">No news articles yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
