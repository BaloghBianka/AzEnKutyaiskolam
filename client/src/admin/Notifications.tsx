import { useState } from 'react';
import Stack from '@mui/material/Stack';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import ListSubheader from '@mui/material/ListSubheader';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Alert from '@mui/material/Alert';
import Avatar from '@mui/material/Avatar';
import Skeleton from '@mui/material/Skeleton';
import SendIcon from '@mui/icons-material/Send';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import { useEditor } from './store';
import { useAdminPush, useSendPush } from '../lib/queries';

const PRESETS: { label: string; title: string; body: string }[] = [
  { label: 'Eső miatt elmarad', title: 'Ma elmarad az óra', body: 'Az eső miatt ma minden óra elmarad. A bérletedről nem vonunk le alkalmat. Jövő héten várunk!' },
  { label: 'Hőség miatt elmarad', title: 'Ma elmarad az óra', body: 'A nagy hőség miatt a kutyák védelmében ma minden óra elmarad. A bérletedről nem vonunk le alkalmat.' },
  { label: 'Rövidebb óra', title: 'Ma rövidebb óra lesz', body: 'Az időjárás miatt ma rövidített órát tartunk. Gyere a szokott időben!' },
  { label: 'Pótlás', title: 'Pótló óra', body: 'Az elmaradt órát pótoljuk: jövő szombaton a szokott időben várunk.' }
];
const LINKS: [string, string][] = [['/tagoknak', 'Profilom (bérlet)'], ['/kepzesek', 'Képzések és órarend'], ['/hirek', 'Hírek'], ['/', 'Főoldal']];

export default function Notifications() {
  const info = useAdminPush();
  const send = useSendPush();
  const toast = useEditor(s => s.showToast), askConfirm = useEditor(s => s.askConfirm);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [target, setTarget] = useState('all');
  const [url, setUrl] = useState('/tagoknak');

  const stats = info.data?.stats;
  const targetLabel = target === 'all' ? 'mindenkinek' : target === 'tag' ? 'a tagoknak' : target === 'kiképző' ? 'a kiképzőknek' : `a(z) „${target.slice(6)}” bérletes tagoknak`;
  const submit = async () => {
    if (!title.trim() || !body.trim()) { toast('Add meg a címet és az üzenetet.', true); return; }
    if (!(await askConfirm(`Elküldöd az értesítést ${targetLabel}? Azonnal megjelenik a telefonjukon.`))) return;
    send.mutate({ title: title.trim(), body: body.trim(), target, url }, {
      onSuccess: r => toast(r.sent ? `Elküldve ${r.sent} eszközre.${r.failed ? ` ${r.failed} eszközre nem sikerült.` : ''}` : 'Nincs olyan feliratkozott eszköz, akinek ezt el lehetne küldeni.', !r.sent),
      onError: e => toast(e.message, true)
    });
  };

  return (
    <Stack spacing={3}>
      <Alert severity="info">Itt küldhetsz azonnali értesítést a telefonokra, például ha rossz idő miatt elmarad az óra. Azok kapják meg, akik az appban bekapcsolták az értesítéseket (a Profilom vagy a Szkenner oldalon). iPhone-on ehhez az appot a kezdőképernyőre kell tenni.</Alert>

      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" sx={{ mb: 1.5 }}>Feliratkozott eszközök</Typography>
        {!stats ? <Skeleton variant="rounded" height={32} width={320} /> : (
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            <Chip color="primary" label={`Összesen: ${stats.összes}`} />
            <Chip variant="outlined" label={`Tag: ${stats.tag}`} />
            <Chip variant="outlined" label={`Kiképző: ${stats.kiképző}`} />
            <Chip variant="outlined" label={`Belépés nélkül: ${stats.vendég}`} />
          </Stack>
        )}
        {stats && stats.összes === 0 && <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5 }}>Még senki nem kapcsolta be. Szólj a tagoknak, hogy a Profilom oldalon nyomják meg az „Értesítések bekapcsolása” gombot.</Typography>}
      </Paper>

      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>Új értesítés</Typography>
        <Stack spacing={2.5}>
          <Box>
            <Typography variant="body2" fontWeight={600} sx={{ mb: 1 }}>Gyors szövegek</Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              {PRESETS.map(p => <Chip key={p.label} label={p.label} onClick={() => { setTitle(p.title); setBody(p.body); }} clickable />)}
            </Stack>
          </Box>
          <TextField label="Cím" value={title} onChange={e => setTitle(e.target.value.slice(0, 80))} helperText={`${title.length} / 80`} />
          <TextField label="Üzenet" multiline minRows={3} value={body} onChange={e => setBody(e.target.value.slice(0, 300))} helperText={`${body.length} / 300`} />
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 2 }}>
            <TextField select label="Kinek?" value={target} onChange={e => setTarget(e.target.value)}>
              <MenuItem value="all">Mindenkinek{stats ? ` (${stats.összes})` : ''}</MenuItem>
              <MenuItem value="tag">Csak a tagoknak{stats ? ` (${stats.tag})` : ''}</MenuItem>
              <MenuItem value="kiképző">Csak a kiképzőknek{stats ? ` (${stats.kiképző})` : ''}</MenuItem>
              {!!info.data?.types.length && <ListSubheader>Bérlettípus szerint</ListSubheader>}
              {info.data?.types.map(t => <MenuItem key={t} value={'tipus:' + t}>{t}</MenuItem>)}
            </TextField>
            <TextField select label="Koppintásra megnyílik" value={url} onChange={e => setUrl(e.target.value)}>
              {LINKS.map(([v, l]) => <MenuItem key={v} value={v}>{l}</MenuItem>)}
            </TextField>
          </Box>

          <Box>
            <Typography variant="body2" fontWeight={600} sx={{ mb: 1 }}>Így fog kinézni</Typography>
            <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start', p: 1.5, borderRadius: 4, bgcolor: 'rgba(245,245,247,.95)', border: 1, borderColor: 'divider', maxWidth: 420 }}>
              <Avatar variant="rounded" src="/icons/icon-192.png" sx={{ width: 38, height: 38 }} />
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="body2" fontWeight={700}>{title || 'Cím'}</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{body || 'Az üzenet szövege'}</Typography>
              </Box>
            </Box>
          </Box>

          <Box>
            <Button variant="contained" size="large" startIcon={send.isPending ? <NotificationsActiveIcon /> : <SendIcon />} onClick={submit} disabled={send.isPending}>
              {send.isPending ? 'Küldés...' : 'Értesítés küldése'}
            </Button>
          </Box>
        </Stack>
      </Paper>
    </Stack>
  );
}
