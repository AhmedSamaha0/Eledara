(() => {
  const imageNames = window.EledaraGalleryImages;
  const gallery = document.querySelector('.program-gallery');
  const stage = document.querySelector('.gallery-stage');
  const cards = document.querySelector('.gallery-cards');
  const previous = document.querySelector('.gallery-previous');
  const next = document.querySelector('.gallery-next');
  const autoplayDelay = 2700;
  const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');

  if (!Array.isArray(imageNames) || !gallery || !stage || !cards || !previous || !next) {
    throw new Error('The program gallery is missing its image list or required elements.');
  }

  if (imageNames.length === 0) return;

  const imageUrl = (index) => `program%20photos/${encodeURIComponent(imageNames[index])}`;
  const preloadCache = new Map();
  let currentIndex = 0;
  let isTransitioning = false;
  let isHovered = false;
  let isFocused = false;
  let isDragging = false;
  let pointerStartX = 0;
  let pointerStartY = 0;
  let autoplayTimer;
  let transitionTimer;

  const getIndex = (index) => (index + imageNames.length) % imageNames.length;

  const createCard = (index, position) => {
    const card = document.createElement('figure');
    const image = document.createElement('img');
    card.className = `gallery-card is-${position}`;
    card.dataset.index = String(index);
    card.setAttribute('aria-hidden', position === 'center' ? 'false' : 'true');
    image.addEventListener('error', () => {
      console.error(`Failed to load gallery image: ${image.src}`);
    }, { once: true });
    image.src = imageUrl(index);
    image.alt = position === 'center' ? 'لقطة من برنامج Eledara' : '';
    image.decoding = 'async';
    image.loading = 'eager';
    card.append(image);
    return card;
  };

  const preload = (index) => {
    if (preloadCache.has(index)) return;
    const image = new Image();
    image.src = imageUrl(index);
    preloadCache.set(index, image);
    while (preloadCache.size > 2) {
      preloadCache.delete(preloadCache.keys().next().value);
    }
  };

  const preloadNeighbors = () => {
    preload(getIndex(currentIndex + 2));
    preload(getIndex(currentIndex - 2));
  };

  const updateAccessibleCard = () => {
    cards.querySelectorAll('.gallery-card').forEach((card) => {
      const isCenter = card.classList.contains('is-center');
      card.setAttribute('aria-hidden', String(!isCenter));
      card.querySelector('img').alt = isCenter ? 'لقطة من برنامج Eledara' : '';
    });
  };

  cards.append(
    createCard(getIndex(currentIndex - 1), 'left'),
    createCard(currentIndex, 'center'),
    createCard(getIndex(currentIndex + 1), 'right')
  );
  preloadNeighbors();

  const clearAutoplay = () => {
    window.clearTimeout(autoplayTimer);
    autoplayTimer = undefined;
  };

  const scheduleAutoplay = () => {
    clearAutoplay();
    if (
      motionPreference.matches || document.hidden || isHovered || isFocused ||
      isDragging || isTransitioning || imageNames.length < 2
    ) return;
    autoplayTimer = window.setTimeout(() => transition(1), autoplayDelay);
  };

  const finishTransition = () => {
    if (!isTransitioning) return;
    window.clearTimeout(transitionTimer);
    const exitingCard = cards.querySelector('.is-exiting-left, .is-exiting-right');
    if (exitingCard) exitingCard.remove();
    currentIndex = Number(cards.querySelector('.is-center').dataset.index);
    isTransitioning = false;
    previous.disabled = false;
    next.disabled = false;
    updateAccessibleCard();
    preloadNeighbors();
    scheduleAutoplay();
  };

  function transition(direction) {
    if (isTransitioning || imageNames.length < 2) return;
    clearAutoplay();
    isTransitioning = true;
    previous.disabled = true;
    next.disabled = true;

    const enteringIndex = getIndex(currentIndex + direction * 2);
    const enteringPosition = direction > 0 ? 'entering-right' : 'entering-left';
    const enteringCard = createCard(enteringIndex, enteringPosition);
    cards.append(enteringCard);

    requestAnimationFrame(() => {
      enteringCard.getBoundingClientRect();
      if (direction > 0) {
        cards.querySelector('.is-left').className = 'gallery-card is-exiting-left';
        cards.querySelector('.is-center').className = 'gallery-card is-left';
        cards.querySelector('.is-right').className = 'gallery-card is-center';
        enteringCard.className = 'gallery-card is-right';
      } else {
        cards.querySelector('.is-right').className = 'gallery-card is-exiting-right';
        cards.querySelector('.is-center').className = 'gallery-card is-right';
        cards.querySelector('.is-left').className = 'gallery-card is-center';
        enteringCard.className = 'gallery-card is-left';
      }

      enteringCard.addEventListener('transitionend', (event) => {
        if (event.target === enteringCard && event.propertyName === 'transform') {
          finishTransition();
        }
      }, { once: true });
      transitionTimer = window.setTimeout(finishTransition, motionPreference.matches ? 50 : 1200);
    });
  }

  previous.addEventListener('click', () => transition(-1));
  next.addEventListener('click', () => transition(1));

  stage.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      transition(-1);
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      transition(1);
    }
  });

  stage.addEventListener('pointerdown', (event) => {
    if (event.button !== 0 || event.target.closest('.gallery-control')) return;
    isDragging = true;
    pointerStartX = event.clientX;
    pointerStartY = event.clientY;
    gallery.classList.add('is-dragging');
    stage.setPointerCapture(event.pointerId);
    clearAutoplay();
  });

  stage.addEventListener('pointermove', (event) => {
    if (!isDragging) return;
    const deltaX = event.clientX - pointerStartX;
    if (Math.abs(deltaX) > Math.abs(event.clientY - pointerStartY)) {
      gallery.style.setProperty('--drag-x', `${deltaX * 0.16}px`);
    }
  });

  const endDrag = (event) => {
    if (!isDragging) return;
    const deltaX = event.clientX - pointerStartX;
    const threshold = Math.max(42, stage.clientWidth * 0.08);
    isDragging = false;
    gallery.classList.remove('is-dragging');
    gallery.style.removeProperty('--drag-x');
    if (stage.hasPointerCapture(event.pointerId)) stage.releasePointerCapture(event.pointerId);

    if (Math.abs(deltaX) >= threshold) {
      transition(deltaX < 0 ? 1 : -1);
    } else {
      scheduleAutoplay();
    }
  };

  stage.addEventListener('pointerup', endDrag);
  stage.addEventListener('pointercancel', endDrag);
  stage.addEventListener('lostpointercapture', () => {
    if (!isDragging) return;
    isDragging = false;
    gallery.classList.remove('is-dragging');
    gallery.style.removeProperty('--drag-x');
    scheduleAutoplay();
  });

  gallery.addEventListener('pointerenter', () => {
    isHovered = true;
    clearAutoplay();
  });
  gallery.addEventListener('pointerleave', () => {
    isHovered = false;
    scheduleAutoplay();
  });
  gallery.addEventListener('focusin', () => {
    isFocused = true;
    clearAutoplay();
  });
  gallery.addEventListener('focusout', (event) => {
    if (!gallery.contains(event.relatedTarget)) {
      isFocused = false;
      scheduleAutoplay();
    }
  });
  document.addEventListener('visibilitychange', scheduleAutoplay);
  motionPreference.addEventListener('change', scheduleAutoplay);

  scheduleAutoplay();
})();
