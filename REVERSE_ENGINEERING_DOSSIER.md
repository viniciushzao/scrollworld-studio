# 🏛️ Dossiê Completo de Engenharia Reversa: `/scroll-world`

Documento de referência técnica com todos os detalhes de física de frame-locking, engenharia de vídeo FFmpeg e algoritmos de reprodução do motor.

---

## 1. A Física do Frame-Locking
- **Modelos Condicionais de Imagem:** `seedance_2_0` e `kling3_0` aceitam `--start-image` e `--end-image`, forçando o estado latente nos limites $z(0)$ e $z(T)$.
- **Extração Real de Frames com FFmpeg:**
  - `ffmpeg -sseof -0.15 -i dive_i.mp4 -frames:v 1 -q:v 2 last_frame.png` (interior da cena $i$)
  - `ffmpeg -ss 0 -i dive_next.mp4 -frames:v 1 -q:v 2 first_frame.png` (abertura da cena $i+1$)
- **Motion Handoff Contract:** Cláusula contratual nos prompts que força a câmera a desacelerar no último segundo e retomar a velocidade na cena seguinte.

---

## 2. Engenharia de Vídeo & FFmpeg
- **Desktop (1080p):** `-g 8 -keyint_min 8 -sc_threshold 0 -movflags +faststart -crf 20 -vf "unsharp=5:5:0.8:5:5:0.0" -an`
- **Mobile Nativo (720p 9:16):** `-g 4 -keyint_min 4 -sc_threshold 0 -movflags +faststart -crf 23 -vf "scale=-2:720,unsharp=5:5:0.6:5:5:0.0" -an`
- **In-Memory Blob Seeking:** `fetch(url) -> blob -> URL.createObjectURL(blob)` garante 100% de seekabilidade mesmo sem HTTP 206 Byte-Range requests.

---

## 3. O Motor Vanilla JS (`scrub-engine.js`)
- **Seek Coalescing:** `if (video.seeking) continue;` no loop `requestAnimationFrame` impede travamento do decodificador de vídeo no touch.
- **Curva de Dwell Cúbica (`lingerEase`):** Desacelera a câmera no meio da cena ($x=0.5$) onde o texto atinge opacidade máxima.
- **iOS Safari Priming:** Executa `v.play().then(pause)` no primeiro toque do usuário para desbloquear a GPU.
- **Knockout BFS em Python (`knockout.py`):** Algoritmo de flood-fill a partir das 4 bordas para isolar a ilha 3D em fundo transparente.
