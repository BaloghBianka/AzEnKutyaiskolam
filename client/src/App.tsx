import { lazy, Suspense, useEffect } from 'react';
import { Navigate, Route, Routes, useLocation, useNavigate, useParams } from 'react-router-dom';
import { useApp } from './context';
import { useReveal, useScrollEffects } from './lib/effects';
import Home from './pages/Home';
import { Kepzesek, Oktatok, Hirek, Hir, Rendezvenyek, Galeria, Gyik, Kapcsolat, NotFound } from './pages/Pages';
import Tagoknak from './pages/Tagoknak';
import Kikepzo from './pages/Kikepzo';
import { isStandalone } from './lib/pwa';

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
  const { content, contentError, retryContent } = useApp();
  const { pathname } = useLocation();
  useScrollEffects();
  useReveal(pathname + (content ? '1' : '0'));
  if (!content && contentError) return (
    <div className="app-loading app-offline">
      <img src="/icons/icon-192.png" alt="" width={72} height={72} />
      <h1>Nincs internet</h1>
      <p>Az oldal még nem volt megnyitva ezen a telefonon térerővel, ezért nincs mit megmutatni. Nyisd meg egyszer internettel, utána net nélkül is működik.</p>
      <button type="button" className="btn btn-red" onClick={retryContent}>Újra</button>
    </div>
  );
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

const START_KEY = 'kutyaiskola.kezdolap';
const APP_PAGES = ['/tagoknak', '/kikepzo'];

function AppStart() {
  const { pathname, search } = useLocation();
  const navigate = useNavigate();
  useEffect(() => {
    const page = APP_PAGES.find(p => pathname === p || pathname.startsWith(p + '/'));
    if (page) try { localStorage.setItem(START_KEY, page); } catch { }
  }, [pathname]);
  useEffect(() => {
    const launched = new URLSearchParams(search).has('app') || (isStandalone() && pathname === '/');
    if (!launched) return;
    let target = '/';
    try { const v = localStorage.getItem(START_KEY); if (v && APP_PAGES.includes(v)) target = v; } catch { }
    navigate(target, { replace: true });
  }, []);
  return null;
}

export default function App() {
  return <><AppStart /><Pages /></>;
}

function Pages() {
  const { pathname } = useLocation();
  if (pathname === '/admin' || pathname.startsWith('/admin/')) {
    return <Suspense fallback={<div className="app-loading"><div className="ci-spin" /></div>}><AdminApp /></Suspense>;
  }
  return <Site />;
}
