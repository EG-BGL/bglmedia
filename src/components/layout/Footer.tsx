import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="sport-gradient text-primary-foreground/80 mt-auto">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div>
            <h4 className="font-bold text-primary-foreground mb-3">Competition</h4>
            <div className="flex flex-col gap-2 text-sm">
              <Link to="/fixtures" className="hover:text-accent transition-colors">Fixtures</Link>
              <Link to="/results" className="hover:text-accent transition-colors">Results</Link>
              <Link to="/ladder" className="hover:text-accent transition-colors">Ladder</Link>
            </div>
          </div>
          <div>
            <h4 className="font-bold text-primary-foreground mb-3">Clubs</h4>
            <div className="flex flex-col gap-2 text-sm">
              <Link to="/clubs" className="hover:text-accent transition-colors">All Clubs</Link>
            </div>
          </div>
          <div>
            <h4 className="font-bold text-primary-foreground mb-3">Portal</h4>
            <div className="flex flex-col gap-2 text-sm">
              <Link to="/login" className="hover:text-accent transition-colors">Coach Login</Link>
              <Link to="/portal" className="hover:text-accent transition-colors">Dashboard</Link>
            </div>
          </div>
          <div>
            <h4 className="font-bold text-primary-foreground mb-3">FootyLeague</h4>
            <p className="text-sm">Your local community football competition hub.</p>
          </div>
        </div>
        <div className="border-t border-primary-foreground/10 mt-6 pt-4 text-center text-xs">
          © {new Date().getFullYear()} FootyLeague. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
