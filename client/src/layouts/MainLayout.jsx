import { Outlet } from "react-router-dom";

const MainLayout = () => (
  <div className="min-h-screen bg-surface-secondary flex flex-col">
    <Outlet />
  </div>
);

export default MainLayout;
