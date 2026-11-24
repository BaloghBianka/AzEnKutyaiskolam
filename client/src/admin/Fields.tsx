import { useState } from 'react';
import Stack from '@mui/material/Stack';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import FormControlLabel from '@mui/material/FormControlLabel';
import Switch from '@mui/material/Switch';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import Avatar from '@mui/material/Avatar';
import LinearProgress from '@mui/material/LinearProgress';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import CloseIcon from '@mui/icons-material/Close';
import AddIcon from '@mui/icons-material/Add';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import ImageOutlinedIcon from '@mui/icons-material/ImageOutlined';
import type { FieldDef, Fields } from './schema';
import { useEditor, getIn, type Path } from './store';
import { pickFiles, upload } from './util';

const useValue = <T,>(path: Path) => useEditor(s => getIn(s.draft, path)) as T | undefined;

export function FieldList({ path, fields }: { path: Path; fields: Fields }) {
  return (
    <Stack spacing={2}>
      {Object.entries(fields).map(([k, d]) => (d.t === 'group' ? <Group key={k} path={path} def={d} /> : <Field key={k} path={[...path, k]} def={d} />))}
    </Stack>
  );
}

function Group({ path, def }: { path: Path; def: Extract<FieldDef, { t: 'group' }> }) {
  return (
    <Paper sx={{ p: 2.5 }}>
      <Typography variant="subtitle1" sx={{ mb: 2 }}>{def.label}</Typography>
      <FieldList path={path} fields={def.fields} />
    </Paper>
  );
}

export function Field({ path, def }: { path: Path; def: FieldDef }) {
  switch (def.t) {
    case 'text': case 'date': case 'textarea': case 'select': case 'check': return <Simple path={path} def={def} />;
    case 'image': return <ImageField path={path} def={def} />;
    case 'images': return <ImagesField path={path} def={def} />;
    case 'strings': return <StringsField path={path} def={def} />;
    case 'list': return <ListField path={path} def={def} />;
    case 'group': return null;
  }
}

function Simple({ path, def }: { path: Path; def: Extract<FieldDef, { t: 'text' | 'date' | 'textarea' | 'select' | 'check' }> }) {
  const value = useValue<string | boolean>(path);
  const setField = useEditor(s => s.setField);
  const set = (v: unknown) => setField(path, v);
  if (def.t === 'check') return <FormControlLabel control={<Switch checked={!!value} onChange={e => set(e.target.checked)} />} label={def.label} />;
  if (def.t === 'select') return <TextField select label={def.label} helperText={def.hint} value={String(value ?? '')} onChange={e => set(e.target.value)}>{def.options.map(([v, l]) => <MenuItem key={v} value={v}>{l}</MenuItem>)}</TextField>;
  if (def.t === 'textarea') {
    return (
      <TextField label={def.label} helperText={def.hint} multiline minRows={def.big ? 12 : 3} value={String(value ?? '')} onChange={e => set(e.target.value)}
        slotProps={def.big ? { input: { sx: { fontFamily: 'ui-monospace, Menlo, monospace', fontSize: '.85rem' } } } : undefined} />
    );
  }
  return <TextField type={def.t} label={def.label} helperText={def.hint} value={String(value ?? '')} onChange={e => set(e.target.value)} slotProps={def.t === 'date' ? { inputLabel: { shrink: true } } : undefined} />;
}

function ImageField({ path, def }: { path: Path; def: Extract<FieldDef, { t: 'image' }> }) {
  const v = String(useValue<string>(path) ?? '');
  const setField = useEditor(s => s.setField), toast = useEditor(s => s.showToast);
  const [busy, setBusy] = useState(false);
  const doUpload = async () => {
    const [f] = await pickFiles(false); if (!f) return;
    setBusy(true);
    try { setField(path, await upload(f)); toast('Kép feltöltve'); } catch (e) { toast((e as Error).message, true); }
    setBusy(false);
  };
  return (
    <Box>
      <Typography variant="body2" fontWeight={600} sx={{ mb: 1 }}>{def.label}</Typography>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ sm: 'flex-start' }}>
        <Box sx={{ width: 140, height: 96, flex: 'none', borderRadius: 2, overflow: 'hidden', bgcolor: 'action.hover', border: 1, borderColor: 'divider', display: 'grid', placeItems: 'center' }}>
          {v ? <Box component="img" src={v} alt="" sx={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <ImageOutlinedIcon color="disabled" />}
        </Box>
        <Stack spacing={1} sx={{ flex: 1, minWidth: 0 }}>
          <TextField label="Kép linkje" placeholder="Kép linkje vagy tölts fel újat" helperText={def.hint} value={v} onChange={e => setField(path, e.target.value)} />
          <Box><Button variant="outlined" startIcon={<CloudUploadIcon />} onClick={doUpload} disabled={busy}>{busy ? 'Feltöltés...' : 'Kép feltöltése'}</Button></Box>
          {busy && <LinearProgress />}
        </Stack>
      </Stack>
    </Box>
  );
}

