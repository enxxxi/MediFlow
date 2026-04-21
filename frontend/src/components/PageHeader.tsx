import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function PageHeader({ title, subtitle, showBack = true }: { title: string; subtitle?: string; showBack?: boolean }) {
  const navigate = useNavigate();
  return (
    <header className="px-4 pt-6 pb-4">
      <div className="flex items-center gap-3">
        {showBack && (
          <button onClick={() => navigate(-1)} className="p-2 rounded-xl bg-card shadow-card hover:shadow-elevated transition-shadow">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
        )}
        <div>
          <h1 className="text-xl font-bold text-foreground">{title}</h1>
          {subtitle && <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>}
        </div>
      </div>
    </header>
  );
}
