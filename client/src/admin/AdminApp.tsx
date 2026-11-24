import { useCallback, useEffect, useState } from 'react';
import { ThemeProvider } from '@mui/material/styles';
import ScopedCssBaseline from '@mui/material/ScopedCssBaseline';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Drawer from '@mui/material/Drawer';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import ListSubheader from '@mui/material/ListSubheader';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Chip from '@mui/material/Chip';
import Alert from '@mui/material/Alert';
import Snackbar from '@mui/material/Snackbar';
import Paper from '@mui/material/Paper';
import TextField from '@mui/material/TextField';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import CircularProgress from '@mui/material/CircularProgress';
import Divider from '@mui/material/Divider';
import useMediaQuery from '@mui/material/useMediaQuery';
import MenuIcon from '@mui/icons-material/Menu';
import SaveIcon from '@mui/icons-material/Save';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import LogoutIcon from '@mui/icons-material/Logout';
import PublicIcon from '@mui/icons-material/Public';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import InputAdornment from '@mui/material/InputAdornment';
import type { Content } from '@shared/types';
import { adminTheme } from './theme';
import { SCHEMA, isSection, type SectionDef } from './schema';
import { FieldList } from './Fields';
import { useEditor } from './store';
import Members from './Members';
import Trainers from './Trainers';
import { clone } from './util';
import { useAdminContent, useAdminLogin, useAdminLogout, useAdminMe } from '../lib/queries';

const LOGO = '/uploads/regi/logo.png';
const DRAWER = 260;

export default function AdminApp() {
  const me = useAdminMe();
  const authed = !!me.data?.authed;
  const content = useAdminContent(authed);
  useEffect(() => { document.title = 'Szerkesztő | Az Én Kutyaiskolám'; }, []);

  let body;
  if (me.isLoading || (authed && content.isLoading)) body = <Box sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center', bgcolor: 'secondary.main' }}><CircularProgress /></Box>;
  else if (!authed || content.isError) body = <Login />;
  else body = <Editor content={content.data!} />;

  return (
    <ThemeProvider theme={adminTheme}>
      <ScopedCssBaseline sx={{ minHeight: '100vh' }}>
        {body}
        <Toast />
        <ConfirmDialog />
      </ScopedCssBaseline>
    </ThemeProvider>
  );
}

function Login() {
  const [pw, setPw] = useState('');
  const [show, setShow] = useState(false);
  const login = useAdminLogin();
  return (
    <Box sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center', bgcolor: 'secondary.main', p: 2 }}>
      <Paper component="form" variant="elevation" elevation={8} onSubmit={e => { e.preventDefault(); login.mutate(pw, { onSuccess: () => setPw('') }); }} sx={{ p: 4, width: '100%', maxWidth: 400 }}>
        <Stack spacing={2}>
          <Box component="img" src={LOGO} alt="" sx={{ height: 64, width: 64, objectFit: 'cover', objectPosition: 'left', filter: 'brightness(0)' }} />
          <Typography variant="h5">Szerkesztőfelület</Typography>
          <Typography color="text.secondary" variant="body2">Jelentkezz be az admin jelszóval a weboldal szerkesztéséhez.</Typography>
          <TextField type={show ? 'text' : 'password'} label="Jelszó" autoComplete="current-password" required autoFocus value={pw} onChange={e => setPw(e.target.value)} size="medium"
            slotProps={{ htmlInput: { autoCapitalize: 'none', autoCorrect: 'off', spellCheck: false }, input: { endAdornment: (
              <InputAdornment position="end">
                <IconButton onClick={() => setShow(s => !s)} onMouseDown={e => e.preventDefault()} edge="end" aria-label={show ? 'Jelszó elrejtése' : 'Jelszó megjelenítése'} aria-pressed={show}>
                  {show ? <VisibilityOffIcon /> : <VisibilityIcon />}
                </IconButton>
              </InputAdornment>
            ) } }} />
          {login.isError && <Alert severity="error">{(login.error as Error).message}</Alert>}
          <Button type="submit" variant="contained" size="large" disabled={login.isPending}>{login.isPending ? 'Belépés...' : 'Belépés'}</Button>
          <Button href="/" color="inherit" size="small">Vissza a weboldalra</Button>
        </Stack>
      </Paper>
    </Box>
  );
}

function Toast() {
  const toast = useEditor(s => s.toast);
  const [open, setOpen] = useState(false);
  useEffect(() => { if (toast) setOpen(true); }, [toast]);
  return (
    <Snackbar open={open && !!toast} autoHideDuration={3000} onClose={() => setOpen(false)} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
      <Alert severity={toast?.bad ? 'error' : 'success'} variant="filled" onClose={() => setOpen(false)} sx={{ width: '100%' }}>{toast?.msg}</Alert>
    </Snackbar>
  );
}

function ConfirmDialog() {
  const confirm = useEditor(s => s.confirm);
  const close = useEditor(s => s.closeConfirm);
  return (
    <Dialog open={!!confirm} onClose={() => close(false)} maxWidth="xs" fullWidth>
      <DialogContent><Typography>{confirm?.message}</Typography></DialogContent>
      <DialogActions>
        <Button onClick={() => close(false)} color="inherit">Mégse</Button>
        <Button onClick={() => close(true)} variant="contained" color={confirm?.danger ? 'error' : 'primary'} autoFocus>{confirm?.danger ? 'Igen, törlöm' : 'Igen'}</Button>
      </DialogActions>
    </Dialog>
  );
}

const sectionOf = (key: string) => SCHEMA.find(s => isSection(s) && s.key === key) as SectionDef;

