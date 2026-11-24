import { useState } from 'react';
import Stack from '@mui/material/Stack';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Alert from '@mui/material/Alert';
import Chip from '@mui/material/Chip';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import Divider from '@mui/material/Divider';
import InputAdornment from '@mui/material/InputAdornment';
import Skeleton from '@mui/material/Skeleton';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import AutorenewIcon from '@mui/icons-material/Autorenew';
import RefreshIcon from '@mui/icons-material/Refresh';
import DownloadIcon from '@mui/icons-material/Download';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import SearchIcon from '@mui/icons-material/Search';
import type { TrainerAccount } from '@shared/types';
import { useQrSvg } from '../lib/qr';
import { genPw } from './util';
import { useEditor } from './store';
import { useAdminLog, useAdminTrainers, useCreateTrainer, useDeleteTrainer, useTrainerResetPassword, useUpdateTrainer } from '../lib/queries';

const fmtT = (t: string) => new Date(t).toLocaleString('hu-HU', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
const genAdornment = (onGen: () => void) => ({ input: { endAdornment: <InputAdornment position="end"><Tooltip title="Jelszó generálása"><IconButton size="small" onClick={onGen}><AutorenewIcon fontSize="small" /></IconButton></Tooltip></InputAdornment> } });

function Section({ title, action, children }: { title: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <Paper sx={{ p: 3 }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
        <Typography variant="h6">{title}</Typography>{action}
      </Stack>
      {children}
    </Paper>
  );
}

export default function Trainers() {
  const data = useAdminTrainers();
  const log = useAdminLog();
  const refresh = () => { data.refetch(); log.refetch(); };
  return (
    <Stack spacing={3}>
      <Alert severity="info">Minden kiképzőnek saját fiókja van, így a naplóból látszik, ki vont le alkalmat. A kiképzők csak szkennelni tudnak, a weboldalt nem szerkeszthetik. Ha valaki távozik, tiltsd le vagy töröld a fiókját: a telefonja azonnal kijelentkezik.</Alert>
      {data.isError && <Alert severity="error">{(data.error as Error).message}</Alert>}
      <Section title="Kiképzői fiókok">
        {data.data ? <Accounts trainers={data.data.trainers} /> : <Skeleton variant="rounded" height={80} />}
        <Divider sx={{ my: 3 }} />
        <NewTrainer />
      </Section>
      <ScannerLink />
      <Section title={`Ma levonva (${data.data?.today.length ?? 0})`} action={<Button size="small" startIcon={<RefreshIcon />} onClick={refresh}>Frissítés</Button>}>
        {data.data?.today.length ? (
          <Table size="small">
            <TableBody>
              {data.data.today.map((t, i) => (
                <TableRow key={i}>
                  <TableCell><b>{t.dog || '-'}</b> · {t.name}<Typography component="span" variant="body2" color="text.secondary"> · {t.type}</Typography></TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600, whiteSpace: 'nowrap' }}>{t.left === null ? 'korlátlan' : `${t.left} maradt`}{t.by ? ` · ${t.by}` : ''}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : <Typography variant="body2" color="text.secondary">Ma még nem volt levonás.</Typography>}
      </Section>
      <LogView />
      <Section title="Biztonsági mentés">
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>A szerver minden nap automatikusan ment (30 napig megőrzi), és minden módosítás előtt is készít másolatot. Ezen felül havonta töltsd le a teljes mentést, és tárold máshol is (pl. a saját gépeden vagy egy felhőtárhelyen).</Typography>
        <Button variant="outlined" startIcon={<DownloadIcon />} href="/api/admin/backup" download>Teljes mentés letöltése</Button>
      </Section>
    </Stack>
  );
}

function Accounts({ trainers }: { trainers: TrainerAccount[] }) {
  const toast = useEditor(s => s.showToast), askConfirm = useEditor(s => s.askConfirm);
  const update = useUpdateTrainer(), del = useDeleteTrainer(), resetPw = useTrainerResetPassword();
  const [pws, setPws] = useState<Record<string, string>>({});
  const onErr = { onError: (e: Error) => toast(e.message, true) };
  if (!trainers.length) return <Alert severity="warning">Még nincs kiképzői fiók. Hozd létre az elsőt lent.</Alert>;
  return (
    <List disablePadding>
      {trainers.map((t, i) => (
        <ListItem key={t.id} divider={i < trainers.length - 1} disableGutters sx={{ flexWrap: 'wrap', gap: 1.5, py: 1.5 }}>
          <Box sx={{ flex: 1, minWidth: 160 }}>
            <Stack direction="row" spacing={1} alignItems="center"><Typography fontWeight={600}>{t.name}</Typography>{!t.active && <Chip size="small" label="letiltva" />}</Stack>
            <Typography variant="body2" color="text.secondary">@{t.username}</Typography>
          </Box>
          <TextField placeholder="Új jelszó" value={pws[t.id] || ''} onChange={e => setPws(p => ({ ...p, [t.id]: e.target.value }))} sx={{ width: { xs: '100%', sm: 200 } }}
            slotProps={genAdornment(() => setPws(p => ({ ...p, [t.id]: genPw() })))} />
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            <Button size="small" variant="outlined" disabled={(pws[t.id] || '').length < 8} onClick={() => resetPw.mutate({ id: t.id, password: pws[t.id] }, { ...onErr, onSuccess: () => { toast(`${t.name} új jelszót kapott. Add át neki!`); setPws(p => ({ ...p, [t.id]: '' })); } })}>Jelszó beállítása</Button>
            <Button size="small" color="inherit" onClick={() => update.mutate({ id: t.id, name: t.name, active: !t.active }, { ...onErr, onSuccess: () => toast(t.active ? 'Letiltva' : 'Engedélyezve') })}>{t.active ? 'Letiltás' : 'Engedélyezés'}</Button>
            <Button size="small" color="error" onClick={async () => { if (await askConfirm(`Törlöd ${t.name} kiképzői fiókját? A napló bejegyzései megmaradnak.`, true)) del.mutate(t.id, { ...onErr, onSuccess: () => toast('Fiók törölve') }); }}>Törlés</Button>
          </Stack>
        </ListItem>
      ))}
    </List>
  );
}

function NewTrainer() {
  const toast = useEditor(s => s.showToast);
  const create = useCreateTrainer();
  const [nt, setNt] = useState({ name: '', username: '', password: genPw() });
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    create.mutate(nt, { onSuccess: () => { toast('Kiképzői fiók létrehozva. Add át a belépési adatokat!'); setNt({ name: '', username: '', password: genPw() }); } });
  };
  return (
    <Box component="form" onSubmit={submit}>
      <Typography variant="subtitle1" sx={{ mb: 2 }}>Új kiképző</Typography>
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 2, mb: 2 }}>
        <TextField label="Név" placeholder="pl. Zsóri Zsolt" required value={nt.name} onChange={e => setNt({ ...nt, name: e.target.value })} />
        <TextField label="Felhasználónév" placeholder="pl. zsolt" required value={nt.username} onChange={e => setNt({ ...nt, username: e.target.value })} />
        <TextField label="Kezdő jelszó" required value={nt.password} onChange={e => setNt({ ...nt, password: e.target.value })} slotProps={genAdornment(() => setNt(x => ({ ...x, password: genPw() })))} />
      </Box>
      {create.isError && <Alert severity="error" sx={{ mb: 2 }}>{(create.error as Error).message}</Alert>}
      <Button type="submit" variant="contained" disabled={create.isPending}>Fiók létrehozása</Button>
    </Box>
  );
}

function ScannerLink() {
  const url = `${location.origin}/kikepzo`;
  const qr = useQrSvg(url);
  return (
    <Section title="A szkenner megnyitása a kiképző telefonján">
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} alignItems={{ sm: 'center' }}>
        <Box sx={{ width: 150, flex: 'none', bgcolor: '#fff', border: 1, borderColor: 'divider', borderRadius: 3, p: 1, '& svg': { display: 'block', width: '100%', height: 'auto' } }} dangerouslySetInnerHTML={{ __html: qr }} />
        <Stack spacing={1.5} sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="body2">A kiképző olvassa be ezt a kódot a telefonja kamerájával (vagy nyissa meg a linket), lépjen be a saját fiókjával, és tegye ki a kezdőképernyőre.</Typography>
          <TextField value={url} slotProps={{ input: { readOnly: true } }} onFocus={e => e.target.select()} />
          <Box><Button variant="outlined" href="/kikepzo" target="_blank" rel="noopener" endIcon={<OpenInNewIcon fontSize="small" />}>Szkenner megnyitása</Button></Box>
        </Stack>
      </Stack>
    </Section>
  );
}