function ImagesField({ path, def }: { path: Path; def: Extract<FieldDef, { t: 'images' }> }) {
  const arr = useValue<string[]>(path) ?? [];
  const updateList = useEditor(s => s.updateList), toast = useEditor(s => s.showToast);
  const [busy, setBusy] = useState(false);
  const add = async () => {
    const files = await pickFiles(true); if (!files.length) return;
    setBusy(true);
    for (const f of files) { try { const url = await upload(f); updateList(path, a => [...a, url]); } catch (e) { toast((e as Error).message, true); } }
    setBusy(false); toast('Képek feltöltve');
  };
  return (
    <Box>
      <Typography variant="body2" fontWeight={600} sx={{ mb: 1 }}>{def.label}</Typography>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
        {arr.map((u, i) => (
          <Box key={i} sx={{ position: 'relative', width: 120, height: 84 }}>
            <Box component="img" src={u} alt="" sx={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 2, border: 1, borderColor: 'divider' }} />
            <IconButton size="small" aria-label="Kép törlése" onClick={() => updateList(path, a => a.filter((_, j) => j !== i))}
              sx={{ position: 'absolute', top: -10, right: -10, bgcolor: 'primary.main', color: '#fff', width: 26, height: 26, '&:hover': { bgcolor: 'primary.dark' } }}><CloseIcon sx={{ fontSize: 16 }} /></IconButton>
          </Box>
        ))}
        <Button variant="outlined" onClick={add} disabled={busy} sx={{ width: 120, height: 84, borderStyle: 'dashed', flexDirection: 'column', gap: .5 }}>
          <AddIcon />{busy ? 'Feltöltés...' : 'Képek'}
        </Button>
      </Box>
      {def.hint && <Typography variant="caption" color="text.secondary">{def.hint}</Typography>}
    </Box>
  );
}

function StringsField({ path, def }: { path: Path; def: Extract<FieldDef, { t: 'strings' }> }) {
  const arr = useValue<string[]>(path) ?? [];
  const setField = useEditor(s => s.setField), updateList = useEditor(s => s.updateList);
  const swap = (a: unknown[], i: number, j: number) => { const b = [...a]; [b[i], b[j]] = [b[j], b[i]]; return b; };
  return (
    <Box>
      <Typography variant="body2" fontWeight={600} sx={{ mb: 1 }}>{def.label}</Typography>
      <Stack spacing={1}>
        {arr.map((s, i) => (
          <Stack key={i} direction="row" spacing={.5} alignItems="center">
            <TextField value={s} onChange={e => setField([...path, i], e.target.value)} inputProps={{ 'aria-label': `${def.label} ${i + 1}` }} />
            <Tooltip title="Feljebb"><span><IconButton size="small" disabled={!i} onClick={() => updateList(path, a => swap(a, i - 1, i))}><ArrowUpwardIcon fontSize="small" /></IconButton></span></Tooltip>
            <Tooltip title="Törlés"><IconButton size="small" onClick={() => updateList(path, a => a.filter((_, j) => j !== i))}><DeleteOutlineIcon fontSize="small" /></IconButton></Tooltip>
          </Stack>
        ))}
        <Box><Button size="small" startIcon={<AddIcon />} onClick={() => updateList(path, a => [...a, ''])}>Új sor</Button></Box>
      </Stack>
    </Box>
  );
}

