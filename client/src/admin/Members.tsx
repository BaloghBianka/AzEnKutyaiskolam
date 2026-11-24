import { useEffect, useState } from 'react';
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
import Switch from '@mui/material/Switch';
import FormControlLabel from '@mui/material/FormControlLabel';
import Autocomplete from '@mui/material/Autocomplete';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import Table from '@mui/material/Table';
import TableHead from '@mui/material/TableHead';
import TableBody from '@mui/material/TableBody';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import InputAdornment from '@mui/material/InputAdornment';
import Skeleton from '@mui/material/Skeleton';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import QrCode2Icon from '@mui/icons-material/QrCode2';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import AutorenewIcon from '@mui/icons-material/Autorenew';
import type { AdminMember, Pass } from '@shared/types';
import { clone, genPw, todayStr, printPassCard } from './util';
import { useEditor } from './store';
import { useAdminMembers, useCreateMember, useDeleteMember, useMemberResetPassword, useUpdateMember } from '../lib/queries';

interface Props { logo: string }

const passLeft = (p: Pass) => (p.total ? p.total - (p.used || []).length : null);
const passActive = (p: Pass) => (!p.end || p.end >= todayStr()) && (passLeft(p) === null || passLeft(p)! > 0);
const PASS_TYPES = ['10 alkalmas bérlet', '5 alkalmas bérlet', 'Engedelmes E tanfolyam (3 hónap)', 'Kutyaovi bérlet', 'Agility bérlet', 'Ölebtréning bérlet', 'BH felkészítő', 'Havi bérlet'];
const grid = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 2 };

export default function Members(props: Props) {
  const members = useAdminMembers();
  const [sel, setSel] = useState<string | 'new' | null>(null);
  const [q, setQ] = useState('');
  const registerSave = useEditor(s => s.registerSave), setDirty = useEditor(s => s.setDirty), askConfirm = useEditor(s => s.askConfirm);
  useEffect(() => { if (sel === null) { registerSave(null); setDirty(false); } }, [sel, registerSave, setDirty]);

  const help = <Alert severity="info" sx={{ mb: 2 }}>Itt veheted fel a tagokat és a bérleteiket. A tag a „Már tag vagyok” oldalon az e-mail címével és a jelszavával lép be, és csak a saját bérleteit látja. Minden bérletnek saját QR-kódja van, ezt olvassa le a kiképző.</Alert>;
  if (members.isError) return <>{help}<Alert severity="error">{(members.error as Error).message}</Alert></>;
  if (!members.data) return <>{help}<Stack spacing={1}>{[0, 1, 2].map(i => <Skeleton key={i} variant="rounded" height={52} />)}</Stack></>;
  const list = members.data;

  const back = async () => {
    if (useEditor.getState().dirty && !(await askConfirm('Van nem mentett változás. Eldobod?'))) return;
    setSel(null);
  };
  if (sel === 'new') return <NewMember onBack={back} onCreated={id => setSel(id)} />;
  const cur = list.find(m => m.id === sel);
  if (cur) return <MemberEditor key={cur.id} {...props} m={cur} onBack={back} onDeleted={() => setSel(null)} />;

  const t = q.trim().toLowerCase();
  const rows = list.filter(m => !t || [m.name, m.email, m.dogs, m.phone].join(' ').toLowerCase().includes(t)).sort((a, b) => a.name.localeCompare(b.name, 'hu'));
  return (
    <>
      {help}
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mb: 2 }}>
        <TextField placeholder="Keresés névre, e-mailre, kutyára..." value={q} onChange={e => setQ(e.target.value)}
          slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> } }} />
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setSel('new')} sx={{ flex: 'none' }}>Új tag</Button>
      </Stack>
      <Paper>
        <TableContainer>
          <Table size="small">
            <TableHead><TableRow><TableCell>Név</TableCell><TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>Kutya</TableCell><TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>E-mail</TableCell><TableCell align="right">Aktív bérlet</TableCell></TableRow></TableHead>
            <TableBody>
              {rows.map(m => {
                const act = m.passes.filter(passActive);
                const sum = act.length ? act.map(p => (passLeft(p) === null ? 'korlátlan' : `${passLeft(p)} alk.`)).join(', ') : 'nincs';
                return (
                  <TableRow key={m.id} hover onClick={() => setSel(m.id)} sx={{ cursor: 'pointer' }}>
                    <TableCell><Typography fontWeight={600} variant="body2">{m.name}</Typography><Typography variant="caption" color="text.secondary" sx={{ display: { sm: 'none' } }}>{m.dogs}</Typography></TableCell>
                    <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>{m.dogs}</TableCell>
                    <TableCell sx={{ display: { xs: 'none', md: 'table-cell' }, color: 'text.secondary' }}>{m.email}</TableCell>
                    <TableCell align="right"><Chip size="small" label={sum} color={act.length ? 'success' : 'default'} variant={act.length ? 'filled' : 'outlined'} /></TableCell>
                  </TableRow>
                );
              })}
              {!rows.length && <TableRow><TableCell colSpan={4} sx={{ color: 'text.secondary', py: 3, textAlign: 'center' }}>{list.length ? 'Nincs találat.' : 'Még nincs tag. Vedd fel az elsőt az „Új tag” gombbal.'}</TableCell></TableRow>}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>{rows.length} tag</Typography>
    </>
  );
}

