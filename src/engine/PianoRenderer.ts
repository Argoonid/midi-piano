import type { NoteEvent, KeyGeometry, CountdownState } from '../types/game';
import { NOTE_NAMES, THEME } from '../constants/piano';

interface Spark {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  life: number;
}

interface HitRipple {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  color: string;
  alpha: number;
}

interface AmbientMote {
  x: number;
  y: number;
  baseX: number;
  speedY: number;
  phase: number;
  size: number;
  alpha: number;
}

export class PianoRenderer {
  private ctx: CanvasRenderingContext2D;
  private canvas: HTMLCanvasElement;
  private bgImage: HTMLImageElement | null = null;
  private sparks: Spark[] = [];
  private ripples: HitRipple[] = [];
  private motes: AmbientMote[] = [];
  private keysMap = new Map<number, KeyGeometry>();
  private activeRange = { startMidi: 21, endMidi: 108 };

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const context = canvas.getContext('2d', { alpha: false });
    if (!context) throw new Error('Не удалось получить 2D контекст');
    this.ctx = context;

    for (let i = 0; i < 35; i++) {
      const rx = Math.random() * window.innerWidth;
      this.motes.push({
        x: rx,
        baseX: rx,
        y: Math.random() * window.innerHeight,
        speedY: Math.random() * 0.4 + 0.2,
        phase: Math.random() * Math.PI * 2,
        size: Math.random() * 2 + 1,
        alpha: Math.random() * 0.4 + 0.1,
      });
    }
  }

  public setBackground(url: string) {
    const img = new Image();
    img.src = url;
    img.onload = () => {
      this.bgImage = img;
    };
  }

  public resize(width: number, height: number) {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.canvas.width = width * dpr;
    this.canvas.height = height * dpr;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  public updateActiveRange(notes: NoteEvent[]) {
    if (notes.length === 0) {
      this.activeRange = { startMidi: 21, endMidi: 108 };
      return;
    }

    let min = 127;
    let max = 0;
    notes.forEach((n) => {
      if (n.midiKey < min) min = n.midiKey;
      if (n.midiKey > max) max = n.midiKey;
    });

    let start = Math.max(21, min - 2);
    while ([1, 3, 6, 8, 10].includes(start % 12) && start > 21) start--;

    let end = Math.min(108, max + 2);
    while ([1, 3, 6, 8, 10].includes(end % 12) && end < 108) end++;

    this.activeRange = { startMidi: start, endMidi: end };
  }

  private recalculateKeys(W: number, H: number): number {
    const KEYBOARD_HEIGHT = Math.max(90, H * 0.20);
    const HIT_LINE_Y = H - KEYBOARD_HEIGHT;

    let whiteKeysCount = 0;
    for (let m = this.activeRange.startMidi; m <= this.activeRange.endMidi; m++) {
      if (![1, 3, 6, 8, 10].includes(m % 12)) whiteKeysCount++;
    }
    whiteKeysCount = Math.max(whiteKeysCount, 14);

    const WHITE_KEY_WIDTH = W / whiteKeysCount;
    const BLACK_KEY_WIDTH = WHITE_KEY_WIDTH * 0.58;
    const BLACK_KEY_HEIGHT = KEYBOARD_HEIGHT * 0.62;

    this.keysMap.clear();
    let whiteIndex = 0;

    for (let midi = this.activeRange.startMidi; midi <= this.activeRange.endMidi; midi++) {
      const noteClass = midi % 12;
      const isBlack = [1, 3, 6, 8, 10].includes(noteClass);
      const label = NOTE_NAMES[noteClass];

      if (!isBlack) {
        this.keysMap.set(midi, {
          type: 'white',
          x: whiteIndex * WHITE_KEY_WIDTH,
          w: WHITE_KEY_WIDTH,
          h: KEYBOARD_HEIGHT,
          label,
        });
        whiteIndex++;
      }
    }

    for (let midi = this.activeRange.startMidi; midi <= this.activeRange.endMidi; midi++) {
      const noteClass = midi % 12;
      const isBlack = [1, 3, 6, 8, 10].includes(noteClass);
      const label = NOTE_NAMES[noteClass];

      if (isBlack) {
        const prev = this.keysMap.get(midi - 1);
        if (prev) {
          this.keysMap.set(midi, {
            type: 'black',
            x: prev.x + prev.w - BLACK_KEY_WIDTH / 2,
            w: BLACK_KEY_WIDTH,
            h: BLACK_KEY_HEIGHT,
            label,
          });
        }
      }
    }

    return HIT_LINE_Y;
  }

  public render(
    notes: NoteEvent[],
    currentTime: number,
    W: number,
    H: number,
    countdown: CountdownState,
    isPaused: boolean,
    speedMultiplier: number = 1.0
  ) {
    const ctx = this.ctx;
    const HIT_LINE_Y = this.recalculateKeys(W, H);
    const pixelsPerSecond = H * 0.45 * speedMultiplier;

    // 1. Фон сцены
    ctx.fillStyle = THEME.bg;
    ctx.fillRect(0, 0, W, H);

    if (this.bgImage && this.bgImage.complete) {
      ctx.globalAlpha = 0.16;
      const scale = Math.max(W / this.bgImage.width, H / this.bgImage.height);
      const imgW = this.bgImage.width * scale;
      const imgH = this.bgImage.height * scale;
      ctx.drawImage(this.bgImage, (W - imgW) / 2, (H - imgH) / 2, imgW, imgH);
      ctx.globalAlpha = 1.0;
    }

    // 2. Атмосферная световая пыль
    ctx.fillStyle = '#60a5fa';
    this.motes.forEach((m) => {
      if (!isPaused) {
        m.y -= m.speedY;
        m.phase += 0.02;
        m.x = m.baseX + Math.sin(m.phase) * 15;
        if (m.y < 0) {
          m.y = H - 100;
          m.baseX = Math.random() * W;
        }
      }
      ctx.globalAlpha = m.alpha;
      ctx.beginPath();
      ctx.arc(m.x, m.y, m.size, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1.0;

    // 3. Аддитивные колонны света от нажатых клавиш
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    notes.forEach((e) => {
      if (currentTime >= e.time && currentTime <= e.time + e.duration) {
        const key = this.keysMap.get(e.midiKey);
        if (key) {
          const isLeft = e.hand === 'left';
          const grad = ctx.createLinearGradient(0, HIT_LINE_Y, 0, HIT_LINE_Y - 260);
          grad.addColorStop(0, isLeft ? 'rgba(59, 130, 246, 0.4)' : 'rgba(168, 85, 247, 0.4)');
          grad.addColorStop(0.5, isLeft ? 'rgba(59, 130, 246, 0.12)' : 'rgba(168, 85, 247, 0.12)');
          grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
          ctx.fillStyle = grad;
          ctx.fillRect(key.x - 2, HIT_LINE_Y - 260, key.w + 4, 260);
        }
      }
    });
    ctx.restore();

    // 4. Падающие ноты (Гладкие неоновые капсулы)
    notes.forEach((e) => {
      if (currentTime > e.time + e.duration + 1.0 || currentTime < e.time - 6.0) return;

      const dist = (e.time - currentTime) * pixelsPerSecond;
      const currentY = HIT_LINE_Y - dist;
      const blockHeight = Math.max(22, e.duration * pixelsPerSecond);
      const blockY = currentY - blockHeight;

      const key = this.keysMap.get(e.midiKey);
      if (!key) return;

      const isHitting = currentTime >= e.time - 0.02 && currentTime <= e.time + e.duration + 0.05;
      if (isHitting && !isPaused && Math.random() < 0.4) {
        this.sparks.push({
          x: key.x + key.w / 2,
          y: HIT_LINE_Y,
          vx: (Math.random() - 0.5) * 70,
          vy: -(Math.random() * 55 + 20),
          color: e.hand === 'left' ? '#93c5fd' : '#fef08a',
          size: Math.random() * 2.5 + 1.2,
          life: 1.0,
        });

        if (Math.random() < 0.25) {
          this.ripples.push({
            x: key.x + key.w / 2,
            y: HIT_LINE_Y,
            radius: 4,
            maxRadius: key.w * 1.8,
            color: e.hand === 'left' ? '59, 130, 246' : '245, 158, 11',
            alpha: 0.8,
          });
        }
      }

      if (blockY < HIT_LINE_Y && currentY > -60) {
        const isLeft = e.hand === 'left';
        const bW = key.type === 'black' ? key.w * 0.86 : key.w * 0.92;
        const bX = key.x + (key.w - bW) / 2;
        const cornerRadius = Math.min(10, bW / 2);

        // Внешнее рассеянное свечение капсулы
        ctx.fillStyle = isLeft ? 'rgba(59, 130, 246, 0.16)' : 'rgba(168, 85, 247, 0.16)';
        ctx.beginPath();
        ctx.roundRect(bX - 4, blockY - 3, bW + 8, blockHeight + 6, cornerRadius + 2);
        ctx.fill();

        // Основное тело капсулы: глубокий неоновый вертикальный градиент
        const bodyGrad = ctx.createLinearGradient(0, blockY, 0, blockY + blockHeight);
        if (isLeft) {
          bodyGrad.addColorStop(0, '#1d4ed8');   // Глубокий синий в хвосте
          bodyGrad.addColorStop(0.7, '#2563eb');
          bodyGrad.addColorStop(1, '#60a5fa');   // Яркий голубой на переднем фронте
        } else {
          bodyGrad.addColorStop(0, '#6b21a8');   // Глубокий фиолетовый
          bodyGrad.addColorStop(0.7, '#9333ea');
          bodyGrad.addColorStop(1, '#c084fc');   // Яркий сиреневый
        }

        ctx.fillStyle = bodyGrad;
        ctx.beginPath();
        ctx.roundRect(bX, blockY, bW, blockHeight, cornerRadius);
        ctx.fill();

        // Световая тонкая окантовка плитки
        ctx.strokeStyle = isLeft ? 'rgba(147, 197, 253, 0.5)' : 'rgba(233, 213, 255, 0.5)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.roundRect(bX, blockY, bW, blockHeight, cornerRadius);
        ctx.stroke();

        // Глянцевая шапка на нижнем краю (момент контакта со струной)
        const capHeight = Math.min(8, blockHeight * 0.35);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.beginPath();
        ctx.roundRect(bX + 2, blockY + blockHeight - capHeight - 1, bW - 4, capHeight, [0, 0, cornerRadius, cornerRadius]);
        ctx.fill();

        // БОЛЬШАЯ БУКВА НОТЫ ВНУТРИ ПЛИТКИ
        if (bW > 14 && blockHeight > 18) {
          ctx.save();
          // Увеличенный размер шрифта, масштабируемый под ширину клавиши
          const fontSize = Math.min(24, Math.max(14, Math.floor(bW * 0.72)));
          ctx.font = `900 ${fontSize}px system-ui, -apple-system, sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';

          // Располагаем букву в нижней трети ноты ближе к ударному краю
          const textY = Math.min(
            blockY + blockHeight - fontSize * 0.85,
            HIT_LINE_Y - fontSize * 0.85
          );

          if (textY > blockY + fontSize * 0.4) {
            // Четкая контрастная тень под буквой
            ctx.shadowColor = 'rgba(0, 0, 0, 0.85)';
            ctx.shadowBlur = 8;
            ctx.shadowOffsetY = 2;
            ctx.fillStyle = '#ffffff';
            ctx.fillText(key.label, key.x + key.w / 2, textY);
          }
          ctx.restore();
        }
      }
    });

    // 5. Ударные волны
    ctx.save();
    this.ripples = this.ripples.filter((r) => r.alpha > 0.05);
    this.ripples.forEach((r) => {
      if (!isPaused) {
        r.radius += 1.2;
        r.alpha -= 0.035;
      }
      ctx.strokeStyle = `rgba(${r.color}, ${r.alpha})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(r.x, r.y, r.radius, r.radius * 0.4, 0, 0, Math.PI * 2);
      ctx.stroke();
    });
    ctx.restore();

    // 6. Искры
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    this.sparks = this.sparks.filter((p) => p.life > 0);
    this.sparks.forEach((p) => {
      if (!isPaused) {
        p.x += p.vx * 0.016;
        p.y += p.vy * 0.016;
        p.life -= 0.035;
      }
      ctx.fillStyle = p.color;
      ctx.globalAlpha = Math.max(0, p.life);
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.restore();

    // 7. Белые клавиши + четкая крупная буква
    this.keysMap.forEach((key, midi) => {
      if (key.type !== 'white') return;
      const isPressed = notes.some(
        (e) => e.midiKey === midi && currentTime >= e.time - 0.02 && currentTime <= e.time + e.duration + 0.05
      );
      ctx.fillStyle = isPressed ? THEME.whiteKeyPressed : THEME.whiteKey;
      ctx.fillRect(key.x, HIT_LINE_Y, key.w, key.h);
      ctx.strokeStyle = THEME.whiteKeyBorder;
      ctx.lineWidth = 1;
      ctx.strokeRect(key.x, HIT_LINE_Y, key.w, key.h);

      ctx.save();
      const keyFontSize = Math.min(16, Math.max(11, Math.floor(key.w * 0.46)));
      ctx.font = `800 ${keyFontSize}px system-ui, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.fillStyle = isPressed ? '#000000' : '#71717a';
      ctx.fillText(key.label, key.x + key.w / 2, HIT_LINE_Y + key.h - 8);
      ctx.restore();
    });

    // 8. Черные клавиши + буква
    this.keysMap.forEach((key, midi) => {
      if (key.type !== 'black') return;
      const isPressed = notes.some(
        (e) => e.midiKey === midi && currentTime >= e.time - 0.02 && currentTime <= e.time + e.duration + 0.05
      );

      const grad = ctx.createLinearGradient(key.x, 0, key.x + key.w, 0);
      if (isPressed) {
        grad.addColorStop(0, '#facc15');
        grad.addColorStop(0.5, '#fef08a');
        grad.addColorStop(1, '#eab308');
      } else {
        grad.addColorStop(0, '#18181b');
        grad.addColorStop(0.3, '#27272a');
        grad.addColorStop(0.8, '#18181b');
        grad.addColorStop(1, '#09090b');
      }

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.roundRect(key.x, HIT_LINE_Y, key.w, key.h, [0, 0, 4, 4]);
      ctx.fill();

      ctx.fillStyle = isPressed ? '#ca8a04' : '#3f3f46';
      ctx.fillRect(key.x + 1, HIT_LINE_Y + key.h - 5, key.w - 2, 4);

      ctx.save();
      const blackFontSize = Math.min(11, Math.max(8, Math.floor(key.w * 0.42)));
      ctx.font = `800 ${blackFontSize}px system-ui, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.fillStyle = isPressed ? '#000000' : '#a1a1aa';
      ctx.fillText(key.label, key.x + key.w / 2, HIT_LINE_Y + key.h - 7);
      ctx.restore();
    });

    // 9. Золотая струна контакта
    ctx.fillStyle = THEME.hitLine;
    ctx.fillRect(0, HIT_LINE_Y - 1.5, W, 3);

    // 10. Обратный отсчет
    if (countdown.active && countdown.timeLeft > 0) {
      this.renderCountdown(W, H, countdown);
    }
  }

  private renderCountdown(W: number, H: number, countdown: CountdownState) {
    const ctx = this.ctx;
    const progress = countdown.timeLeft % 1.0;
    const currentNum = Math.ceil(countdown.timeLeft);
    const displayText = currentNum > 0 ? currentNum.toString() : 'START';

    ctx.save();
    if (countdown.style === 'CYBER_SCAN') {
      const cy = H * 0.42;
      const radius = 60 + (1 - progress) * 80;

      ctx.strokeStyle = `rgba(56, 189, 248, ${progress})`;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(W / 2, cy, radius, 0, Math.PI * 2);
      ctx.stroke();

      ctx.font = `900 ${80 + Math.floor(progress * 25)}px monospace`;
      ctx.fillStyle = '#38bdf8';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.shadowColor = '#0284c7';
      ctx.shadowBlur = 25;
      ctx.fillText(displayText, W / 2, cy);
    } else if (countdown.style === 'COSMIC_WARP') {
      const cx = W / 2;
      const cy = H * 0.42;
      ctx.font = `italic 900 ${90 + Math.floor(progress * 30)}px sans-serif`;
      ctx.fillStyle = '#f43f5e';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.shadowColor = '#fb7185';
      ctx.shadowBlur = 30;
      ctx.fillText(displayText, cx, cy);
    } else {
      const cx = W / 2;
      const cy = H * 0.42;
      const fontSize = 100 + Math.floor(progress * 35);
      ctx.font = `900 ${fontSize}px system-ui, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#ffffff';
      ctx.fillText(displayText, cx, cy);
    }
    ctx.restore();
  }

  public destroy() {}
}