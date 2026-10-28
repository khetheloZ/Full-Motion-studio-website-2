(function () {
    'use strict';

    var canvas = document.getElementById('map-canvas');
    var buttonBox = document.getElementById('map-locations');
    if (!canvas || !buttonBox || typeof L === 'undefined') return;

    var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var map = null;
    var markers = {};

    function el(tag, text, cls) {
        var node = document.createElement(tag);
        if (text !== undefined) node.textContent = text;
        if (cls) node.className = cls;
        return node;
    }

    function popupFor(place) {
        var box = el('div');
        box.appendChild(el('strong', place.name));
        box.appendChild(el('br'));
        box.appendChild(document.createTextNode(place.address));
        box.appendChild(el('br'));
        var link = el('a', 'Get directions');
        link.href = 'https://www.google.com/maps/dir/?api=1&destination=' + encodeURIComponent(place.address);
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        box.appendChild(link);
        return box;
    }

    function focusPlace(id) {
        var marker = markers[id];
        if (!marker) return;
        var target = marker.getLatLng();
        if (reduceMotion) map.setView(target, 15);
        else map.flyTo(target, 15, { duration: 0.8 });
        marker.openPopup();
        buttonBox.querySelectorAll('button').forEach(function (b) {
            b.setAttribute('aria-pressed', String(b.getAttribute('data-id') === id));
        });
    }

    function init(places) {
        L.Icon.Default.imagePath = 'vendor/leaflet/images/';
        map = L.map(canvas, { scrollWheelZoom: false });
        var tiles = L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
            subdomains: 'abcd',
            maxZoom: 20,
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions" target="_blank" rel="noopener noreferrer">CARTO</a>'
        }).addTo(map);

        var tileErrors = 0;
        tiles.on('tileerror', function () {
            tileErrors += 1;
            if (tileErrors !== 6 || document.getElementById('map-fallback')) return;
            var note = el('p', 'The map background is not loading right now. ', 'map-credit');
            note.id = 'map-fallback';
            var link = el('a', 'Open the studio in Google Maps');
            link.href = 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent('39 Station Drive, Durban');
            link.target = '_blank';
            link.rel = 'noopener noreferrer';
            note.appendChild(link);
            canvas.insertAdjacentElement('afterend', note);
        });

        var bounds = [];
        places.forEach(function (place) {
            var marker = L.marker([place.lat, place.lng], { title: place.name, alt: place.name }).addTo(map);
            marker.bindPopup(popupFor(place));
            markers[place.id] = marker;
            bounds.push([place.lat, place.lng]);

            var button = el('button', place.address, 'details-button');
            button.type = 'button';
            button.setAttribute('data-id', place.id);
            button.setAttribute('aria-pressed', 'false');
            button.addEventListener('click', function () { focusPlace(place.id); });
            buttonBox.appendChild(button);
        });

        map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });

        map.on('focus', function () { map.scrollWheelZoom.enable(); });
        map.on('blur', function () { map.scrollWheelZoom.disable(); });
    }

    function start() {
        fetch('data/locations.json', { headers: { Accept: 'application/json' } })
            .then(function (r) {
                if (!r.ok) throw new Error('HTTP ' + r.status);
                return r.json();
            })
            .catch(function () {
                if (window.MS_DATA && window.MS_DATA.locations) return window.MS_DATA.locations;
                throw new Error('no data');
            })
            .then(function (data) { init(data.locations); })
            .catch(function () {
                canvas.appendChild(el('p', 'The map could not load. Our studio is at 39 Station Drive, Durban.', 'map-error'));
            });
    }

    if ('IntersectionObserver' in window) {
        var observer = new IntersectionObserver(function (entries) {
            if (entries[0].isIntersecting) {
                observer.disconnect();
                start();
            }
        }, { rootMargin: '300px' });
        observer.observe(canvas);
    } else {
        start();
    }
})();
