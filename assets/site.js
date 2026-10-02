
(() => {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) entry.target.classList.add('in-view');
    });
  }, { threshold: 0.16 });
  document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

  const toggle = document.querySelector('.nav-toggle');
  const links = document.querySelector('.nav-links');
  if (toggle && links) {
    toggle.addEventListener('click', () => links.classList.toggle('open'));
    links.querySelectorAll('a').forEach(a => a.addEventListener('click', () => links.classList.remove('open')));
  }

  const visual = document.querySelector('[data-parallax] img');
  if (visual) {
    const run = () => {
      const rect = visual.parentElement.getBoundingClientRect();
      const amount = Math.max(-12, Math.min(12, rect.top * -0.035));
      visual.style.transform = `scale(1.03) translateY(${amount}px)`;
    };
    run();
    addEventListener('scroll', run, { passive: true });
    addEventListener('resize', run);
  }
})();
