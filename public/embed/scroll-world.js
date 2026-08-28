/**
 * ScrollWorld Universal Standalone Embed & Web Component
 * Ultra-lightweight (<12KB) zero-dependency player engine
 * Features: Blob Seeking, Dynamic Video Pool (max 2), Seek Coalescing, iOS Priming, Linger Easing.
 */

(function (window, document) {
  'use strict';

  function clamp(val, min, max) {
    return Math.min(Math.max(val, min), max);
  }

  function lerp(a, b, f) {
    return a + (b - a) * f;
  }

  function applyLingerEase(t, lingerFactor) {
    var k = clamp(lingerFactor !== undefined ? lingerFactor : 0.45, 0, 0.95);
    return t - (k / (2 * Math.PI)) * Math.sin(2 * Math.PI * t);
  }

  // --- Core Engine Class ---
  function ScrollWorldEngine(container, options) {
    this.container = typeof container === 'string' ? document.querySelector(container) : container;
    if (!this.container) throw new Error('ScrollWorld: Container not found');

    this.options = Object.assign({
      scenes: [],
      dampingFactor: 0.18,
      lingerFactor: 0.5,
      mode: 'desktop',
      autoPrime: true
    }, options || {});

    this.scenes = this.options.scenes || [];
    this.pool = {}; // sceneIndex -> { video, blobUrl, objectUrl, isAttached, isSeeking }
    this.blobCache = {}; // url -> objectUrl
    this.currentProgress = 0;
    this.targetProgress = 0;
    this.currentSceneIndex = 0;
    this.localSceneProgress = 0;
    this.isPrimed = false;
    this.isDestroyed = false;
    this.rafId = null;

    this.initDOM();
    this.setupTouchPriming();
    this.setupScrollInteractions();
    this.preloadBlobs();
    this.startLoop();
  }

  ScrollWorldEngine.prototype.initDOM = function () {
    this.container.style.position = 'relative';
    this.container.style.overflow = 'hidden';
    this.container.style.userSelect = 'none';
    this.container.style.backgroundColor = '#000';

    // Layer 1: Poster
    this.posterLayer = document.createElement('div');
    this.posterLayer.style.position = 'absolute';
    this.posterLayer.style.inset = '0';
    this.posterLayer.style.zIndex = '1';
    this.posterLayer.style.pointerEvents = 'none';

    // Layer 2: Video Pool
    this.videoLayer = document.createElement('div');
    this.videoLayer.style.position = 'absolute';
    this.videoLayer.style.inset = '0';
    this.videoLayer.style.zIndex = '2';
    this.videoLayer.style.pointerEvents = 'none';

    // Layer 3: Text & Overlays
    this.overlayLayer = document.createElement('div');
    this.overlayLayer.style.position = 'absolute';
    this.overlayLayer.style.inset = '0';
    this.overlayLayer.style.zIndex = '3';
    this.overlayLayer.style.pointerEvents = 'none';
    this.overlayLayer.style.display = 'flex';
    this.overlayLayer.style.flexDirection = 'column';
    this.overlayLayer.style.justifyContent = 'space-between';
    this.overlayLayer.style.padding = '32px';
    this.overlayLayer.style.fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    this.overlayLayer.style.color = '#fff';

    this.container.appendChild(this.posterLayer);
    this.container.appendChild(this.videoLayer);
    this.container.appendChild(this.overlayLayer);

    this.renderPosters();
    this.renderOverlay();
  };

  ScrollWorldEngine.prototype.renderPosters = function () {
    this.posterLayer.innerHTML = '';
    var self = this;
    this.scenes.forEach(function (sc, idx) {
      if (sc.stillPosterUrl) {
        var img = document.createElement('img');
        img.src = sc.stillPosterUrl;
        img.style.position = 'absolute';
        img.style.inset = '0';
        img.style.width = '100%';
        img.style.height = '100%';
        img.style.objectFit = 'cover';
        img.style.opacity = idx === 0 ? '1' : '0';
        img.style.transition = 'opacity 0.25s ease-out';
        self.posterLayer.appendChild(img);
      }
    });
  };

  ScrollWorldEngine.prototype.renderOverlay = function () {
    this.overlayLayer.innerHTML = `
      <div id="sw-header" style="display:flex; justify-content:space-between; align-items:center;">
        <span id="sw-pill" style="background:rgba(0,0,0,0.5); backdrop-filter:blur(8px); border:1px solid rgba(255,255,255,0.15); padding:4px 12px; border-radius:99px; font-size:11px; font-weight:600; letter-spacing:0.05em;">SCENE 1</span>
      </div>
      <div id="sw-content" style="max-width:560px; transition:opacity 0.2s ease;">
        <p id="sw-subtitle" style="color:#06b6d4; font-size:12px; font-weight:700; text-transform:uppercase; letter-spacing:0.1em; margin-bottom:6px;"></p>
        <h2 id="sw-title" style="font-size:28px; font-weight:800; line-height:1.2; margin-bottom:8px; text-shadow:0 2px 8px rgba(0,0,0,0.8);"></h2>
        <p id="sw-desc" style="font-size:14px; color:rgba(255,255,255,0.8); line-height:1.5;"></p>
      </div>
    `;
    this.updateOverlayContent();
  };

  ScrollWorldEngine.prototype.updateOverlayContent = function () {
    var sc = this.scenes[this.currentSceneIndex];
    if (!sc) return;

    var pill = this.overlayLayer.querySelector('#sw-pill');
    var sub = this.overlayLayer.querySelector('#sw-subtitle');
    var title = this.overlayLayer.querySelector('#sw-title');
    var desc = this.overlayLayer.querySelector('#sw-desc');
    var content = this.overlayLayer.querySelector('#sw-content');

    if (pill) pill.textContent = 'SCENE ' + (this.currentSceneIndex + 1) + ' OF ' + this.scenes.length;
    if (sub) sub.textContent = sc.subtitle || '';
    if (title) title.textContent = sc.title || '';
    if (desc) desc.textContent = sc.description || '';

    // Smooth opacity bell curve centered at localSceneProgress = 0.5
    var opacity = Math.max(0, 1 - Math.pow(Math.abs(this.localSceneProgress - 0.5) * 2.2, 2));
    if (content) content.style.opacity = opacity.toString();
  };

  ScrollWorldEngine.prototype.preloadBlobs = function () {
    if (!this.scenes.length) return;
    this.fetchBlob(0);
    if (this.scenes.length > 1) this.fetchBlob(1);
  };

  ScrollWorldEngine.prototype.fetchBlob = function (index) {
    var sc = this.scenes[index];
    if (!sc) return Promise.resolve(null);
    var url = this.options.mode === 'mobile' && sc.videoMobileUrl ? sc.videoMobileUrl : sc.videoDesktopUrl;
    if (!url) return Promise.resolve(null);

    var self = this;
    if (this.blobCache[url]) return Promise.resolve(this.blobCache[url]);

    return fetch(url, { mode: 'cors' })
      .then(function (res) {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return res.blob();
      })
      .then(function (blob) {
        var objUrl = URL.createObjectURL(blob);
        self.blobCache[url] = objUrl;
        return objUrl;
      })
      .catch(function () {
        self.blobCache[url] = url;
        return url;
      });
  };

  ScrollWorldEngine.prototype.getVideoItem = function (index) {
    if (index < 0 || index >= this.scenes.length) return null;
    var item = this.pool[index];
    var self = this;

    if (!item) {
      var sc = this.scenes[index];
      var video = document.createElement('video');
      video.muted = true;
      video.playsInline = true;
      video.preload = 'auto';
      video.setAttribute('playsinline', '');
      video.setAttribute('webkit-playsinline', '');
      video.setAttribute('muted', '');
      video.style.position = 'absolute';
      video.style.inset = '0';
      video.style.width = '100%';
      video.style.height = '100%';
      video.style.objectFit = 'cover';
      video.style.opacity = '0';
      video.style.transition = 'opacity 0.2s ease-out';

      item = {
        sceneIndex: index,
        videoElement: video,
        blobUrl: self.options.mode === 'mobile' && sc.videoMobileUrl ? sc.videoMobileUrl : sc.videoDesktopUrl,
        isAttached: false,
        isSeeking: false
      };

      video.addEventListener('seeking', function () { item.isSeeking = true; });
      video.addEventListener('seeked', function () {
        item.isSeeking = false;
        video.style.opacity = '1';
      });

      this.pool[index] = item;
    }

    if (!item.isAttached) {
      this.evictVideos(index);
      this.videoLayer.appendChild(item.videoElement);
      item.isAttached = true;

      var cached = this.blobCache[item.blobUrl];
      if (cached) {
        item.videoElement.src = cached;
        item.videoElement.load();
      } else {
        this.fetchBlob(index).then(function (url) {
          if (url && item.videoElement) {
            item.videoElement.src = url;
            item.videoElement.load();
          }
        });
      }
    }

    return item;
  };

  ScrollWorldEngine.prototype.evictVideos = function (activeIndex) {
    var keys = Object.keys(this.pool);
    var attached = [];
    for (var i = 0; i < keys.length; i++) {
      if (this.pool[keys[i]].isAttached) attached.push(this.pool[keys[i]]);
    }

    if (attached.length >= 2) {
      attached.sort(function (a, b) {
        return Math.abs(b.sceneIndex - activeIndex) - Math.abs(a.sceneIndex - activeIndex);
      });
      while (attached.length >= 2) {
        var toRemove = attached.shift();
        if (toRemove && toRemove.sceneIndex !== activeIndex) {
          if (toRemove.videoElement.parentNode) {
            toRemove.videoElement.parentNode.removeChild(toRemove.videoElement);
          }
          toRemove.isAttached = false;
        }
      }
    }
  };

  ScrollWorldEngine.prototype.setupTouchPriming = function () {
    var self = this;
    function onFirstTouch() {
      if (self.isPrimed) return;
      self.isPrimed = true;
      var item = self.getVideoItem(self.currentSceneIndex);
      if (item && item.videoElement) {
        var p = item.videoElement.play();
        if (p !== undefined) {
          p.then(function () { item.videoElement.pause(); }).catch(function () {});
        }
      }
      window.removeEventListener('touchstart', onFirstTouch, true);
      window.removeEventListener('pointerdown', onFirstTouch, true);
      window.removeEventListener('wheel', onFirstTouch, true);
    }
    window.addEventListener('touchstart', onFirstTouch, { capture: true, passive: true });
    window.addEventListener('pointerdown', onFirstTouch, { capture: true, passive: true });
    window.addEventListener('wheel', onFirstTouch, { capture: true, passive: true });
  };

  ScrollWorldEngine.prototype.setupScrollInteractions = function () {
    var self = this;
    this.container.addEventListener('wheel', function (e) {
      e.preventDefault();
      var delta = e.deltaY * 0.00085;
      self.scrollBy(delta);
    }, { passive: false });

    var touchY = 0;
    this.container.addEventListener('touchstart', function (e) {
      if (e.touches.length) touchY = e.touches[0].clientY;
    }, { passive: true });

    this.container.addEventListener('touchmove', function (e) {
      if (e.touches.length) {
        var currentY = e.touches[0].clientY;
        var delta = (touchY - currentY) * 0.0025;
        touchY = currentY;
        self.scrollBy(delta);
      }
    }, { passive: true });
  };

  ScrollWorldEngine.prototype.scrollBy = function (delta) {
    this.targetProgress = clamp(this.targetProgress + delta, 0, 1);
  };

  ScrollWorldEngine.prototype.startLoop = function () {
    var self = this;
    function loop() {
      if (self.isDestroyed) return;
      var diff = self.targetProgress - self.currentProgress;
      if (Math.abs(diff) > 0.00005) {
        self.currentProgress = lerp(self.currentProgress, self.targetProgress, self.options.dampingFactor);
      } else {
        self.currentProgress = self.targetProgress;
      }
      self.updateFrame(self.currentProgress);
      self.rafId = requestAnimationFrame(loop);
    }
    this.rafId = requestAnimationFrame(loop);
  };

  ScrollWorldEngine.prototype.updateFrame = function (progress) {
    if (!this.scenes.length) return;
    var total = this.scenes.length;
    var scaled = progress * (total - 1);
    var sceneIdx = Math.floor(scaled);
    var rawLocal = scaled - sceneIdx;

    this.currentSceneIndex = Math.min(sceneIdx, total - 1);
    var activeScene = this.scenes[this.currentSceneIndex];
    this.localSceneProgress = applyLingerEase(rawLocal, activeScene.lingerFactor || this.options.lingerFactor);

    var videoItem = this.getVideoItem(this.currentSceneIndex);
    if (videoItem && videoItem.videoElement) {
      var v = videoItem.videoElement;
      var duration = v.duration || activeScene.duration || 4.0;
      var targetTime = clamp(this.localSceneProgress * duration, 0, duration);

      // Seek coalescing
      if (!v.seeking && Math.abs(v.currentTime - targetTime) > 0.02) {
        try {
          if ('fastSeek' in v) v.fastSeek(targetTime);
          else v.currentTime = targetTime;
        } catch (e) {}
      }
    }

    // Pre-warm neighbor
    if (this.currentSceneIndex + 1 < total) this.getVideoItem(this.currentSceneIndex + 1);

    // Update Posters
    var imgs = this.posterLayer.querySelectorAll('img');
    for (var i = 0; i < imgs.length; i++) {
      imgs[i].style.opacity = i === this.currentSceneIndex ? '1' : '0';
    }

    this.updateOverlayContent();
  };

  ScrollWorldEngine.prototype.destroy = function () {
    this.isDestroyed = true;
    if (this.rafId) cancelAnimationFrame(this.rafId);
    var self = this;
    Object.keys(this.blobCache).forEach(function (k) {
      if (self.blobCache[k].indexOf('blob:') === 0) URL.revokeObjectURL(self.blobCache[k]);
    });
    this.container.innerHTML = '';
  };

  // --- Export Global Namespace ---
  window.ScrollWorld = {
    mount: function (selector, options) {
      return new ScrollWorldEngine(selector, options);
    }
  };

  // --- Custom Web Component: <scroll-world> ---
  if (typeof customElements !== 'undefined' && !customElements.get('scroll-world')) {
    class ScrollWorldElement extends HTMLElement {\n      connectedCallback() {\n        var scriptTag = this.querySelector('script[type=\"application/json\"]');\n        var scenes = [];\n        if (scriptTag) {\n          try {\n            scenes = JSON.parse(scriptTag.textContent || '[]');\n          } catch (e) {}\n        }\n        var damping = parseFloat(this.getAttribute('damping') || '0.18');\n        var linger = parseFloat(this.getAttribute('linger') || '0.5');\n        var mode = this.getAttribute('mode') || 'desktop';\n\n        this.engine = new ScrollWorldEngine(this, {\n          scenes: scenes,\n          dampingFactor: damping,\n          lingerFactor: linger,\n          mode: mode\n        });\n      }\n\n      disconnectedCallback() {\n        if (this.engine) this.engine.destroy();\n      }\n    }\n    customElements.define('scroll-world', ScrollWorldElement);\n  }\n\n})(typeof window !== 'undefined' ? window : this, typeof document !== 'undefined' ? document : {});\n