
document.querySelectorAll('.faq-q').forEach(btn=>btn.addEventListener('click',()=>btn.closest('.faq-item').classList.toggle('open')));
const mobileMenu = document.querySelector('[data-menu]');
if(mobileMenu){mobileMenu.addEventListener('click',()=>{const nav=document.querySelector('.desktop-nav');if(!nav)return;nav.style.display=nav.style.display==='block'?'none':'block';nav.style.position='absolute';nav.style.top='66px';nav.style.left='0';nav.style.right='0';nav.style.zIndex='70';nav.querySelector('.container').style.flexDirection='column';nav.querySelector('.container').style.alignItems='stretch';nav.querySelector('.container').style.padding='18px 20px';});}


// Dab Habitz 192-frame autoplay sequence.
(() => {
  const canvas = document.getElementById('frameCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d', { alpha: false });
  const FRAME_COUNT = 192;
  const PLAY_MS = 8000;
  const images = new Array(FRAME_COUNT);
  let current = 0;
  let playing = false;
  let playedOnce = false;
  let startedAt = 0;
  let raf = 0;
  const progress = document.querySelector('[data-frame-progress]');
  const replay = document.querySelector('[data-frame-replay]');

  function srcFor(i){ return `./assets/frames/frame_${String(i + 1).padStart(4,'0')}.jpg`; }
  function loadFrame(i){
    if (images[i]) return images[i];
    const img = new Image();
    img.decoding = 'async';
    img.src = srcFor(i);
    img.onload = () => { if (i === current) draw(i); };
    images[i] = img;
    return img;
  }
  function preloadAll(){
    let i = 0;
    const pump = () => {
      for(let n=0;n<10 && i<FRAME_COUNT;n++,i++) loadFrame(i);
      if(i<FRAME_COUNT) setTimeout(pump, 24);
    };
    pump();
  }
  function sizeCanvas(){
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = canvas.getBoundingClientRect();
    const w = Math.max(1, Math.round(rect.width * dpr));
    const h = Math.max(1, Math.round(rect.height * dpr));
    if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
    draw(current);
  }
  function draw(i){
    const img = images[i] || loadFrame(i);
    if (!img || !img.complete || !img.naturalWidth) return;
    const cw = canvas.width, ch = canvas.height;
    const scale = Math.max(cw / img.naturalWidth, ch / img.naturalHeight);
    const dw = img.naturalWidth * scale, dh = img.naturalHeight * scale;
    const dx = (cw - dw) / 2, dy = (ch - dh) / 2;
    ctx.fillStyle = '#070403'; ctx.fillRect(0,0,cw,ch);
    ctx.drawImage(img, dx, dy, dw, dh);
  }
  function tick(t){
    if (!playing) return;
    if (!startedAt) startedAt = t;
    const p = Math.min(1, (t - startedAt) / PLAY_MS);
    current = Math.min(FRAME_COUNT - 1, Math.floor(p * (FRAME_COUNT - 1)));
    loadFrame(current); draw(current);
    if (progress) progress.style.width = `${p * 100}%`;
    if (p < 1) raf = requestAnimationFrame(tick);
    else { playing = false; playedOnce = true; }
  }
  function play(reset=true){
    cancelAnimationFrame(raf);
    if(reset){ current = 0; startedAt = 0; if(progress) progress.style.width='0%'; }
    playing = true;
    raf = requestAnimationFrame(tick);
  }
  loadFrame(0);
  preloadAll();
  sizeCanvas();
  addEventListener('resize', sizeCanvas, { passive:true });
  if(replay) replay.addEventListener('click', () => play(true));

  const section = document.getElementById('frame-sequence');
  const io = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (entry.isIntersecting && entry.intersectionRatio >= .32 && !playedOnce && !playing) play(true);
    }
  }, { threshold:[.15,.32,.5] });
  io.observe(section);
})();
