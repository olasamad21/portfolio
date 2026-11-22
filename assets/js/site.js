/* Abdulsamad Ajayi — portfolio motion + interactions */
(function () {
  'use strict';
  var doc = document, root = doc.documentElement, body = doc.body;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var $ = function (s, c) { return (c || doc).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || doc).querySelectorAll(s)); };

  /* ---------- split text into animated words ---------- */
  function splitWords(el) {
    var i = 0;
    (function walk(node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (n) {
        if (n.nodeType === 3) {
          var parts = n.textContent.split(/(\s+)/);
          var frag = doc.createDocumentFragment();
          parts.forEach(function (p) {
            if (!p) return;
            if (/^\s+$/.test(p)) { frag.appendChild(doc.createTextNode(' ')); return; }
            var w = doc.createElement('span'); w.className = 'w';
            var inner = doc.createElement('span'); inner.textContent = p;
            inner.style.setProperty('--i', i++);
            w.appendChild(inner); frag.appendChild(w);
          });
          n.parentNode.replaceChild(frag, n);
        } else if (n.nodeType === 1 && !n.classList.contains('rotator') && n.tagName !== 'BR') {
          walk(n);
        } else if (n.nodeType === 1 && n.classList.contains('rotator')) {
          var w2 = doc.createElement('span'); w2.className = 'w';
          var in2 = doc.createElement('span'); in2.style.setProperty('--i', i++);
          n.parentNode.insertBefore(w2, n); in2.appendChild(n); w2.appendChild(in2);
        }
      });
    })(el);
    el.classList.add('split');
  }
  $$('[data-split]').forEach(splitWords);

  /* ---------- reveal on scroll ---------- */
  var revealTargets = $$('[data-reveal],[data-split],.fin');
  if ('IntersectionObserver' in window && !reduce) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    revealTargets.forEach(function (el) { io.observe(el); });
  } else {
    revealTargets.forEach(function (el) { el.classList.add('in'); });
  }

  /* ---------- role rotator ---------- */
  $$('.rotator').forEach(function (r) {
    var items = $$('span', r); if (items.length < 2) return;
    var idx = 0; items[0].classList.add('on');
    if (reduce) return;
    setInterval(function () {
      var cur = items[idx]; idx = (idx + 1) % items.length; var nxt = items[idx];
      cur.classList.remove('on'); cur.classList.add('off');
      nxt.classList.remove('off'); nxt.classList.add('on');
      setTimeout(function () { cur.classList.remove('off'); }, 900);
    }, 2600);
  });

  /* ---------- scroll: progress, nav hide, parallax, word light-up ---------- */
  var bar = $('.progress'), nav = $('.nav'), lastY = window.scrollY, ticking = false;
  var parallax = reduce ? [] : $$('[data-speed]');
  var lights = $$('[data-light]').map(function (el) {
    var words = [];
    // wrap plain text words
    (function walk(node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (n) {
        if (n.nodeType === 3) {
          var frag = doc.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach(function (p) {
            if (!p) return;
            if (/^\s+$/.test(p)) { frag.appendChild(doc.createTextNode(p)); return; }
            var s = doc.createElement('span'); s.className = 'dim'; s.textContent = p; words.push(s); frag.appendChild(s);
          });
          n.parentNode.replaceChild(frag, n);
        } else if (n.nodeType === 1) walk(n);
      });
    })(el);
    return { el: el, words: words };
  });

  function onScroll() {
    var y = window.scrollY, h = root.scrollHeight - window.innerHeight, vh = window.innerHeight;
    if (bar) bar.style.transform = 'scaleX(' + (h > 0 ? y / h : 0) + ')';
    if (nav && !(body.classList.contains('menu-open'))) {
      if (y > lastY && y > 160) nav.classList.add('hide'); else nav.classList.remove('hide');
    }
    lastY = y;
    parallax.forEach(function (el) {
      var r = el.getBoundingClientRect();
      var c = r.top + r.height / 2 - vh / 2;
      el.style.transform = 'translate3d(0,' + (c * parseFloat(el.dataset.speed)).toFixed(1) + 'px,0)';
    });
    lights.forEach(function (l) {
      var r = l.el.getBoundingClientRect();
      var p = (vh * 0.85 - r.top) / (r.height + vh * 0.35);
      p = Math.max(0, Math.min(1, p));
      var n = Math.round(p * l.words.length);
      l.words.forEach(function (w, i) { w.style.color = i < n ? 'var(--ink)' : ''; });
    });
    ticking = false;
  }
  window.addEventListener('scroll', function () { if (!ticking) { requestAnimationFrame(onScroll); ticking = true; } }, { passive: true });
  window.addEventListener('resize', onScroll);
  onScroll();

  /* ---------- mobile menu ---------- */
  var burger = $('.burger'), menu = $('.menu');
  if (burger && menu) {
    var setMenu = function (open) {
      menu.classList.toggle('open', open);
      burger.setAttribute('aria-expanded', open);
      body.classList.toggle('menu-open', open);
      body.style.overflow = open ? 'hidden' : '';
    };
    burger.addEventListener('click', function () { setMenu(!menu.classList.contains('open')); });
    $$('a', menu).forEach(function (a) { a.addEventListener('click', function () { setMenu(false); }); });
    doc.addEventListener('keydown', function (e) { if (e.key === 'Escape') setMenu(false); });
  }

  /* ---------- counters ---------- */
  var counters = $$('[data-count]');
  if (counters.length) {
    var runCount = function (el) {
      var end = parseFloat(el.dataset.count), dur = 1600, t0 = null, suf = el.dataset.suffix || '';
      if (reduce) { el.textContent = end + suf; return; }
      (function step(t) {
        if (!t0) t0 = t;
        var p = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - p, 4);
        el.textContent = Math.round(end * e) + suf;
        if (p < 1) requestAnimationFrame(step);
      })(performance.now());
    };
    var cio = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { runCount(e.target); cio.unobserve(e.target); } });
    }, { threshold: 0.6 });
    counters.forEach(function (c) { cio.observe(c); });
  }

  /* ---------- copy email ---------- */
  $$('[data-copy]').forEach(function (btn) {
    btn.addEventListener('click', function (e) {
      var text = btn.dataset.copy;
      if (navigator.clipboard) {
        e.preventDefault();
        navigator.clipboard.writeText(text).then(function () {
          btn.classList.add('copied');
          setTimeout(function () { btn.classList.remove('copied'); }, 2000);
        }, function () { window.location.href = 'mailto:' + text; });
      }
    });
  });

  /* ---------- custom cursor, magnetic, tilt (desktop only) ---------- */
  var refreshCursor = function () {};
  if (fine && !reduce) {
    body.classList.add('has-cursor');
    var cur = doc.createElement('div'); cur.className = 'cursor'; cur.innerHTML = '<span class="lbl"></span>';
    var dot = doc.createElement('div'); dot.className = 'cursor-dot';
    body.appendChild(cur); body.appendChild(dot);
    var lbl = $('.lbl', cur), mx = -100, my = -100, cx = -100, cy = -100;
    doc.addEventListener('mousemove', function (e) {
      mx = e.clientX; my = e.clientY;
      dot.style.transform = 'translate(' + mx + 'px,' + my + 'px)';
    });
    doc.addEventListener('mouseleave', function () { cur.classList.add('is-hidden'); dot.classList.add('is-hidden'); });
    doc.addEventListener('mouseenter', function () { cur.classList.remove('is-hidden'); dot.classList.remove('is-hidden'); });
    (function loop() {
      cx += (mx - cx) * 0.18; cy += (my - cy) * 0.18;
      cur.style.transform = 'translate(' + cx.toFixed(1) + 'px,' + cy.toFixed(1) + 'px)';
      requestAnimationFrame(loop);
    })();
    var overEl = null;
    function paintCursor() {
      var t = overEl; if (!t || !t.closest) return;
      var ctrl = t.closest('.reel-ctrl');
      var v = !ctrl && t.closest('[data-cursor]');
      var b = !v && (ctrl ? t.closest('button,.rc-track') : t.closest('.btn,.burger,.lb-btn,.play-btn'));
      var l = !v && !b && t.closest('a,button,[role="button"]');
      cur.classList.toggle('is-view', !!v);
      cur.classList.toggle('is-btn', !!b);
      cur.classList.toggle('is-link', !!l);
      lbl.textContent = v ? v.dataset.cursor : '';
      dot.style.opacity = (v || b) ? 0 : 1;
    }
    refreshCursor = paintCursor;
    doc.addEventListener('mouseover', function (e) { overEl = e.target; paintCursor(); });

    /* buttons magnify and get a lens highlight that follows the pointer */
    $$('.btn').forEach(function (el) {
      el.addEventListener('mousemove', function (e) {
        var r = el.getBoundingClientRect();
        el.style.setProperty('--mx', (e.clientX - r.left) + 'px');
        el.style.setProperty('--my', (e.clientY - r.top) + 'px');
      });
    });

    $$('[data-magnetic]').forEach(function (el) {
      var s = parseFloat(el.dataset.magnetic) || 0.3;
      el.addEventListener('mousemove', function (e) {
        var r = el.getBoundingClientRect();
        var x = e.clientX - (r.left + r.width / 2), y = e.clientY - (r.top + r.height / 2);
        el.style.transform = 'translate(' + (x * s).toFixed(1) + 'px,' + (y * s).toFixed(1) + 'px) scale(1.06)';
      });
      el.addEventListener('mouseleave', function () { el.style.transform = ''; });
    });

    $$('[data-tilt]').forEach(function (el) {
      el.style.transition = 'transform .8s cubic-bezier(.16,1,.3,1)';
      el.addEventListener('mousemove', function (e) {
        var r = el.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width - 0.5, py = (e.clientY - r.top) / r.height - 0.5;
        el.style.transform = 'perspective(1200px) rotateX(' + (-py * 4).toFixed(2) + 'deg) rotateY(' + (px * 5).toFixed(2) + 'deg)';
      });
      el.addEventListener('mouseleave', function () { el.style.transform = ''; });
    });
  }

  /* ---------- lecturer / student toggle ---------- */
  $$('.toggle').forEach(function (t) {
    var btns = $$('button', t), pill = $('.pill', t);
    function place(b) { pill.style.width = b.offsetWidth + 'px'; pill.style.transform = 'translateX(' + (b.offsetLeft - 4) + 'px)'; }
    btns.forEach(function (b) {
      b.addEventListener('click', function () {
        btns.forEach(function (x) { x.classList.toggle('on', x === b); x.setAttribute('aria-pressed', x === b); });
        place(b);
        $$(t.dataset.views + ' .view').forEach(function (v) { v.hidden = v.dataset.view !== b.dataset.view; });
      });
    });
    var on = $('button.on', t) || btns[0];
    requestAnimationFrame(function () { place(on); });
    window.addEventListener('resize', function () { place($('button.on', t)); });
    if (doc.fonts) doc.fonts.ready.then(function () { place($('button.on', t)); });
  });

  /* ---------- lightbox ---------- */
  var lb = $('.lightbox');
  if (lb) {
    var img = $('img', lb), count = $('.lb-count', lb), list = [], idx = 0, lastFocus = null;
    function show(i) {
      idx = (i + list.length) % list.length;
      img.classList.remove('ready');
      var src = list[idx];
      var pre = new Image();
      pre.onload = function () { img.src = src; requestAnimationFrame(function () { img.classList.add('ready'); }); };
      pre.src = src;
      count.textContent = String(idx + 1).padStart(2, '0') + ' / ' + String(list.length).padStart(2, '0');
    }
    function open(arr, alt) {
      list = arr; lastFocus = doc.activeElement; img.alt = alt || '';
      lb.classList.add('open'); body.style.overflow = 'hidden'; show(0);
      $('.lb-close', lb).focus();
    }
    function close() { lb.classList.remove('open'); body.style.overflow = ''; if (lastFocus) lastFocus.focus(); }
    $$('[data-gallery]').forEach(function (el) {
      var go = function () { open(el.dataset.gallery.split(','), el.dataset.alt); };
      el.addEventListener('click', go);
      el.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); } });
    });
    $('.lb-close', lb).addEventListener('click', close);
    $('.lb-next', lb).addEventListener('click', function () { show(idx + 1); });
    $('.lb-prev', lb).addEventListener('click', function () { show(idx - 1); });
    lb.addEventListener('click', function (e) { if (e.target === lb || e.target.classList.contains('lb-stage')) close(); });
    doc.addEventListener('keydown', function (e) {
      if (!lb.classList.contains('open')) return;
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowRight') show(idx + 1);
      if (e.key === 'ArrowLeft') show(idx - 1);
    });
    var sx = 0;
    lb.addEventListener('touchstart', function (e) { sx = e.changedTouches[0].clientX; }, { passive: true });
    lb.addEventListener('touchend', function (e) {
      var dx = e.changedTouches[0].clientX - sx;
      if (dx < -40) show(idx + 1); if (dx > 40) show(idx - 1);
    }, { passive: true });
  }

  /* ---------- video reels ---------- */
  var ICON = {
    play: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5.5v13a1 1 0 0 0 1.5.86l10.2-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5z"/></svg>',
    pause: '<svg viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="5" width="4.2" height="14" rx="1.2"/><rect x="13.8" y="5" width="4.2" height="14" rx="1.2"/></svg>',
    sound: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9.5v5h3.5L12 18.5v-13L7.5 9.5z" fill="currentColor"/><path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11"/></svg>',
    mute: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9.5v5h3.5L12 18.5v-13L7.5 9.5z" fill="currentColor"/><path d="M16 9.5l5 5M21 9.5l-5 5"/></svg>',
    full: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/></svg>'
  };
  function fmt(s) { s = Math.max(0, Math.floor(s || 0)); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); }

  $$('.reel[data-video]').forEach(function (reel) {
    var v = $('video', reel), media = $('.reel-media', reel), fill = $('.reel-bar i', reel);
    if (!v) return;
    v.controls = false; v.removeAttribute('controls');
    media.setAttribute('tabindex', '0'); media.setAttribute('role', 'button');
    media.setAttribute('aria-label', 'Play ' + ($('h3', reel) ? $('h3', reel).textContent : 'video') + ' with sound');

    var ctrl = doc.createElement('div'); ctrl.className = 'reel-ctrl';
    ctrl.innerHTML =
      '<button class="rc-btn rc-play" aria-label="Pause">' + ICON.pause + '</button>' +
      '<span class="rc-time">0:00</span>' +
      '<div class="rc-track" role="slider" tabindex="0" aria-label="Seek" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"><i class="rc-fill"></i><i class="rc-knob"></i></div>' +
      '<span class="rc-time rc-dur">0:00</span>' +
      '<button class="rc-btn rc-mute" aria-label="Mute">' + ICON.sound + '</button>' +
      '<button class="rc-btn rc-full" aria-label="Full screen">' + ICON.full + '</button>';
    media.appendChild(ctrl);
    var center = doc.createElement('span'); center.className = 'rc-center'; center.setAttribute('aria-hidden', 'true');
    center.innerHTML = ICON.play; media.appendChild(center);
    var bPlay = $('.rc-play', ctrl), bMute = $('.rc-mute', ctrl), bFull = $('.rc-full', ctrl);
    var track = $('.rc-track', ctrl), tFill = $('.rc-fill', ctrl), tKnob = $('.rc-knob', ctrl);
    var tCur = $('.rc-time', ctrl), tDur = $('.rc-dur', ctrl);
    var idleTimer = null;

    function syncUI() {
      var playing = !v.paused && !v.ended;
      reel.classList.toggle('paused', reel.classList.contains('started') && !playing);
      bPlay.innerHTML = playing ? ICON.pause : ICON.play;
      bPlay.setAttribute('aria-label', playing ? 'Pause' : 'Play');
      bMute.innerHTML = v.muted ? ICON.mute : ICON.sound;
      bMute.setAttribute('aria-label', v.muted ? 'Unmute' : 'Mute');
      media.dataset.cursor = reel.classList.contains('started') ? (playing ? 'Pause' : 'Play') : 'Play';
      refreshCursor();
    }
    function wake() {
      reel.classList.remove('idle'); clearTimeout(idleTimer);
      idleTimer = setTimeout(function () { if (!v.paused) reel.classList.add('idle'); }, 2200);
    }
    function start() {
      $$('.reel.started video').forEach(function (o) { if (o !== v) o.pause(); });
      if (!reel.classList.contains('started')) { v.currentTime = 0; }
      reel.classList.add('started');
      v.muted = false; v.play().catch(function () {}); wake();
    }
    function toggle() {
      if (!reel.classList.contains('started')) return start();
      if (v.paused) { start(); } else { v.pause(); }
    }
    function reset() {
      reel.classList.remove('started', 'paused', 'idle');
      v.pause(); v.muted = true; v.currentTime = 0; v.load();
      fill.style.width = '0%'; syncUI();
    }

    media.addEventListener('click', function (e) { if (!e.target.closest('.reel-ctrl')) toggle(); });
    media.addEventListener('keydown', function (e) {
      if (e.target !== media) return;
      if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); toggle(); }
    });
    media.addEventListener('mousemove', wake);
    media.addEventListener('touchstart', wake, { passive: true });
    bPlay.addEventListener('click', function () { toggle(); wake(); });
    bMute.addEventListener('click', function () { v.muted = !v.muted; syncUI(); wake(); });
    bFull.addEventListener('click', function () {
      if (doc.fullscreenElement) { doc.exitFullscreen(); return; }
      if (media.requestFullscreen) media.requestFullscreen().catch(function () {});
      else if (v.webkitEnterFullscreen) v.webkitEnterFullscreen();
    });

    /* scrubbing */
    var dragging = false;
    function seekTo(clientX) {
      var r = track.getBoundingClientRect();
      var p = Math.max(0, Math.min(1, (clientX - r.left) / r.width));
      if (v.duration) v.currentTime = p * v.duration;
      paint(p);
    }
    track.addEventListener('pointerdown', function (e) {
      dragging = true; track.setPointerCapture(e.pointerId); reel.classList.add('scrubbing'); seekTo(e.clientX);
    });
    track.addEventListener('pointermove', function (e) { if (dragging) seekTo(e.clientX); });
    track.addEventListener('pointerup', function () { dragging = false; reel.classList.remove('scrubbing'); });
    track.addEventListener('keydown', function (e) {
      if (!v.duration) return;
      if (e.key === 'ArrowRight') { v.currentTime = Math.min(v.duration, v.currentTime + 1); e.preventDefault(); }
      if (e.key === 'ArrowLeft') { v.currentTime = Math.max(0, v.currentTime - 1); e.preventDefault(); }
    });

    function paint(p) {
      var pct = (p * 100).toFixed(2) + '%';
      tFill.style.width = pct; tKnob.style.left = pct; fill.style.width = pct;
      if (v.duration) tCur.textContent = fmt(p * v.duration);
      track.setAttribute('aria-valuenow', Math.round(p * 100));
    }
    v.addEventListener('timeupdate', function () {
      if (!v.duration || dragging) return;
      paint(v.currentTime / v.duration);
      tCur.textContent = fmt(v.currentTime);
    });
    v.addEventListener('loadedmetadata', function () { tDur.textContent = fmt(v.duration); });
    v.addEventListener('play', syncUI);
    v.addEventListener('pause', function () { syncUI(); reel.classList.remove('idle'); });
    v.addEventListener('volumechange', syncUI);
    v.addEventListener('ended', reset);

    if (fine && !reduce) {
      reel.addEventListener('mouseenter', function () { if (!reel.classList.contains('started')) { v.muted = true; v.play().catch(function () {}); } });
      reel.addEventListener('mouseleave', function () { if (!reel.classList.contains('started')) { v.pause(); } });
    }
    syncUI();
  });

  /* ---------- muted autoplay loops when visible ---------- */
  var loops = $$('video[data-loop]');
  if (loops.length && 'IntersectionObserver' in window) {
    var vio = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting && !reduce) e.target.play().catch(function () {}); else e.target.pause(); });
    }, { threshold: 0.3 });
    loops.forEach(function (v) { v.muted = true; vio.observe(v); });
  }

  /* ---------- Off the clock: Liverpool scoreboard + celebration ---------- */
  var lfc = $('.lfc');
  if (lfc) {
    var home = $('.digit[data-score]', lfc), target = parseInt(home.dataset.score, 10), counted = false;
    var countUp = function () {
      if (counted) return; counted = true;
      if (reduce) { home.textContent = target; lfc.classList.add('done'); return; }
      var n = 0;
      (function goal() {
        n++; home.textContent = n;
        home.classList.remove('tick'); void home.offsetWidth; home.classList.add('tick');
        if (n < target) setTimeout(goal, n === target - 1 ? 520 : 280);
        else setTimeout(function () { lfc.classList.add('done'); }, 350);
      })();
    };
    if ('IntersectionObserver' in window) {
      var lio = new IntersectionObserver(function (es) {
        if (es[0].isIntersecting) { setTimeout(countUp, reduce ? 0 : 1300); lio.disconnect(); }
      }, { threshold: 0.6 });
      lio.observe(lfc);
    } else { countUp(); }

    var confetti = function (x, y) {
      var colors = ['#D3112E', '#D3112E', '#FFFFFF', '#F6EB61', '#A30D24'];
      for (var i = 0; i < 48; i++) {
        var p = doc.createElement('span'); p.className = 'confetti';
        p.style.background = colors[i % colors.length];
        if (i % 3 === 0) { p.style.width = '8px'; p.style.height = '8px'; p.style.borderRadius = '50%'; }
        body.appendChild(p);
        var ang = Math.random() * Math.PI * 2, pow = 120 + Math.random() * 220;
        var dx = Math.cos(ang) * pow, up = -(140 + Math.random() * 260), rot = (Math.random() - 0.5) * 1080;
        var anim = p.animate([
          { transform: 'translate(' + x + 'px,' + y + 'px) rotate(0deg) scale(.6)', opacity: 1 },
          { transform: 'translate(' + (x + dx * 0.7) + 'px,' + (y + up) + 'px) rotate(' + rot / 2 + 'deg) scale(1)', opacity: 1, offset: 0.35 },
          { transform: 'translate(' + (x + dx) + 'px,' + (y + up + 420 + Math.random() * 200) + 'px) rotate(' + rot + 'deg) scale(.9)', opacity: 0 }
        ], { duration: 1300 + Math.random() * 700, easing: 'cubic-bezier(.2,.65,.4,1)' });
        anim.onfinish = (function (el) { return function () { el.remove(); }; })(p);
      }
    };
    lfc.addEventListener('click', function (e) {
      countUp();
      lfc.classList.remove('celebrate', 'kick'); void lfc.offsetWidth;
      lfc.classList.add('celebrate', 'kick');
      setTimeout(function () { lfc.classList.remove('celebrate', 'kick'); }, 1400);
      if (reduce) return;
      var r = lfc.getBoundingClientRect();
      var x = e.clientX || (r.left + r.width / 2), y = e.clientY || (r.top + r.height / 2);
      confetti(x, y);
    });
  }

  /* ---------- page transitions ---------- */
  var curtain = $('.curtain');
  $$('a[href]').forEach(function (a) {
    var href = a.getAttribute('href');
    if (!href || href.charAt(0) === '#' || a.target === '_blank' || a.hasAttribute('download') || /^(mailto:|tel:|https?:)/.test(href)) return;
    if (!/\.html(#.*)?$/.test(href)) return;
    a.addEventListener('click', function (e) {
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0 || reduce || !curtain) return;
      e.preventDefault();
      curtain.classList.add('leave');
      setTimeout(function () { window.location.href = href; }, 520);
    });
  });
  window.addEventListener('pageshow', function (e) { if (e.persisted && curtain) curtain.classList.remove('leave'); });

  /* ---------- year ---------- */
  $$('[data-year]').forEach(function (el) { el.textContent = new Date().getFullYear(); });
})();
