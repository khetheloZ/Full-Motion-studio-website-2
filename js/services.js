(function () {
    'use strict';

    var list = document.getElementById('package-list');
    var tabsBox = document.getElementById('package-tabs');
    var searchInput = document.getElementById('package-search');
    var sortSelect = document.getElementById('package-sort');
    var countEl = document.getElementById('result-count');
    if (!list || !tabsBox) return;

    var state = { packages: [], categories: [], query: '', category: 'all', sort: 'featured' };
    var dialog = null;

    function el(tag, attrs, children) {
        var node = document.createElement(tag);
        Object.keys(attrs || {}).forEach(function (key) {
            if (key === 'text') node.textContent = attrs[key];
            else if (key === 'class') node.className = attrs[key];
            else node.setAttribute(key, attrs[key]);
        });
        (children || []).forEach(function (child) { node.appendChild(child); });
        return node;
    }

    function labelled(label, value) {
        return el('p', {}, [el('strong', { text: label + ' ' }), document.createTextNode(value)]);
    }

    function categoryLabel(id) {
        var match = state.categories.filter(function (c) { return c.id === id; })[0];
        return match ? match.label : id;
    }

    function matches(pkg) {
        if (state.category !== 'all' && pkg.category !== state.category) return false;
        if (!state.query) return true;
        var haystack = [pkg.name, pkg.blurb, pkg.price, pkg.duration, categoryLabel(pkg.category)]
            .concat(pkg.includes).join(' ').toLowerCase();
        return state.query.toLowerCase().split(/\s+/).every(function (word) {
            return haystack.indexOf(word) !== -1;
        });
    }

    function sorted(items) {
        var copy = items.slice();
        if (state.sort === 'price-asc') copy.sort(function (a, b) { return a.priceFrom - b.priceFrom; });
        else if (state.sort === 'price-desc') copy.sort(function (a, b) { return b.priceFrom - a.priceFrom; });
        else if (state.sort === 'name-asc') copy.sort(function (a, b) { return a.name.localeCompare(b.name); });
        return copy;
    }

    function card(pkg) {
        var actions = el('div', { class: 'package-actions' }, [
            el('button', { type: 'button', class: 'details-button', 'data-id': pkg.id, text: 'View details' }),
            el('a', { href: 'enquiry.html?package=' + encodeURIComponent(pkg.id), class: 'cta-button', text: 'Enquire' })
        ]);
        return el('article', { class: 'package-card', id: pkg.id }, [
            el('h2', { text: pkg.name }),
            el('p', { class: 'package-blurb', text: pkg.blurb }),
            labelled('Price:', pkg.price),
            labelled('Duration:', pkg.duration),
            actions
        ]);
    }

    function render() {
        var visible = sorted(state.packages.filter(matches));
        list.querySelectorAll('.package-card, .empty-state, .loading-note, .error-state').forEach(function (n) { n.remove(); });

        if (!visible.length) {
            var clear = el('button', { type: 'button', class: 'details-button', text: 'Clear search and filters' });
            clear.addEventListener('click', resetFilters);
            list.appendChild(el('div', { class: 'empty-state' }, [
                el('p', { text: 'No packages match your search.' }), clear
            ]));
        } else {
            var frag = document.createDocumentFragment();
            visible.forEach(function (pkg) { frag.appendChild(card(pkg)); });
            list.appendChild(frag);
        }
        countEl.textContent = 'Showing ' + visible.length + ' of ' + state.packages.length + ' packages';
    }

    function resetFilters() {
        state.query = '';
        state.category = 'all';
        state.sort = 'featured';
        searchInput.value = '';
        sortSelect.value = 'featured';
        buildTabs();
        render();
    }

    function buildTabs() {
        tabsBox.textContent = '';
        state.categories.forEach(function (cat) {
            var selected = cat.id === state.category;
            tabsBox.appendChild(el('button', {
                type: 'button', role: 'tab', id: 'tab-' + cat.id, 'data-category': cat.id,
                'aria-selected': String(selected), tabindex: selected ? '0' : '-1',
                'aria-controls': 'package-list', text: cat.label
            }));
        });
        list.setAttribute('aria-labelledby', 'tab-' + state.category);
    }

    function selectTab(id) {
        state.category = id;
        buildTabs();
        render();
        var active = document.getElementById('tab-' + id);
        if (active) active.focus();
    }

    tabsBox.addEventListener('click', function (e) {
        var tab = e.target.closest('[role="tab"]');
        if (tab) selectTab(tab.getAttribute('data-category'));
    });

    tabsBox.addEventListener('keydown', function (e) {
        var ids = state.categories.map(function (c) { return c.id; });
        var index = ids.indexOf(state.category);
        if (e.key === 'ArrowRight') index = (index + 1) % ids.length;
        else if (e.key === 'ArrowLeft') index = (index - 1 + ids.length) % ids.length;
        else if (e.key === 'Home') index = 0;
        else if (e.key === 'End') index = ids.length - 1;
        else return;
        e.preventDefault();
        selectTab(ids[index]);
    });

    var timer = null;
    searchInput.addEventListener('input', function () {
        window.clearTimeout(timer);
        timer = window.setTimeout(function () {
            state.query = searchInput.value.trim().slice(0, 60);
            render();
        }, 150);
    });

    sortSelect.addEventListener('change', function () {
        state.sort = sortSelect.value;
        render();
    });

    function buildDialog() {
        dialog = el('dialog', { class: 'package-dialog', 'aria-labelledby': 'dialog-title' });
        document.body.appendChild(dialog);
        dialog.addEventListener('click', function (e) {
            if (e.target === dialog) dialog.close();
        });
    }

    function openDetails(id) {
        var pkg = state.packages.filter(function (p) { return p.id === id; })[0];
        if (!pkg) return;
        if (!dialog) buildDialog();
        dialog.textContent = '';

        var close = el('button', { type: 'button', class: 'dialog-close', 'aria-label': 'Close details', text: '\u00d7' });
        close.addEventListener('click', function () { dialog.close(); });

        var includes = el('ul', { class: 'dialog-includes' }, pkg.includes.map(function (item) {
            return el('li', { text: item });
        }));

        dialog.appendChild(close);
        dialog.appendChild(el('p', { class: 'dialog-category', text: categoryLabel(pkg.category) }));
        dialog.appendChild(el('h2', { id: 'dialog-title', text: pkg.name }));
        dialog.appendChild(el('p', { text: pkg.blurb }));
        dialog.appendChild(el('h3', { text: 'What is included' }));
        dialog.appendChild(includes);
        dialog.appendChild(labelled('Price:', pkg.price));
        dialog.appendChild(labelled('Duration:', pkg.duration));
        dialog.appendChild(el('a', { href: 'enquiry.html?package=' + encodeURIComponent(pkg.id), class: 'cta-button', text: 'Enquire about this package' }));
        dialog.showModal();
    }

    list.addEventListener('click', function (e) {
        var button = e.target.closest('.details-button[data-id]');
        if (button) openDetails(button.getAttribute('data-id'));
    });

    function scrollToHash() {
        var id = decodeURIComponent(location.hash.slice(1));
        var target = id && document.getElementById(id);
        if (!target || !target.classList.contains('package-card')) return;
        target.scrollIntoView({ block: 'center' });
        target.classList.add('is-highlighted');
        window.setTimeout(function () { target.classList.remove('is-highlighted'); }, 2200);
    }

    window.addEventListener('hashchange', scrollToHash);

    function showError(message) {
        list.querySelectorAll('.loading-note').forEach(function (n) { n.remove(); });
        var retry = el('button', { type: 'button', class: 'details-button', text: 'Try again' });
        retry.addEventListener('click', load);
        list.appendChild(el('div', { class: 'error-state' }, [el('p', { text: message }), retry]));
        countEl.textContent = '';
    }

    function load() {
        list.querySelectorAll('.error-state').forEach(function (n) { n.remove(); });
        list.appendChild(el('p', { class: 'loading-note', text: 'Loading packages\u2026' }));
        fetch('data/packages.json', { headers: { Accept: 'application/json' } })
            .then(function (response) {
                if (!response.ok) throw new Error('HTTP ' + response.status);
                return response.json();
            })
            .catch(function () {
                if (window.MS_DATA && window.MS_DATA.packages) return window.MS_DATA.packages;
                throw new Error('no data');
            })
            .then(function (data) {
                state.packages = data.packages;
                state.categories = data.categories;
                buildTabs();
                render();
                scrollToHash();
            })
            .catch(function () {
                showError('We could not load the packages right now. Please check your connection and try again, or send us an enquiry.');
            });
    }

    load();
})();
