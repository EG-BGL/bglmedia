import { Navigate } from 'react-router-dom';

// Results page now merged into Fixtures with tab toggle
export default function Results() {
  return <Navigate to="/fixtures" replace />;
}
