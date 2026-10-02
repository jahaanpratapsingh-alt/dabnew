(() => {
  "use strict";

  /* ==========================================================
     DAB HABITZ — HOMEPAGE CONTROLLER
     - Direct scroll -> exact frame mapping.
     - Manual scroll only: page position maps directly to the exact frame.
     - Automatically detects however many sequential frames exist.
     - Scroll runway scales with the detected frame count.
     - No lerp, easing, catch-up or delayed settling.
  ========================================================== */

  // AUTO-DETECTED from assets/frames/frame_0001.* onward.
  let FRAME_COUNT = 1;

  // ONE sensitivity control.
  // Higher = more physical scrolling per frame / less sensitive.
  // 2.0 quick, 3.0 balanced, 4.0 slow, 5.0 very slow.
  const SCROLL_DISTANCE_PER_FRAME_VH = 1;


  const clamp = (value, min, max) =>
    Math.min(max, Math.max(min, value));

  /* ---------------- MOBILE MENU ---------------- */

  const menuToggle = document.querySelector("[data-menu-toggle]");
  const mobileMenu = document.querySelector("[data-mobile-menu]");

  if (menuToggle && mobileMenu) {
    menuToggle.addEventListener("click", () => {
      const open = mobileMenu.classList.toggle("is-open");
      document.body.classList.toggle("menu-open", open);
      menuToggle.textContent = open ? "CLOSE" : "MENU";
    });

    mobileMenu.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => {
        mobileMenu.classList.remove("is-open");
        document.body.classList.remove("menu-open");
        menuToggle.textContent = "MENU";
      });
    });
  }

  /* Safety: never keep desktop scroll locked after reload/navigation. */
  if (window.innerWidth > 980) {
    document.body.classList.remove("menu-open");
  }

  /* ---------------- SMART HEADER ----------------
     Scroll down = hide. Scroll up = reveal.
     Near the top = always visible.
  ------------------------------------------------ */

  const smartHeader = document.querySelector("[data-smart-header]");

  if (smartHeader) {
    let lastHeaderY = Math.max(0, window.scrollY);
    let headerTicking = false;
    const HEADER_TOP_LOCK = 48;
    const HEADER_DIRECTION_DEADZONE = 7;

    const updateSmartHeader = () => {
      const currentY = Math.max(0, window.scrollY);
      const delta = currentY - lastHeaderY;
      const menuIsOpen = document.body.classList.contains("menu-open");

      if (menuIsOpen || currentY <= HEADER_TOP_LOCK) {
        smartHeader.classList.remove("is-hidden");
      } else if (delta > HEADER_DIRECTION_DEADZONE) {
        smartHeader.classList.add("is-hidden");
      } else if (delta < -HEADER_DIRECTION_DEADZONE) {
        smartHeader.classList.remove("is-hidden");
      }

      lastHeaderY = currentY;
      headerTicking = false;
    };

    window.addEventListener("scroll", () => {
      if (headerTicking) return;
      headerTicking = true;
      requestAnimationFrame(updateSmartHeader);
    }, { passive: true });
  }

  /* ---------------- FAQ ---------------- */

  document.querySelectorAll(".faq-question").forEach((button) => {
    button.addEventListener("click", () => {
      const item = button.closest(".faq-item");
      if (!item) return;

      const wasOpen = item.classList.contains("is-open");
      document.querySelectorAll(".faq-item").forEach((other) => {
        other.classList.remove("is-open");
      });
      if (!wasOpen) item.classList.add("is-open");
    });
  });

  /* ---------------- SMALL MOVING-IN TEXT REVEALS ---------------- */

  const revealSelectors = [
    ".section-heading .eyebrow",
    ".section-heading h2",
    ".section-heading > p",
    ".collection-card-copy > *",
    ".feature-card-body > *",
    ".ritual-copy > *",
    ".house-grid > div > *",
    ".faq-grid > div:first-child > *",
    ".closing-grid > div > *",
    ".footer-grid > div > *"
  ].join(",");

  const revealItems = [...document.querySelectorAll(revealSelectors)];

  revealItems.forEach((el, index) => {
    el.classList.add("scroll-reveal");
    el.style.setProperty("--reveal-delay", `${(index % 4) * 10}ms`);
  });

  if ("IntersectionObserver" in window) {
    const revealObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        });
      },
      {
        threshold: 0.12,
        rootMargin: "0px 0px -8% 0px"
      }
    );

    revealItems.forEach((el) => revealObserver.observe(el));
  } else {
    revealItems.forEach((el) => el.classList.add("is-visible"));
  }

  /* ==========================================================
     478-FRAME CANVAS SEQUENCE
  ========================================================== */

  const canvas = document.getElementById("sequenceCanvas");
  const sequence = document.querySelector(".sequence");

  if (!canvas || !sequence) return;

  /*
    LAPTOP / DESKTOP ONLY
    Phones and tablets skip the frame-scroll sequence completely.
    A real mouse/trackpad device keeps the full experience.
  */
  const disableSequenceOnTouchMobile =
    window.matchMedia("(hover: none) and (pointer: coarse)").matches;

  if (disableSequenceOnTouchMobile) {
    sequence.classList.add("sequence-mobile-disabled");

    const mobileLoader = document.getElementById("sequenceLoader");
    if (mobileLoader) mobileLoader.classList.add("is-done");

    return;
  }

  const ctx = canvas.getContext("2d", { alpha: false });
  const fallback = document.getElementById("sequenceFallback");
  const loader = document.getElementById("sequenceLoader");
  const loaderFill = document.getElementById("sequenceLoaderFill");

  const title = document.getElementById("seqTitle");
  const kicker = document.getElementById("seqKicker");
  const sub = document.getElementById("seqSub");
  const copy = document.getElementById("seqCopy");

  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const mobile = matchMedia("(max-width: 900px)").matches;


  /* Keep decoded high-res frames around the playhead only. */
  const MAX_CACHE = mobile ? 42 : 76;
  const INITIAL_PRELOAD = mobile ? 22 : 36;

  const cache = new Map();
  const pending = new Map();

  let dpr = Math.min(window.devicePixelRatio || 1, 2);
  let currentFrame = 1;
  let targetFrame = 1;
  let ready = false;
  let loadedCount = 0;



  /* ---------------- SCROLL MOMENTS ----------------
     The animation is the hero. Copy appears only in short, intentional
     moments around the bottle instead of living in one fixed corner.
  ------------------------------------------------ */

  const sequenceSticky = sequence.querySelector(".sequence-sticky");

  const scrollMoments = [
    {
      id: "statement",
      at: 0.02,
      end: 0.400,
      className: "is-statement is-left",
      eyebrow: "DAB HABITZ · 66 ML",
      title: "LEAVE<br>EVIDENCE.",
      body: "A fragrance should stay in the room after you leave it."
    },
    {
      id: "arcade",
      at: 0.405,
      end: 0.700,
      className: "is-card is-right",
      eyebrow: "AFTER HOURS · FOUND IT",
      title: "THERE'S AN<br>ARCADE INSIDE.",
      body: "Five games. Fragrance worlds. Rewards worth up to ₹666.",
      cta: {
        label: "ENTER THE ARCADE",
        href: "#play-win"
      }
    },
    {
      id: "habit",
      at: 0.705,
      end: 1.01,
      className: "is-habit-picker",
      eyebrow: "PICK A SIDE",
      title: "WHAT DO YOU<br>CRAVE?",
      choices: [
        { label: "SWEET CHAOS", sub: "SUGAR CRASH", href: "./sugarcrash/index.html" },
        { label: "HEAT + TENSION", sub: "SITUATIONSHIP", href: "./situationship/index.html" },
        { label: "DARK + DEEP", sub: "DARK MATTER", href: "./darkmatter/index.html" }
      ]
    }
  ];

  let momentLayer = null;
  let momentNodes = [];

  function createScrollMoments() {
    if (!sequenceSticky) return;

    // The original fixed lower-left copy remains in the HTML as a fallback,
    // but the new moment system owns the visible sequence typography.
    if (copy) copy.setAttribute("aria-hidden", "true");

    momentLayer = document.createElement("div");
    momentLayer.className = "dh-scroll-moments";
    momentLayer.setAttribute("aria-label", "Dab Habitz scroll discoveries");

    momentNodes = scrollMoments.map((scene, index) => {
      const article = document.createElement("article");
      article.className = `dh-scroll-moment ${scene.className || ""}`;
      article.dataset.moment = scene.id;
      article.dataset.index = String(index);
      article.setAttribute("aria-hidden", "true");

      const eyebrow = document.createElement("div");
      eyebrow.className = "dh-scroll-moment__eyebrow";
      eyebrow.textContent = scene.eyebrow || "";
      article.appendChild(eyebrow);

      const heading = document.createElement("h2");
      heading.className = "dh-scroll-moment__title";
      heading.innerHTML = scene.title || "";
      article.appendChild(heading);

      if (scene.body) {
        const body = document.createElement("p");
        body.className = "dh-scroll-moment__body";
        body.textContent = scene.body;
        article.appendChild(body);
      }

      if (scene.cta) {
        const link = document.createElement("a");
        link.className = "dh-scroll-moment__cta";
        link.href = scene.cta.href;
        link.innerHTML = `<span>${scene.cta.label}</span><b aria-hidden="true">↗</b>`;
        link.tabIndex = -1;
        article.appendChild(link);
      }

      if (scene.choices) {
        const choices = document.createElement("div");
        choices.className = "dh-scroll-moment__choices";

        scene.choices.forEach((choice) => {
          const link = document.createElement("a");
          link.className = "dh-scroll-choice";
          link.href = choice.href;
          link.tabIndex = -1;
          link.innerHTML = `
            <strong>${choice.label}</strong>
            <span>${choice.sub}</span>
          `;
          choices.appendChild(link);
        });

        article.appendChild(choices);
      }

      momentLayer.appendChild(article);
      return article;
    });

    sequenceSticky.appendChild(momentLayer);
  }

  createScrollMoments();

  function updateScrollMoments(progress) {
    if (!momentNodes.length) return;

    scrollMoments.forEach((scene, index) => {
      const node = momentNodes[index];
      const isActive = progress >= scene.at && progress < scene.end;

      node.classList.toggle("is-active", isActive);
      node.setAttribute("aria-hidden", isActive ? "false" : "true");

      node.querySelectorAll("a").forEach((link) => {
        link.tabIndex = isActive ? 0 : -1;
      });

      if (!isActive) {
        node.style.removeProperty("--moment-local");
        return;
      }

      const local = clamp(
        (progress - scene.at) / Math.max(0.0001, scene.end - scene.at),
        0,
        1
      );

      // CSS uses this only for tiny editorial drift/fade. It does not affect
      // the frame engine or scroll mapping.
      node.style.setProperty("--moment-local", local.toFixed(4));
    });
  }

  function pad(n, len) {
    return String(n).padStart(len, "0");
  }

  let frameExtension = "jpg";

  function frameUrl(n) {
    return `./assets/frames/frame_${pad(n, 4)}.${frameExtension}`;
  }

  function testFrameSource(src) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(true);
      img.onerror = () => resolve(false);
      img.src = src;
    });
  }

  async function detectFrameExtension() {
    for (const ext of ["png", "jpg", "jpeg", "webp"]) {
      if (await testFrameSource(`./assets/frames/frame_0001.${ext}`)) {
        return ext;
      }
    }
    return null;
  }

  async function detectFrameCount() {
    // Frames are expected to be sequential: 0001, 0002, 0003, ...
    // Exponential probing + binary search avoids hundreds of requests.
    const MAX_PROBE = 9999;

    let lastGood = 1;
    let firstBad = 2;

    while (firstBad <= MAX_PROBE && await testFrameSource(frameUrl(firstBad))) {
      lastGood = firstBad;
      firstBad *= 2;
    }

    let low = lastGood + 1;
    let high = Math.min(firstBad - 1, MAX_PROBE);

    while (low <= high) {
      const mid = Math.floor((low + high) / 2);
      if (await testFrameSource(frameUrl(mid))) {
        lastGood = mid;
        low = mid + 1;
      } else {
        high = mid - 1;
      }
    }

    return Math.max(1, lastGood);
  }

  function applySequenceScrollDistance() {
    // One viewport for the sticky stage + a frame-scaled scroll runway.
    // Inline style deliberately overrides all old desktop/mobile CSS heights.
    const transitions = Math.max(1, FRAME_COUNT - 1);
    const totalVh = 100 + transitions * SCROLL_DISTANCE_PER_FRAME_VH;
    sequence.style.height = `${totalVh}svh`;
  }

  function trimCache(center) {
    if (cache.size <= MAX_CACHE) return;

    const keep = new Set([1, clamp(Math.round(center), 1, FRAME_COUNT)]);
    const removable = [...cache.keys()]
      .filter((frame) => !keep.has(frame))
      .sort(
        (a, b) =>
          Math.abs(b - center) - Math.abs(a - center)
      );

    while (cache.size > MAX_CACHE && removable.length) {
      cache.delete(removable.shift());
    }
  }

  function loadFrame(n) {
    const frame = clamp(Math.round(n), 1, FRAME_COUNT);

    if (cache.has(frame)) {
      return Promise.resolve(cache.get(frame));
    }

    if (pending.has(frame)) {
      return pending.get(frame);
    }

    const promise = new Promise((resolve) => {
      const img = new Image();
      img.decoding = "async";

      img.onload = () => {
        cache.set(frame, img);
        pending.delete(frame);
        loadedCount += 1;

        if (loaderFill) {
          loaderFill.style.width =
            `${Math.min(100, (loadedCount / Math.max(1, INITIAL_PRELOAD)) * 100)}%`;
        }

        trimCache(targetFrame);

        if (Math.abs(frame - targetFrame) <= 2) {
          requestAnimationFrame(() => drawNearest(targetFrame));
        }

        resolve(img);
      };

      img.onerror = () => {
        pending.delete(frame);
        resolve(null);
      };

      img.src = frameUrl(frame);
    });

    pending.set(frame, promise);
    return promise;
  }

  function preloadAround(frame, radius = 14) {
    const center = clamp(Math.round(frame), 1, FRAME_COUNT);
    for (let i = center - radius; i <= center + radius; i++) {
      if (i >= 1 && i <= FRAME_COUNT) loadFrame(i);
    }
  }

  async function progressivePreload() {
    const priority = [];

    for (let i = 2; i <= Math.min(FRAME_COUNT, INITIAL_PRELOAD); i++) {
      priority.push(i);
    }

    const concurrency = mobile ? 4 : 7;
    let cursor = 0;

    async function worker() {
      while (cursor < priority.length) {
        const n = priority[cursor++];
        await loadFrame(n);
      }
    }

    await Promise.all(
      Array.from({ length: concurrency }, worker)
    );
  }

  function resizeCanvas() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = canvas.getBoundingClientRect();

    canvas.width = Math.max(1, Math.floor(rect.width * dpr));
    canvas.height = Math.max(1, Math.floor(rect.height * dpr));

    drawNearest(currentFrame);
  }

  function drawImageCover(img) {
    if (!img || !img.naturalWidth) return;

    const cw = canvas.width;
    const ch = canvas.height;
    const imageRatio = img.width / img.height;
    const canvasRatio = cw / ch;

    let drawWidth;
    let drawHeight;
    let dx;
    let dy;

    if (imageRatio > canvasRatio) {
      drawHeight = ch;
      drawWidth = drawHeight * imageRatio;
      dx = (cw - drawWidth) / 2;
      dy = 0;
    } else {
      drawWidth = cw;
      drawHeight = drawWidth / imageRatio;
      dx = 0;
      dy = (ch - drawHeight) / 2;
    }

    ctx.fillStyle = "#090504";
    ctx.fillRect(0, 0, cw, ch);
    ctx.drawImage(img, dx, dy, drawWidth, drawHeight);
  }

  function nearestLoaded(n) {
    const frame = clamp(Math.round(n), 1, FRAME_COUNT);

    if (cache.has(frame)) return cache.get(frame);

    for (let distance = 1; distance < 24; distance++) {
      if (cache.has(frame - distance)) return cache.get(frame - distance);
      if (cache.has(frame + distance)) return cache.get(frame + distance);
    }

    return cache.get(1) || null;
  }

  function drawNearest(n) {
    const image = nearestLoaded(n);
    if (image) drawImageCover(image);
  }

  function updateCopy(progress) {
    updateScrollMoments(progress);

    // Keep the legacy fixed copy completely out of the composition.
    if (copy) copy.style.opacity = "0";
  }

  function getSequenceBounds() {
    const top = window.scrollY + sequence.getBoundingClientRect().top;
    const end = top + sequence.offsetHeight - window.innerHeight;
    return { top, end };
  }

  function progressFromPageScroll() {
    const rect = sequence.getBoundingClientRect();
    const totalScrollableDistance = Math.max(1, sequence.offsetHeight - window.innerHeight);
    const pixelsScrolledInsideSequence = clamp(-rect.top, 0, totalScrollableDistance);
    return pixelsScrolledInsideSequence / totalScrollableDistance;
  }

  function setSequenceProgress(progress) {
    const p = clamp(progress, 0, 1);

    // PURE DIRECT MAPPING. No visual lag of any kind.
    currentFrame = 1 + p * (FRAME_COUNT - 1);
    targetFrame = currentFrame;

    preloadAround(currentFrame, mobile ? 10 : 17);
    drawNearest(currentFrame);
    updateCopy(p);
    trimCache(currentFrame);
  }

  function handleManualScroll() {
    if (!ready || reduced) return;
    setSequenceProgress(progressFromPageScroll());
  }


  /* ---------------- INIT ---------------- */

  async function initSequence() {
    resizeCanvas();

    const detectedExtension = await detectFrameExtension();

    if (!detectedExtension) {
      if (fallback) fallback.classList.add("show");
      if (loader) loader.classList.add("is-done");
      return;
    }

    frameExtension = detectedExtension;
    FRAME_COUNT = await detectFrameCount();
    applySequenceScrollDistance();

    // Useful while developing: confirms what the browser actually found.
    console.info(`[Dab Habitz] detected ${FRAME_COUNT} scroll frames (.${frameExtension})`);

    if (fallback) {
      fallback.src = frameUrl(1);
    }

    if (reduced) {
      if (fallback) fallback.classList.add("show");
      if (loader) loader.classList.add("is-done");
      return;
    }

    const first = await loadFrame(1);

    if (!first) {
      if (fallback) fallback.classList.add("show");
      if (loader) loader.classList.add("is-done");
      return;
    }

    drawImageCover(first);
    ready = true;

    if (loaderFill) {
      loaderFill.style.width =
        `${Math.max(8, (loadedCount / Math.max(1, INITIAL_PRELOAD)) * 100)}%`;
    }

    if (loader) {
      setTimeout(() => loader.classList.add("is-done"), 350);
    }

    progressivePreload();
    handleManualScroll();

  }

  window.addEventListener("scroll", handleManualScroll, { passive: true });
  window.addEventListener(
    "resize",
    () => {
      applySequenceScrollDistance();
      resizeCanvas();
      handleManualScroll();
    },
    { passive: true }
  );

  initSequence();

  /* ---------------- ANCHOR HANDOFF ---------------- */

  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", (event) => {
      const href = anchor.getAttribute("href");
      if (!href || href === "#") return;

      const target = document.querySelector(href);
      if (!target) return;

      const bounds = getSequenceBounds();
      const currentY = window.scrollY;
      const targetY = window.scrollY + target.getBoundingClientRect().top;

      const crossesSequence =
        (currentY < bounds.top && targetY > bounds.end) ||
        (currentY > bounds.end && targetY < bounds.top);

      if (!crossesSequence) return;

      event.preventDefault();
      history.replaceState(null, "", href);
      window.scrollTo({ top: targetY, behavior: "auto" });
    });
  });

})();
