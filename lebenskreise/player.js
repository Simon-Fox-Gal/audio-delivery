'use strict';
(async () => {
  const audio = document.querySelector('#audio');
  const status = document.querySelector('#status');
  const toggle = document.querySelector('#toggle');
  const timeline = document.querySelector('#timeline');
  const data = await fetch('recording.json').then(r => { if (!r.ok) throw new Error('Aufnahmedaten'); return r.json(); });
  const movements = data.movements;
  const chapters = [...document.querySelectorAll('.chapter')];
  let ready = false, queued = null, selected = 0, hls, context, analysers;
  const peaks = [{value: 0, until: 0}, {value: 0, until: 0}];
  const format = t => `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, '0')}`;
  const indexAt = t => Math.max(0, movements.findLastIndex(m => t + 0.05 >= m.start));
  function update() {
    const i = indexAt(audio.currentTime);
    selected = i;
    chapters.forEach((b, n) => b.setAttribute('aria-current', String(n === i)));
    document.querySelector('#now-title').textContent = movements[i].title;
    document.querySelector('#now-sub').textContent = `${i + 1} / 6 · ${format(Math.round(movements[i].duration))} · Hamburg 2009`;
    timeline.value = audio.currentTime;
    document.querySelector('#elapsed').textContent = format(audio.currentTime);
    toggle.textContent = audio.paused ? '▶' : 'Ⅱ';
    toggle.setAttribute('aria-label', audio.paused ? 'Wiedergabe starten' : 'Wiedergabe pausieren');
    document.querySelector('#previous').disabled = i === 0;
    document.querySelector('#next').disabled = i === movements.length - 1;
  }
  function showError() {
    status.textContent = 'Der Hörstream konnte nicht geladen werden. Die sechs Sätze lassen sich unter „Audio & E-Book“ als MP3 herunterladen.';
    status.classList.add('warn');
  }
  function initialise() {
    if (ready) return;
    ready = true;
    const url = 'audio/complete/index.m3u8';
    if (audio.canPlayType('application/vnd.apple.mpegurl')) audio.src = url;
    else if (window.Hls && Hls.isSupported()) {
      hls = new Hls({maxBufferLength: 40, maxMaxBufferLength: 90});
      hls.loadSource(url); hls.attachMedia(audio);
      hls.on(Hls.Events.ERROR, (_event, d) => { if (d.fatal) showError(); });
    } else {
      showError(); return;
    }
    status.textContent = 'Aufnahme wird geladen …';
  }
  function meterSetup() {
    if (context) { context.resume().catch(() => {}); return; }
    try {
      context = new (window.AudioContext || window.webkitAudioContext)();
      const source = context.createMediaElementSource(audio);
      const splitter = context.createChannelSplitter(2);
      source.connect(context.destination); source.connect(splitter);
      analysers = [0, 1].map(i => { const a = context.createAnalyser(); a.fftSize = 2048; splitter.connect(a, i); return a; });
      context.resume().catch(() => {});
      requestAnimationFrame(meterFrame);
    } catch (_) { document.querySelector('.meters').hidden = true; }
  }
  function meterFrame(now) {
    analysers.forEach((a, i) => {
      const samples = new Float32Array(a.fftSize); a.getFloatTimeDomainData(samples);
      let value = 0; for (const n of samples) value = Math.max(value, Math.abs(n));
      const db = value > 0 ? 20 * Math.log10(value) : -60;
      if (value >= peaks[i].value || now > peaks[i].until) peaks[i] = {value, until: now + 5000};
      const peak = peaks[i].value > 0 ? 20 * Math.log10(peaks[i].value) : -Infinity;
      const name = i ? 'right' : 'left';
      document.querySelector(`#${name}`).value = db;
      document.querySelector(`#${name}-db`).textContent = Number.isFinite(peak) ? `${peak.toFixed(1)} dBFS` : '−∞ dBFS';
    });
    requestAnimationFrame(meterFrame);
  }
  async function playAt(time) {
    initialise(); meterSetup();
    queued = time;
    if (audio.readyState >= 1) { audio.currentTime = time; queued = null; }
    try { await audio.play(); } catch (e) { if (e.name !== 'AbortError') showError(); }
  }
  audio.addEventListener('loadedmetadata', () => { if (queued !== null) { audio.currentTime = queued; queued = null; } update(); });
  audio.addEventListener('timeupdate', update);
  audio.addEventListener('seeked', update);
  audio.addEventListener('play', () => { meterSetup(); status.textContent = 'Wiedergabe · AAC-Hörkopie · sechs Sätze in Originalreihenfolge'; status.classList.remove('warn'); update(); });
  audio.addEventListener('pause', update);
  audio.addEventListener('error', showError);
  audio.addEventListener('ended', () => { status.textContent = 'Ende der Aufnahme.'; update(); });
  toggle.addEventListener('click', () => audio.paused ? playAt(audio.currentTime) : audio.pause());
  document.querySelector('#previous').addEventListener('click', () => playAt(movements[Math.max(0, selected - 1)].start));
  document.querySelector('#next').addEventListener('click', () => playAt(movements[Math.min(movements.length - 1, selected + 1)].start));
  timeline.addEventListener('change', () => { initialise(); queued = Number(timeline.value); if (audio.readyState >= 1) { audio.currentTime = queued; queued = null; } });
  document.querySelectorAll('[data-movement]').forEach(b => b.addEventListener('click', () => { playAt(movements[Number(b.dataset.movement)].start); if (b.classList.contains('inline-play')) document.querySelector('#hoeren').scrollIntoView({behavior: 'smooth'}); }));
  document.querySelectorAll('.preview-row details').forEach(d => d.addEventListener('toggle', () => {
    if (d.open) { audio.pause(); const frame = d.querySelector('iframe'); if (!frame.src) frame.src = frame.dataset.src; }
    else { const frame = d.querySelector('iframe'); frame.removeAttribute('src'); }
  }));
  update();
})().catch(() => { document.querySelector('#status').textContent = 'Die sechs MP3-Hörkopien sind in der Dateiliste erreichbar.'; });
