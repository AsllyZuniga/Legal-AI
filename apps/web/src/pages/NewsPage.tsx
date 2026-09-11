import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Newspaper, Globe, MapPin, Flag, Calendar, ExternalLink, Loader2, RefreshCw } from 'lucide-react';
import api from '../services/api';

interface NewsItem {
  id: string;
  title: string;
  summary: string;
  category: string;
  source: string;
  sourceUrl?: string;
  imageUrl?: string;
  tags: string[];
  isFeatured: boolean;
  date: string;
  isExternal: boolean;
}

const categories = [
  { id: 'all', label: 'Todas', icon: Globe },
  { id: 'regional', label: 'Regional', icon: MapPin },
  { id: 'nacional', label: 'Nacional', icon: Flag },
  { id: 'internacional', label: 'Internacional', icon: Globe },
];

export default function NewsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedCategory = searchParams.get('category') || 'all';
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNews = async () => {
    setLoading(true);
    try {
      const params = selectedCategory !== 'all' ? `?category=${selectedCategory}` : '';
      const res = await api.get(`/news${params}`);
      setNews(res.data);
    } catch (err) {
      console.error('Error fetching news:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNews();
  }, [selectedCategory]);

  const handleCategoryChange = (catId: string) => {
    if (catId === 'all') {
      setSearchParams({});
    } else {
      setSearchParams({ category: catId });
    }
  };

  const getCategoryBadge = (category: string) => {
    const styles: Record<string, string> = {
      regional: 'bg-blue-100 text-blue-700',
      nacional: 'bg-green-100 text-green-700',
      internacional: 'bg-purple-100 text-purple-700',
    };
    const labels: Record<string, string> = {
      regional: 'Regional',
      nacional: 'Nacional',
      internacional: 'Internacional',
    };
    return (
      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${styles[category] || 'bg-gray-100 text-gray-700'}`}>
        {labels[category] || category}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Newspaper className="h-6 w-6" />
            Noticias Jurídicas
          </h1>
          <p className="text-muted-foreground mt-1">
            Actualidad legal regional, nacional e internacional
          </p>
        </div>
        <button
          onClick={fetchNews}
          className="flex items-center gap-2 px-4 py-2 bg-card border rounded-lg text-sm hover:border-primary/50 transition-colors"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Actualizar
        </button>
      </div>

      <div className="flex gap-2 flex-wrap">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => handleCategoryChange(cat.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              selectedCategory === cat.id
                ? 'bg-primary text-primary-foreground'
                : 'bg-card border hover:border-primary/50'
            }`}
          >
            <cat.icon className="h-4 w-4" />
            {cat.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {news.map((item) => (
            <article
              key={item.id}
              className="bg-card rounded-lg border p-5 hover:border-primary/50 transition-colors flex flex-col"
            >
              <div className="flex items-center justify-between mb-3">
                {getCategoryBadge(item.category)}
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {new Date(item.date).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })}
                </span>
              </div>
              <h3 className="font-semibold text-lg mb-2 line-clamp-2">{item.title}</h3>
              <p className="text-sm text-muted-foreground mb-4 flex-1 line-clamp-3">{item.summary}</p>
              <div className="flex items-center justify-between pt-3 border-t">
                <span className="text-xs text-muted-foreground">{item.source}</span>
                {item.sourceUrl && (
                  <a
                    href={item.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-primary flex items-center gap-1 hover:underline"
                  >
                    Leer más <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
              {item.tags && item.tags.length > 0 && (
                <div className="flex gap-1 mt-3 flex-wrap">
                  {item.tags.map((tag) => (
                    <span key={tag} className="text-xs bg-muted px-2 py-0.5 rounded">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </article>
          ))}
        </div>
      )}

      {!loading && news.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          No hay noticias disponibles en esta categoría
        </div>
      )}
    </div>
  );
}
