import { lazy, Suspense, useEffect } from 'react';
import { Navigate, Route, Routes, useLocation, useParams } from 'react-router-dom';
import { useApp } from './context';
import { useReveal, useScrollEffects } from './lib/effects';
import Home from './pages/Home';
import { Kepzesek, Oktatok, Hirek, Hir, Rendezvenyek, Galeria, Gyik, Kapcsolat, NotFound } from './pages/Pages';
import Tagoknak from './pages/Tagoknak';
import Kikepzo from './pages/Kikepzo';

const AdminApp = lazy(() => import('./admin/AdminApp'));

function ScrollManager() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (hash) { setTimeout(() => document.getElementById(hash.slice(1))?.scrollIntoView(), 50); return; }
    scrollTo(0, 0);
  }, [pathname, hash]);
  return null;
}
function OldTrainerLink() { const { '*': rest } = useParams(); return <Navigate to={'/kikepzo/' + (rest || '')} replace />; }

function Site() {
  const { content } = useApp();
  const { pathname } = useLocation();
  useScrollEffects();
  useReveal(pathname + (content ? '1' : '0'));
  if (!content) return <div className="app-loading"><div className="ci-spin" /></div>;
  return (
    <>
      <ScrollManager />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/kepzesek" element={<Kepzesek />} />
        <Route path="/oktatok" element={<Oktatok />} />
        <Route path="/hirek" element={<Hirek />} />
        <Route path="/hirek/:id" element={<Hir />} />
        <Route path="/rendezvenyek" element={<Rendezvenyek />} />
        <Route path="/galeria" element={<Galeria />} />
        <Route path="/gyik" element={<Gyik />} />
        <Route path="/kapcsolat" element={<Kapcsolat />} />
        <Route path="/tagoknak" element={<Tagoknak />} />
        <Route path="/kikepzo" element={<Kikepzo />} />
        <Route path="/kikepzo/b/:token" element={<Kikepzo />} />
        <Route path="/edzo/*" element={<OldTrainerLink />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}

export default function App() {
  const { pathname } = useLocation();
  if (pathname === '/admin' || pathname.startsWith('/admin/')) {
    return <Suspense fallback={<div className="app-loading"><div className="ci-spin" /></div>}><AdminApp /></Suspense>;
  }
  return <Site />;
}
