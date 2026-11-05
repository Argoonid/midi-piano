import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'node:fs';
import path from 'node:path';

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'track-auto-saver',
      configureServer(server) {
        server.middlewares.use('/api/save-track', (req, res) => {
          if (req.method !== 'POST') return res.end();

          const chunks: Buffer[] = [];
          req.on('data', (chunk) => chunks.push(chunk));
          req.on('end', () => {
            try {
              const body = Buffer.concat(chunks).toString('utf-8');
              const data = JSON.parse(body);

              // 1. Создаем папку трека в public/tracks/<slug>
              const slug = data.title.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
              const targetDir = path.resolve(process.cwd(), 'public', 'tracks', slug);
              
              if (!fs.existsSync(targetDir)) {
                fs.mkdirSync(targetDir, { recursive: true });
              }

              // 2. Раскодируем base64 и записываем физические файлы на диск
              const audioBuffer = Buffer.from(data.audioBase64.split(',')[1], 'base64');
              const midiBuffer = Buffer.from(data.midiBase64.split(',')[1], 'base64');

              fs.writeFileSync(path.join(targetDir, 'audio.mp3'), audioBuffer);
              fs.writeFileSync(path.join(targetDir, 'notes.mid'), midiBuffer);

              // 3. Формируем метаданные трека
              const newBeatmap = {
                id: slug,
                title: data.title,
                artist: data.artist,
                audioSrc: `/tracks/${slug}/audio.mp3`,
                midiSrc: `/tracks/${slug}/notes.mid`,
                bgSrc: data.bgSrc,
                difficulty: data.difficulty,
                bpm: data.bpm || 120,
                defaultOffsetMs: 0,
              };

              // 4. Дописываем трек в локальный реестр manifest.json
              const manifestPath = path.resolve(process.cwd(), 'public', 'tracks', 'manifest.json');
              let manifest = [];
              if (fs.existsSync(manifestPath)) {
                manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
              }
              manifest.unshift(newBeatmap);
              fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));

              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: true, beatmap: newBeatmap }));
            } catch (err: any) {
              res.statusCode = 500;
              res.end(JSON.stringify({ error: err.message }));
            }
          });
        });
      },
    },
  ],
});