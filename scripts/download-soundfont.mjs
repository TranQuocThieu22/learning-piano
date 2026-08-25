/**
 * Tải bộ mẫu âm MusyngKite về `public/soundfonts/` để app tự phục vụ,
 * không phụ thuộc CDN paulrosen.github.io lúc người học bấm phát nhạc.
 *
 * Chạy lại khi cần thêm nhạc cụ: `node scripts/download-soundfont.mjs`
 * Script bỏ qua file đã có nên chạy lại nhiều lần không tốn băng thông.
 *
 * Cấu trúc thư mục phải khớp đúng thứ abcjs ghép trong `getNote`:
 *   {soundFontUrl}/{tên nhạc cụ}-mp3/{tên nốt}.mp3
 */
import { mkdir, writeFile, access } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT_DIR = join(ROOT, 'public', 'soundfonts');
const BASE_URL = 'https://paulrosen.github.io/midi-js-soundfonts/MusyngKite';

/** Giữ danh sách này khớp với INSTRUMENTS trong src/lib/soundfont.ts. */
const INSTRUMENTS = [
  'acoustic_grand_piano',
  'bright_acoustic_piano',
  'honkytonk_piano',
  'electric_grand_piano',
  'electric_piano_1',
  'electric_piano_2',
  'clavinet',
  'harpsichord',
];

/**
 * A0 tới C8 — đúng 88 phím của đàn piano thật. MusyngKite không có mẫu âm
 * cao hơn C8, dù abcjs về lý thuyết ánh xạ tới Db9.
 */
const NOTE_NAMES = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];
const FIRST_MIDI = 21; // A0
const LAST_MIDI = 108; // C8

function midiToNoteName(midi) {
  return `${NOTE_NAMES[midi % 12]}${Math.floor(midi / 12) - 1}`;
}

async function exists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

async function downloadNote(instrument, note) {
  const target = join(OUT_DIR, `${instrument}-mp3`, `${note}.mp3`);
  if (await exists(target)) return 'skipped';

  const res = await fetch(`${BASE_URL}/${instrument}-mp3/${note}.mp3`);
  if (!res.ok) throw new Error(`${instrument}/${note}: HTTP ${res.status}`);
  await writeFile(target, Buffer.from(await res.arrayBuffer()));
  return 'downloaded';
}

for (const instrument of INSTRUMENTS) {
  await mkdir(join(OUT_DIR, `${instrument}-mp3`), { recursive: true });

  let downloaded = 0;
  let skipped = 0;
  for (let midi = FIRST_MIDI; midi <= LAST_MIDI; midi++) {
    const result = await downloadNote(instrument, midiToNoteName(midi));
    if (result === 'downloaded') downloaded++;
    else skipped++;
  }
  console.log(`${instrument}: tải mới ${downloaded}, đã có sẵn ${skipped}`);
}

console.log(`\nXong. Mẫu âm nằm ở public/soundfonts/`);