function LogView() {
  const log = useAdminLog();
  const [q, setQ] = useState('');
  const f = q.trim().toLowerCase();
  const rows = (log.data || []).filter(e => !f || JSON.stringify(e).toLowerCase().includes(f)).slice(0, 150);
  return (
    <Section title="Napló (ki, mikor, mit csinált)">
      <TextField placeholder="Szűrés (név, kutya, művelet)..." value={q} onChange={e => setQ(e.target.value)} sx={{ mb: 1.5 }}
        slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> } }} />
      {!log.data ? <Skeleton variant="rounded" height={120} /> : rows.length ? (
        <Box sx={{ maxHeight: 520, overflowY: 'auto' }}>
          <Table size="small">
            <TableBody>
              {rows.map((e, i) => (
                <TableRow key={i}>
                  <TableCell sx={{ color: 'text.secondary', whiteSpace: 'nowrap', width: 140, verticalAlign: 'top' }}>{fmtT(e.t)}</TableCell>
                  <TableCell>
                    <Typography component="span" variant="body2" fontWeight={700} color={/levonás|törl|visszavon/.test(e.action) ? 'primary' : 'inherit'}>{e.action}</Typography>
                    <Typography component="span" variant="body2"> · {e.by || '-'}{e.member && ` → ${e.member}${e.dog ? ` (${e.dog})` : ''}`}{e.trainer && ` → ${e.trainer}`}{e.section && ` → ${e.section}`}</Typography>
                    {e.reason && <Typography component="span" variant="body2" color="warning.dark"> · {e.reason}</Typography>}
                    {e.left != null && <Typography component="span" variant="body2" color="text.secondary"> · {e.left} maradt</Typography>}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Box>
      ) : <Typography variant="body2" color="text.secondary">Nincs bejegyzés.</Typography>}
    </Section>
  );
}