function ListField({ path, def }: { path: Path; def: Extract<FieldDef, { t: 'list' }> }) {
  const len = useEditor(s => { const a = getIn(s.draft, path); return Array.isArray(a) ? a.length : 0; });
  const updateList = useEditor(s => s.updateList), toast = useEditor(s => s.showToast), askConfirm = useEditor(s => s.askConfirm);
  const [open, setOpen] = useState<Set<number>>(() => new Set());
  const shiftOpen = (fn: (i: number) => number | null) => setOpen(o => new Set([...o].map(fn).filter((x): x is number => x !== null)));

  const addItem = () => {
    const it = def.newItem();
    if (def.addTop) { updateList(path, a => [it, ...a]); shiftOpen(i => i + 1); setOpen(o => new Set(o).add(0)); }
    else { updateList(path, a => [...a, it]); setOpen(o => new Set(o).add(len)); }
  };
  const bulk = async () => {
    const files = await pickFiles(true); if (!files.length) return;
    toast('Feltöltés folyamatban...');
    for (const f of files) {
      try { const image = await upload(f); updateList(path, a => [{ ...def.newItem(), image, caption: '' }, ...a]); shiftOpen(i => i + 1); }
      catch (e) { toast((e as Error).message, true); }
    }
    toast('Képek feltöltve. Ne felejts el menteni!');
  };
  const move = (i: number, j: number) => {
    if (j < 0 || j >= len) return;
    updateList(path, a => { const b = [...a]; [b[i], b[j]] = [b[j], b[i]]; return b; });
    shiftOpen(x => (x === i ? j : x === j ? i : x));
  };
  const remove = async (i: number) => {
    if (!(await askConfirm('Biztosan törlöd ezt az elemet? Mentés után végleges.', true))) return;
    updateList(path, a => a.filter((_, j) => j !== i));
    shiftOpen(x => (x === i ? null : x > i ? x - 1 : x));
  };
  const toggle = (i: number) => setOpen(o => { const n = new Set(o); n.has(i) ? n.delete(i) : n.add(i); return n; });
  const addBtn = def.addLabel ? <Box><Button variant="contained" color="secondary" startIcon={<AddIcon />} onClick={addItem}>{def.addLabel}</Button></Box> : null;

  return (
    <Stack spacing={1.25}>
      <Typography variant="subtitle1">{def.label} <Typography component="span" color="text.secondary">({len})</Typography></Typography>
      {def.bulkImages && <Box><Button variant="contained" startIcon={<CloudUploadIcon />} onClick={bulk}>Képek feltöltése</Button></Box>}
      {def.addTop && addBtn}
      <Box>
        {Array.from({ length: len }, (_, i) => {
          const isOpen = !!def.open || open.has(i);
          return (
            <Accordion key={i} expanded={isOpen} onChange={() => !def.open && toggle(i)} slotProps={{ transition: { unmountOnExit: true } }} sx={{ mb: 1, borderRadius: 2, overflow: 'hidden' }}>
              <ItemHead path={[...path, i]} def={def} first={i === 0} last={i === len - 1} onUp={() => move(i, i - 1)} onDown={() => move(i, i + 1)} onDelete={() => remove(i)} />
              <AccordionDetails sx={{ borderTop: 1, borderColor: 'divider', pt: 2.5 }}><FieldList path={[...path, i]} fields={def.fields} /></AccordionDetails>
            </Accordion>
          );
        })}
      </Box>
      {!def.addTop && addBtn}
    </Stack>
  );
}

function ItemHead({ path, def, first, last, onUp, onDown, onDelete }: { path: Path; def: Extract<FieldDef, { t: 'list' }>; first: boolean; last: boolean; onUp: () => void; onDown: () => void; onDelete: () => void }) {
  const title = useValue<string>([...path, def.titleKey]);
  const thumb = useEditor(s => { if (!def.imgKey) return null; const v = getIn(s.draft, [...path, def.imgKey]); return (Array.isArray(v) ? v[0] : v) as string | null; });
  const stop = (fn: () => void) => (e: React.MouseEvent) => { e.stopPropagation(); fn(); };
  return (
    <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ '& .MuiAccordionSummary-content': { alignItems: 'center', gap: 1.5, minWidth: 0 } }}>
      {def.imgKey && <Avatar variant="rounded" src={thumb || undefined} sx={{ width: 44, height: 34 }}><ImageOutlinedIcon fontSize="small" /></Avatar>}
      <Typography fontWeight={600} noWrap sx={{ flex: 1, minWidth: 0 }}>{String(title || '(névtelen)')}</Typography>
      <Tooltip title="Feljebb"><span><IconButton size="small" disabled={first} onClick={stop(onUp)}><ArrowUpwardIcon fontSize="small" /></IconButton></span></Tooltip>
      <Tooltip title="Lejjebb"><span><IconButton size="small" disabled={last} onClick={stop(onDown)}><ArrowDownwardIcon fontSize="small" /></IconButton></span></Tooltip>
      <Tooltip title="Törlés"><IconButton size="small" color="error" onClick={stop(onDelete)}><DeleteOutlineIcon fontSize="small" /></IconButton></Tooltip>
    </AccordionSummary>
  );
}
