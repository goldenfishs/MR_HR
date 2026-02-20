import { Outlet } from 'react-router-dom';

export default function PublicLayout() {
  return (
    <div className="public-shell">
      <div className="public-orb orb-one" />
      <div className="public-orb orb-two" />
      <div className="public-pattern" />
      <div className="public-content">
        <Outlet />
      </div>
    </div>
  );
}
