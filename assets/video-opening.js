(() => {
  "use strict";

  const film = document.getElementById("openingFilm");
  if (!film) return;

  film.muted = true;
  film.defaultMuted = true;
  film.playsInline = true;

  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (reduced) {
    film.pause();
    return;
  }

  const tryPlay = () => film.play().catch(() => {});
  if (film.readyState >= 2) tryPlay();
  else film.addEventListener("canplay", tryPlay, { once: true });

  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver((entries) => {
      const visible = entries[0]?.isIntersecting && entries[0].intersectionRatio > 0.12;
      if (visible) tryPlay();
      else film.pause();
    }, { threshold: [0, .12, .5] });

    observer.observe(film);
  }
})();
