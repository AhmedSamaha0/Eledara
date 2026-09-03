    // Navbar shrink on scroll
    const nav = document.getElementById('mainNav');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 30) nav.classList.add('scrolled');
        else nav.classList.remove('scrolled');
    });

    // Close mobile menu on link click
    document.querySelectorAll('#navMenu .nav-link, #navMenu .btn').forEach(el => {
        el.addEventListener('click', () => {
        const menu = document.getElementById('navMenu');
        if (menu.classList.contains('show')) {
            bootstrap.Collapse.getOrCreateInstance(menu).hide();
        }
        });
    });

    // Scroll reveal
    const revealEls = document.querySelectorAll('.reveal');
    const io = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('in-view');
            io.unobserve(entry.target);
        }
        });
    }, { threshold: 0.12 });
    revealEls.forEach(el => io.observe(el));

    // Contact form placeholder submit
    const form = document.getElementById('contactForm');
    const formMsg = document.getElementById('formMsg');
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        formMsg.style.display = 'block';
        form.reset();
        setTimeout(() => { formMsg.style.display = 'none'; }, 5000);
    });