function BackBtn({ onClick }: { onClick: () => void }) {
  return <Button startIcon={<ArrowBackIcon />} color="inherit" onClick={onClick} sx={{ mb: 2 }}>Vissza a tagokhoz</Button>;
}

function PwField({ value, onChange, label }: { value: string; onChange: (v: string) => void; label: string }) {
  return (
    <TextField label={label} value={value} onChange={e => onChange(e.target.value)}
      slotProps={{ input: { endAdornment: <InputAdornment position="end"><Tooltip title="Jelszó generálása"><IconButton size="small" onClick={() => onChange(genPw())}><AutorenewIcon fontSize="small" /></IconButton></Tooltip></InputAdornment> } }} />
  );
}

function NewMember({ onBack, onCreated }: { onBack: () => void; onCreated: (id: string) => void }) {
  const toast = useEditor(s => s.showToast);
  const create = useCreateMember();
  const [m, setM] = useState({ name: '', email: '', phone: '', dogs: '', note: '', password: genPw() });
  const set = (k: keyof typeof m) => (v: string) => setM(x => ({ ...x, [k]: v }));
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    create.mutate(m, { onSuccess: nm => { toast('Tag létrehozva'); onCreated(nm.id); } });
  };
  return (
    <>
      <BackBtn onClick={onBack} />
      <Paper component="form" onSubmit={submit} sx={{ p: 3 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>Új tag</Typography>
        <Stack spacing={2}>
          <Box sx={grid}>
            <TextField label="Név" required value={m.name} onChange={e => set('name')(e.target.value)} />
            <TextField label="E-mail cím (ezzel lép be)" type="email" required value={m.email} onChange={e => set('email')(e.target.value)} />
            <TextField label="Telefon" value={m.phone} onChange={e => set('phone')(e.target.value)} />
            <TextField label="Kutya neve(i)" value={m.dogs} onChange={e => set('dogs')(e.target.value)} />
          </Box>
          <TextField label="Megjegyzés (csak az admin látja)" multiline minRows={2} value={m.note} onChange={e => set('note')(e.target.value)} />
          <PwField label="Kezdő jelszó" value={m.password} onChange={set('password')} />
          <Alert severity="info" variant="outlined">A kezdő jelszót add át a tagnak (pl. személyesen). Belépés után a tag meg tudja változtatni.</Alert>
          {create.isError && <Alert severity="error">{(create.error as Error).message}</Alert>}
          <Box><Button type="submit" variant="contained" disabled={create.isPending}>Tag létrehozása</Button></Box>
        </Stack>
      </Paper>
    </>
  );
}

function MemberEditor({ m: orig, onBack, onDeleted, logo }: Props & { m: AdminMember; onBack: () => void; onDeleted: () => void }) {
  const toast = useEditor(s => s.showToast), setDirty = useEditor(s => s.setDirty), registerSave = useEditor(s => s.registerSave), askConfirm = useEditor(s => s.askConfirm);
  const update = useUpdateMember(), del = useDeleteMember(), resetPw = useMemberResetPassword();
  const [m, setM] = useState<AdminMember>(() => clone(orig));
  const [pw, setPw] = useState('');
  const [dates, setDates] = useState<Record<string, string>>({});
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const upd = (fn: (x: AdminMember) => void) => { setM(x => { const y = clone(x); fn(y); return y; }); setDirty(true); };

  useEffect(() => {
    registerSave(async () => {
      try { const r = await update.mutateAsync(m); setM(clone(r)); setDirty(false); toast('Tag elmentve'); }
      catch (e) { toast((e as Error).message, true); }
    });
  }, [m, registerSave, setDirty, toast, update.mutateAsync]);
  useEffect(() => () => registerSave(null), [registerSave]);

  const addUse = async (i: number, d: string) => {
    const p = m.passes[i]; if (!d) return;
    if (p.used.includes(d) && !(await askConfirm('Erre a napra már van rögzített alkalom. Még egyet hozzáadsz?'))) return;
    const left = passLeft(p);
    if (left !== null && left <= 0 && !(await askConfirm('A bérlet elfogyott. Mégis rögzíted?'))) return;
    upd(x => { x.passes[i].used.push(d); });
  };
  const newPass = () => {
    const e = new Date(); e.setMonth(e.getMonth() + 3);
    upd(x => { x.passes.unshift({ id: '', token: '', type: '10 alkalmas bérlet', dog: (x.dogs || '').split(',')[0].trim(), start: todayStr(), end: e.toISOString().slice(0, 10), total: 10, used: [], paid: false, note: '' }); });
    setOpen(o => ({ ...o, new0: true }));
  };
  const removePass = async (i: number) => { if (await askConfirm('Biztosan törlöd ezt a bérletet? Mentés után végleges.', true)) upd(x => { x.passes.splice(i, 1); }); };
  const print = (p: Pass) => { try { printPassCard(m, p, logo); } catch (e) { toast((e as Error).message, true); } };
  const removeMember = async () => {
    if (!(await askConfirm(`Biztosan törlöd ${m.name} tagot az összes bérletével együtt? Ez nem vonható vissza.`, true))) return;
    del.mutate(m.id, { onSuccess: () => { toast('Tag törölve'); setDirty(false); onDeleted(); }, onError: e => toast(e.message, true) });
  };
  const setPassword = () => resetPw.mutate({ id: m.id, password: pw }, { onSuccess: () => { toast('Új jelszó beállítva. Add át a tagnak!'); setPw(''); }, onError: e => toast(e.message, true) });

  return (
    <>
      <BackBtn onClick={onBack} />
      <Stack spacing={3}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>Adatok</Typography>
          <Stack spacing={2}>
            <Box sx={grid}>
              <TextField label="Név" value={m.name} onChange={e => upd(x => { x.name = e.target.value; })} />
              <TextField label="E-mail (belépéshez)" type="email" value={m.email} onChange={e => upd(x => { x.email = e.target.value; })} />
              <TextField label="Telefon" value={m.phone} onChange={e => upd(x => { x.phone = e.target.value; })} />
              <TextField label="Kutya neve(i)" value={m.dogs} onChange={e => upd(x => { x.dogs = e.target.value; })} />
            </Box>
            <TextField label="Megjegyzés (csak az admin látja)" multiline minRows={2} value={m.note} onChange={e => upd(x => { x.note = e.target.value; })} />
          </Stack>
        </Paper>

        <Box>
          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1.5 }}>
            <Typography variant="h6">Bérletek <Typography component="span" color="text.secondary">({m.passes.length})</Typography></Typography>
            <Button variant="contained" color="secondary" startIcon={<AddIcon />} onClick={newPass}>Új bérlet</Button>
          </Stack>
          {!m.passes.length && <Typography color="text.secondary" variant="body2">Még nincs bérlete.</Typography>}
          {m.passes.map((p, i) => {
            const left = passLeft(p), key = p.id || `new${i}`, isOpen = open[key] ?? true, active = passActive(p);
            const chips = [...p.used].map((d, j) => ({ d, j })).sort((a, b) => b.d.localeCompare(a.d));
            const stop = (fn: () => void) => (e: React.MouseEvent) => { e.stopPropagation(); fn(); };
            return (
              <Accordion key={key} expanded={isOpen} onChange={() => setOpen(o => ({ ...o, [key]: !isOpen }))} sx={{ mb: 1, borderRadius: 2, overflow: 'hidden' }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ '& .MuiAccordionSummary-content': { alignItems: 'center', gap: 1, flexWrap: 'wrap', minWidth: 0 } }}>
                  <Typography fontWeight={600} sx={{ flex: 1, minWidth: 140 }}>{p.type || 'Bérlet'}{p.dog ? ` · ${p.dog}` : ''}</Typography>
                  <Chip size="small" color={active ? 'success' : 'default'} label={left === null ? `${p.used.length} alkalom` : `${left} / ${p.total} maradt`} />
                  {!p.paid && <Chip size="small" color="warning" variant="outlined" label="nincs fizetve" />}
                  <Tooltip title="QR-kártya nyomtatása (telefon nélküli tagoknak)"><IconButton size="small" onClick={stop(() => print(p))}><QrCode2Icon fontSize="small" /></IconButton></Tooltip>
                  <Tooltip title="Bérlet törlése"><IconButton size="small" color="error" onClick={stop(() => removePass(i))}><DeleteOutlineIcon fontSize="small" /></IconButton></Tooltip>
                </AccordionSummary>
                <AccordionDetails sx={{ borderTop: 1, borderColor: 'divider', pt: 2.5 }}>
                  <Stack spacing={2.5}>
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems={{ sm: 'center' }} sx={{ p: 1.5, bgcolor: 'rgba(215,25,31,.06)', borderRadius: 2 }}>
                      <Button variant="contained" startIcon={<AddIcon />} onClick={() => addUse(i, todayStr())}>1 alkalom ma</Button>
                      <Typography variant="body2" color="text.secondary">vagy dátum:</Typography>
                      <TextField type="date" value={dates[key] || todayStr()} onChange={e => setDates(d => ({ ...d, [key]: e.target.value }))} sx={{ maxWidth: { sm: 180 } }} />
                      <Button variant="outlined" onClick={() => addUse(i, dates[key] || todayStr())}>Hozzáad</Button>
                    </Stack>
                    <Box sx={{ ...grid, gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))' }}>
                      <Autocomplete freeSolo options={PASS_TYPES} value={p.type} onInputChange={(_, v) => { if (v !== p.type) upd(x => { x.passes[i].type = v; }); }} renderInput={params => <TextField {...params} label="Bérlet típusa" />} />
                      <TextField label="Kutya" value={p.dog} onChange={e => upd(x => { x.passes[i].dog = e.target.value; })} />
                      <TextField label="Érvényes ettől" type="date" value={p.start} onChange={e => upd(x => { x.passes[i].start = e.target.value; })} slotProps={{ inputLabel: { shrink: true } }} />
                      <TextField label="Érvényes eddig" type="date" value={p.end} onChange={e => upd(x => { x.passes[i].end = e.target.value; })} slotProps={{ inputLabel: { shrink: true } }} />
                      <TextField label="Alkalmak száma" helperText="0 = korlátlan" type="number" value={p.total} onChange={e => upd(x => { x.passes[i].total = Number(e.target.value) || 0; })} slotProps={{ htmlInput: { min: 0 } }} />
                      <FormControlLabel control={<Switch checked={p.paid} onChange={e => upd(x => { x.passes[i].paid = e.target.checked; })} />} label="Kifizetve" />
                    </Box>
                    <Box>
                      <Typography variant="body2" fontWeight={600} sx={{ mb: 1 }}>Részvételek ({p.used.length})</Typography>
                      <Stack direction="row" flexWrap="wrap" gap={.75}>
                        {chips.map(({ d, j }) => <Chip key={j} label={d} size="small" onDelete={() => upd(x => { x.passes[i].used.splice(j, 1); })} />)}
                        {!chips.length && <Typography variant="body2" color="text.secondary">Még nincs rögzített alkalom.</Typography>}
                      </Stack>
                    </Box>
                    <TextField label="Belső megjegyzés (a tag nem látja, a kiképző igen)" value={p.note} onChange={e => upd(x => { x.passes[i].note = e.target.value; })} />
                  </Stack>
                </AccordionDetails>
              </Accordion>
            );
          })}
        </Box>

        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ mb: 1 }}>Belépés</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>{m.hasPassword ? 'A tagnak van jelszava. Ha elfelejtette, itt adhatsz neki újat.' : 'A tagnak még nincs jelszava.'}</Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
            <PwField label="Új jelszó (min. 8 karakter)" value={pw} onChange={setPw} />
            <Button variant="outlined" onClick={setPassword} disabled={resetPw.isPending || pw.length < 8} sx={{ flex: 'none' }}>Jelszó beállítása</Button>
          </Stack>
        </Paper>

        <Box><Button color="error" startIcon={<DeleteOutlineIcon />} onClick={removeMember} disabled={del.isPending}>Tag törlése</Button></Box>
      </Stack>
    </>
  );
}