function Editor({ content }: { content: Content }) {
  const section = useEditor(s => s.section);
  const dirty = useEditor(s => s.dirty);
  const saving = useEditor(s => s.saving);
  const hasDraft = useEditor(s => s.draft !== null);
  const openSection = useEditor(s => s.openSection);
  const save = useEditor(s => s.save);
  const askConfirm = useEditor(s => s.askConfirm);
  const logoutM = useAdminLogout();
  const wide = useMediaQuery(adminTheme.breakpoints.up('md'));
  const [menuOpen, setMenuOpen] = useState(false);
  const sec = sectionOf(section);

  const open = useCallback(async (key: string) => {
    if (useEditor.getState().dirty && !(await askConfirm('Van nem mentett változás. Eldobod?'))) return;
    const def = sectionOf(key);
    const src = content as unknown as Record<string, Record<string, unknown>>;
    openSection(key, def.custom ? null : clone(src[def.key] || {}));
    setMenuOpen(false);
    try { history.replaceState(null, '', '#' + key); } catch { }
    scrollTo(0, 0);
  }, [openSection, askConfirm, content]);

  useEffect(() => {
    const h = location.hash.slice(1);
    open(SCHEMA.some(s => isSection(s) && s.key === h) ? h : 'members');
  }, []);

  useEffect(() => {
    const before = (e: BeforeUnloadEvent) => { if (useEditor.getState().dirty) { e.preventDefault(); e.returnValue = ''; } };
    const key = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') { e.preventDefault(); if (useEditor.getState().dirty) useEditor.getState().save().catch(() => {}); }
    };
    addEventListener('beforeunload', before); addEventListener('keydown', key);
    return () => { removeEventListener('beforeunload', before); removeEventListener('keydown', key); };
  }, []);

  const logout = async () => {
    if (useEditor.getState().dirty && !(await askConfirm('Van nem mentett változás. Kilépsz?'))) return;
    useEditor.getState().setDirty(false);
    logoutM.mutate();
  };

  const nav = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', bgcolor: 'secondary.main', color: '#fff' }}>
      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ px: 2, py: 2 }}>
        <Box component="img" src={LOGO} alt="" sx={{ height: 40, width: 40, objectFit: 'cover', objectPosition: 'left' }} />
        <Typography fontWeight={700}>Szerkesztő</Typography>
      </Stack>
      <List dense sx={{ flex: 1, overflowY: 'auto', px: 1 }}>
        {SCHEMA.map((s, i) => isSection(s) ? (
          <ListItemButton key={s.key} selected={s.key === section} onClick={() => open(s.key)}
            sx={{ borderRadius: 2, mb: .25, color: 'rgba(255,255,255,.8)', '&.Mui-selected, &.Mui-selected:hover': { bgcolor: 'primary.main', color: '#fff' }, '&:hover': { bgcolor: 'rgba(255,255,255,.08)' } }}>
            <ListItemText primary={s.title} primaryTypographyProps={{ fontWeight: 500 }} />
          </ListItemButton>
        ) : (
          <ListSubheader key={'g' + i} disableSticky sx={{ bgcolor: 'transparent', color: 'rgba(255,255,255,.45)', fontSize: '.7rem', letterSpacing: '.12em', textTransform: 'uppercase', lineHeight: '32px', mt: 1 }}>{s.group}</ListSubheader>
        ))}
      </List>
      <Divider sx={{ borderColor: 'rgba(255,255,255,.12)' }} />
      <Stack spacing={1} sx={{ p: 2 }}>
        <Button href="/" target="_blank" rel="noopener" startIcon={<PublicIcon />} variant="outlined" color="inherit" size="small">Weboldal megnyitása</Button>
        <Button onClick={logout} startIcon={<LogoutIcon />} variant="outlined" color="inherit" size="small">Kijelentkezés</Button>
      </Stack>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      <Drawer variant={wide ? 'permanent' : 'temporary'} open={wide || menuOpen} onClose={() => setMenuOpen(false)}
        sx={{ width: DRAWER, flexShrink: 0, '& .MuiDrawer-paper': { width: DRAWER, boxSizing: 'border-box', border: 0 } }}>
        {nav}
      </Drawer>
      <Box component="main" sx={{ flex: 1, minWidth: 0 }}>
        <AppBar position="sticky" color="inherit" elevation={0} sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Toolbar sx={{ gap: 1, flexWrap: 'wrap', py: { xs: 1, sm: 0 } }}>
            {!wide && <IconButton edge="start" onClick={() => setMenuOpen(true)} aria-label="Menü"><MenuIcon /></IconButton>}
            <Typography variant="h6" sx={{ flex: 1, minWidth: 140 }}>{sec.title}</Typography>
            {dirty && <Chip label="Nem mentett változások" color="warning" size="small" variant="outlined" />}
            <Button href={sec.view} target="_blank" rel="noopener" endIcon={<OpenInNewIcon fontSize="small" />} color="inherit">Megnézem</Button>
            <Button variant="contained" startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />} disabled={!dirty || saving} onClick={() => save().catch(() => {})}>Mentés</Button>
          </Toolbar>
        </AppBar>
        <Box sx={{ p: { xs: 2, sm: 3 }, maxWidth: 1000 }}>
          {sec.key === 'members' && <Members logo={LOGO} />}
          {sec.key === 'trainer' && <Trainers />}
          {!sec.custom && hasDraft && sec.fields && (
            <Stack spacing={2}>
              {sec.help && <Alert severity="info">{sec.help}</Alert>}
              <FieldList path={[]} fields={sec.fields} />
            </Stack>
          )}
        </Box>
      </Box>
    </Box>
  );
}
