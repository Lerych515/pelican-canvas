(() => {
  const links = [...document.querySelectorAll('[data-gallery]')];
  const dialog = document.querySelector('.photo-dialog');
  if (!dialog || typeof dialog.showModal !== 'function') return;
  const image = dialog.querySelector('.lightbox-image');
  const caption = dialog.querySelector('.lightbox-caption');
  let current = 0;
  let opener;
  let touchX = null;
  const show = (index) => {
    current = (index + links.length) % links.length;
    const thumbnail = links[current].querySelector('img');
    image.src = links[current].href;
    image.alt = thumbnail.alt;
    caption.textContent = `${current + 1} / ${links.length} · ${thumbnail.alt}`;
  };
  links.forEach((link, index) => {
    link.addEventListener('click', (event) => {
      if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || event.button !== 0) return;
      event.preventDefault();
      opener = link;
      show(index);
      dialog.showModal();
      dialog.querySelector('.lightbox-close').focus();
    });
  });
  dialog.querySelector('.lightbox-close').addEventListener('click', () => dialog.close());
  dialog.querySelector('.lightbox-prev').addEventListener('click', () => show(current - 1));
  dialog.querySelector('.lightbox-next').addEventListener('click', () => show(current + 1));
  dialog.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowRight') { event.preventDefault(); show(current + 1); }
    if (event.key === 'ArrowLeft') { event.preventDefault(); show(current - 1); }
  });
  dialog.addEventListener('click', (event) => {
    if (event.target !== dialog) return;
    const rect = dialog.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
  });
  image.addEventListener('touchstart', (event) => { touchX = event.touches.length === 1 ? event.touches[0].clientX : null; }, { passive: true });
  image.addEventListener('touchend', (event) => {
    if (touchX === null) return;
    const difference = event.changedTouches[0].clientX - touchX;
    if (Math.abs(difference) > 65) show(current + (difference < 0 ? 1 : -1));
    touchX = null;
  }, { passive: true });
  dialog.addEventListener('close', () => { if (opener) opener.focus(); });
})();
