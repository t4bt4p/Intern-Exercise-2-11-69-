feather.replace();

document.querySelectorAll('.menu-slider').forEach(slider => {
    const track = slider.querySelector('.menu-track');
    const dots = slider.querySelector('.slider-dots');
    const cards = [...track.querySelectorAll('.slider-menu')];
    const behavior = () => matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';
    let positions = [];
    let drag = null;
    function updateDots() {
        let active = 0;
        positions.forEach((position, index) => {
            if (Math.abs(position - track.scrollLeft) < Math.abs(positions[active] - track.scrollLeft)) active = index;
        });
        [...dots.children].forEach((dot, index) => {
            dot.setAttribute('aria-current', String(index === active));
        });
    }
    function rebuildDots() {
        const maximum = Math.max(0, track.scrollWidth - track.clientWidth);
        const step = cards[0].getBoundingClientRect().width + (parseFloat(getComputedStyle(track).columnGap) || 0);
        positions = [0];
        for (let position = step; position < maximum - 1; position += step) positions.push(position);
        if (maximum > 1) positions.push(maximum);
        // Re-align after rotating or resizing, so cards are not left half visible.
        const nearest = positions.reduce((best, position) =>
            Math.abs(position - track.scrollLeft) < Math.abs(best - track.scrollLeft) ? position : best, 0);
        track.scrollTo({ left: nearest, behavior: 'instant' });
        dots.replaceChildren();
        positions.forEach((position, index) => {
            const dot = document.createElement('button');
            dot.type = 'button';
            dot.className = 'slider-dot';
            dot.setAttribute('aria-label', `ตำแหน่งที่ ${index + 1} จาก ${positions.length}`);
            dot.setAttribute('aria-controls', track.id);
            dot.addEventListener('click', () => track.scrollTo({ left: position, behavior: behavior() }));
            dots.append(dot);
        });
        updateDots();
    }
    // Touch uses the browser's native swipe; mouse uses pointer capture.
    track.addEventListener('pointerdown', event => {
        if (event.pointerType !== 'mouse' || event.button !== 0) return;
        drag = { id: event.pointerId, x: event.clientX, scroll: track.scrollLeft };
        track.setPointerCapture(event.pointerId);
        track.classList.add('is-dragging');
        event.preventDefault();
    });
    track.addEventListener('pointermove', event => {
        if (!drag || drag.id !== event.pointerId) return;
        track.scrollLeft = drag.scroll - (event.clientX - drag.x);
    });
    function finishDrag(event) {
        if (!drag || drag.id !== event.pointerId) return;
        drag = null;
        const nearest = positions.reduce((best, position) =>
            Math.abs(position - track.scrollLeft) < Math.abs(best - track.scrollLeft) ? position : best, 0);
        track.classList.remove('is-dragging');
        if (track.hasPointerCapture(event.pointerId)) track.releasePointerCapture(event.pointerId);
        track.scrollTo({ left: nearest, behavior: behavior() });
    }
    track.addEventListener('pointerup', finishDrag);
    track.addEventListener('pointercancel', finishDrag);
    track.addEventListener('lostpointercapture', finishDrag);
    track.addEventListener('dragstart', event => event.preventDefault());
    track.addEventListener('scroll', updateDots, { passive: true });
    track.addEventListener('keydown', event => {
        if (!['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
        event.preventDefault();
        const step = cards[0].getBoundingClientRect().width + (parseFloat(getComputedStyle(track).columnGap) || 0);
        track.scrollBy({ left: step * (event.key === 'ArrowRight' ? 1 : -1), behavior: behavior() });
    });
    new ResizeObserver(rebuildDots).observe(track);
    rebuildDots();
});
