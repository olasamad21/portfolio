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
    doc.addEventListener('mouseover', function (e) {
      var v = e.target.closest('[data-cursor]');
      var l = e.target.closest('a,button,[role="button"]');
      cur.classList.toggle('is-view', !!v);
      cur.classList.toggle('is-link', !v && !!l);
      lbl.textContent = v ? v.dataset.cursor : '';
      dot.style.opacity = v ? 0 : 1;
    });

    $$('[data-magnetic]').forEach(function (el) {
      var s = parseFloat(el.dataset.magnetic) || 0.3;
      el.addEventListener('mousemove', function (e) {
        var r = el.getBoundingClientRect();
        var x = e.clientX - (r.left + r.width / 2), y = e.clientY - (r.top + r.height / 2);
        el.style.transform = 'translate(' + x * s + 'px,' + y * s + 'px)';
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
  $$('.reel[data-video]').forEach(function (reel) {
    var v = $('video', reel), btn = $('.play-btn', reel), fill = $('.reel-bar i', reel);
    if (!v) return;
    function start() {
      $$('.reel.playing video').forEach(function (o) { if (o !== v) o.pause(); });
      v.muted = false; v.controls = true; v.play(); reel.classList.add('playing');
    }
    $('.reel-media', reel).addEventListener('click', function () { if (!reel.classList.contains('playing')) start(); });
    if (fine && !reduce) {
      reel.addEventListener('mouseenter', function () { if (!reel.classList.contains('playing')) { v.muted = true; v.play().catch(function () {}); } });
      reel.addEventListener('mouseleave', function () { if (!reel.classList.contains('playing')) { v.pause(); } });
    }
    v.addEventListener('timeupdate', function () { if (v.duration) fill.style.width = (v.currentTime / v.duration * 100) + '%'; });
    v.addEventListener('ended', function () { reel.classList.remove('playing'); v.controls = false; });
  });

  /* ---------- muted autoplay loops when visible ---------- */
  var loops = $$('video[data-loop]');
  if (loops.length && 'IntersectionObserver' in window) {
    var vio = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting && !reduce) e.target.play().catch(function () {}); else e.target.pause(); });
    }, { threshold: 0.3 });
    loops.forEach(function (v) { v.muted = true; vio.observe(v); });
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
