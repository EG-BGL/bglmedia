import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="border-t border-border bg-card mt-auto">
      <div className="page-container py-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-sm">
          <div>
            <h4 className="font-bold text-foreground mb-3 text-xs uppercase tracking-wider">Competition</h4>
            <div className="flex flex-col gap-2 text-muted-foreground">
              <Link to="/fixtures" className="hover:text-foreground transition-colors">Fixtures</Link>
              <Link to="/results" className="hover:text-foreground transition-colors">Results</Link>
              <Link to="/ladder" className="hover:text-foreground transition-colors">Ladder</Link>
            </div>
          </div>
          <div>
            <h4 className="font-bold text-foreground mb-3 text-xs uppercase tracking-wider">Clubs</h4>
            <div className="flex flex-col gap-2 text-muted-foreground">
              <Link to="/clubs" className="hover:text-foreground transition-colors">All Clubs</Link>
            </div>
          </div>
          <div>
            <h4 className="font-bold text-foreground mb-3 text-xs uppercase tracking-wider">Portal</h4>
            <div className="flex flex-col gap-2 text-muted-foreground">
              <Link to="/login" className="hover:text-foreground transition-colors">Coach Login</Link>
              <Link to="/portal" className="hover:text-foreground transition-colors">Dashboard</Link>
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="h-6 w-6 rounded-md bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-black text-[9px]">BGL</span>
              </div>
              <span className="font-black text-sm">BGLMedia</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">BGLMedia. Your local community football competition.</p>
          </div>
        </div>
        <div className="border-t border-border mt-6 pt-4 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} BGLMedia. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
