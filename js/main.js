(function () {
    'use strict';

    document.documentElement.classList.add('js');

    var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var header = document.querySelector('header');
    var nav = document.getElementById('site-nav');

    function setupNav() {
        if (!header || !nav) return;
        var toggle = document.createElement('button');
        toggle.type = 'button';
        toggle.className = 'nav-toggle';
        toggle.setAttribute('aria-expanded', 'false');
        toggle.setAttribute('aria-controls', 'site-nav');
        toggle.setAttribute('aria-label', 'Toggle navigation menu');
        for (var i = 0; i < 3; i++) toggle.appendChild(document.createElement('span'));
        header.insertBefore(toggle, nav);

        function setOpen(open) {
            nav.classList.toggle('is-open', open);
            toggle.setAttribute('aria-expanded', String(open));
        }

        toggle.addEventListener('click', function () {
            setOpen(!nav.classList.contains('is-open'));
        });
        nav.addEventListener('click', function (e) {
            if (e.target.closest('a')) setOpen(false);
        });
        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape' && nav.classList.contains('is-open')) {
                setOpen(false);
                toggle.focus();
            }
        });
        window.matchMedia('(min-width: 37.5em)').addEventListener('change', function () {
            setOpen(false);
        });
    }

    function markActiveLink() {
        var page = location.pathname.split('/').pop() || 'index.html';
        document.querySelectorAll('header nav a, footer nav a').forEach(function (link) {
            if (link.getAttribute('href') === page) link.setAttribute('aria-current', 'page');
        });
    }

    function setupHeaderShadow() {
        if (!header) return;
        var ticking = false;
        function update() {
            header.classList.toggle('is-scrolled', window.scrollY > 12);
            ticking = false;
        }
        window.addEventListener('scroll', function () {
            if (!ticking) {
                ticking = true;
                window.requestAnimationFrame(update);
            }
        }, { passive: true });
        update();
    }

    function setupReveal() {
        if (reduceMotion || !('IntersectionObserver' in window)) return;
        var targets = document.querySelectorAll('main > section:not(.hero):not(.page-heading)');
        var observer = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-visible');
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.08 });
        targets.forEach(function (section) {
            if (section.getBoundingClientRect().top < window.innerHeight * 0.9) return;
            section.classList.add('reveal');
            observer.observe(section);
        });
    }

    function setupBackToTop() {
        var button = document.createElement('button');
        button.type = 'button';
        button.className = 'back-to-top';
        button.setAttribute('aria-label', 'Back to top');
        button.innerHTML = '&uarr;';
        document.body.appendChild(button);
        button.addEventListener('click', function () {
            window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
        });
        window.addEventListener('scroll', function () {
            button.classList.toggle('is-shown', window.scrollY > 700);
        }, { passive: true });
    }

    function setYear() {
        var year = document.getElementById('year');
        if (year) year.textContent = String(new Date().getFullYear());
    }

    setupNav();
    markActiveLink();
    setupHeaderShadow();
    setupReveal();
    setupBackToTop();
    setYear();
})();
