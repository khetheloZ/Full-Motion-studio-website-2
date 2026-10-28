(function () {
    'use strict';

    var form = document.getElementById('enquiry-form');
    if (!form || !window.MSForms) return;

    var v = MSForms.validators;
    var pkgSelect = document.getElementById('package');
    var durationSelect = document.getElementById('duration');
    var durationLabel = document.getElementById('duration-label');
    var familyRow = document.getElementById('family-row');
    var family = document.getElementById('family-shoot');
    var dateInput = document.getElementById('preferred-date');
    var people = document.getElementById('num-people');
    var live = document.getElementById('live-estimate');
    var response = document.getElementById('enquiry-response');
    var submitButton = form.querySelector('button[type="submit"]');

    // dates the studio is already booked, as YYYY-MM-DD strings
    var UNAVAILABLE_DATES = [];

    var OPEN_MIN = 7 * 60;
    var CLOSE_MIN = 17 * 60;
    var DEPOSIT_RATE = 0.5;
    var DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    function money(n) {
        return 'R' + String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    }

    function el(tag, text, cls) {
        var node = document.createElement(tag);
        if (text !== undefined) node.textContent = text;
        if (cls) node.className = cls;
        return node;
    }

    function localISO(date) {
        var m = String(date.getMonth() + 1).padStart(2, '0');
        var d = String(date.getDate()).padStart(2, '0');
        return date.getFullYear() + '-' + m + '-' + d;
    }

    function setDateLimits() {
        var today = new Date();
        var limit = new Date(today);
        limit.setFullYear(limit.getFullYear() + 1);
        dateInput.min = localISO(today);
        dateInput.max = localISO(limit);
    }

    function option(value, label) {
        var o = document.createElement('option');
        o.value = value;
        o.textContent = label;
        return o;
    }

    function selected() {
        return pkgSelect.options[pkgSelect.selectedIndex];
    }

    function rebuildDuration() {
        var opt = selected();
        var mode = opt.getAttribute('data-mode');
        var previous = durationSelect.value;
        durationSelect.textContent = '';
        durationSelect.appendChild(option('', 'Select a duration'));

        if (mode === 'venue') {
            durationLabel.textContent = 'Booking length';
            durationSelect.appendChild(option('half', 'Half day (4 hours)'));
            durationSelect.appendChild(option('full', 'Full day (8 hours)'));
        } else {
            durationLabel.textContent = 'Duration';
            for (var h = 1; h <= 8; h++) durationSelect.appendChild(option(String(h), h + (h === 1 ? ' hour' : ' hours')));
        }
        if (Array.prototype.some.call(durationSelect.options, function (o) { return o.value === previous; })) {
            durationSelect.value = previous;
        }
        familyRow.hidden = !opt.hasAttribute('data-extra');
        if (familyRow.hidden) family.checked = false;
    }

    function quote() {
        var opt = selected();
        var mode = opt.getAttribute('data-mode');
        var length = durationSelect.value;
        if (mode === 'none' || !length) return null;

        var lines = [];
        var total = 0;
        if (mode === 'venue') {
            total = parseInt(opt.getAttribute(length === 'full' ? 'data-full' : 'data-half'), 10);
            lines.push([length === 'full' ? 'Full day venue hire (8 hours)' : 'Half day venue hire (4 hours)', total]);
        } else {
            var hours = parseInt(length, 10);
            var rate = parseInt(opt.getAttribute('data-rate'), 10);
            total = rate * hours;
            lines.push([opt.textContent + ': ' + hours + (hours === 1 ? ' hour' : ' hours') + ' at ' + money(rate) + ' per hour', total]);

            var extra = parseInt(opt.getAttribute('data-extra') || '0', 10);
            var count = parseInt(people.value, 10);
            if (extra && count > 1 && !family.checked) {
                var added = extra * (count - 1);
                total += added;
                lines.push([(count - 1) + ' additional ' + (count - 1 === 1 ? 'person' : 'people') + ' at ' + money(extra) + ' each', added]);
            }
        }
        return { lines: lines, total: total, deposit: Math.round(total * DEPOSIT_RATE) };
    }

    function updateLive() {
        var q = quote();
        live.textContent = q ? 'Estimated cost so far: ' + money(q.total) : '';
    }

    function lengthMinutes() {
        var value = durationSelect.value;
        if (value === 'half') return 240;
        if (value === 'full') return 480;
        return value ? parseInt(value, 10) * 60 : 60;
    }

    function clock(minutes) {
        return String(Math.floor(minutes / 60)).padStart(2, '0') + ':' + String(minutes % 60).padStart(2, '0');
    }

    function timeRule(field) {
        var base = v.time(field);
        if (base || !field.value) return base;
        var parts = field.value.split(':');
        var start = parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
        if (start < OPEN_MIN) return 'We open at 07:00. Please choose a start time from 07:00.';
        if (start + lengthMinutes() > CLOSE_MIN) {
            return 'We close at 17:00. For this booking length the latest start time is ' + clock(CLOSE_MIN - lengthMinutes()) + '.';
        }
        return '';
    }

    function availability(dateValue, timeValue) {
        var date = new Date(dateValue + 'T00:00:00');
        var label = DAYS[date.getDay()] + ', ' + date.toLocaleDateString('en-ZA', { day: 'numeric', month: 'long', year: 'numeric' });
        var when = timeValue ? label + ' at ' + timeValue : label;
        if (UNAVAILABLE_DATES.indexOf(dateValue) !== -1) {
            return { ok: false, text: when + ' is already booked. Please choose another date or tell us your flexible dates in the message and we will suggest the closest options.' };
        }
        return { ok: true, text: when + ' is open for a booking request. We are open 07:00 to 17:00, 7 days a week, and will confirm your slot by email once your deposit is received.' };
    }

    function buildPanel(data, q, avail) {
        response.textContent = '';
        response.appendChild(el('h2', 'Thank you, ' + data.name.split(' ')[0]));
        response.appendChild(el('p', 'Here is your instant estimate for the ' + data.packageName + '.'));

        var table = el('table', undefined, 'quote-table');
        q.lines.forEach(function (line) {
            var row = table.insertRow();
            row.insertCell().textContent = line[0];
            row.insertCell().textContent = money(line[1]);
        });
        var totalRow = table.insertRow();
        totalRow.className = 'quote-total';
        totalRow.insertCell().textContent = 'Estimated total';
        totalRow.insertCell().textContent = money(q.total);
        var depositRow = table.insertRow();
        depositRow.insertCell().textContent = '50% deposit to secure your booking';
        depositRow.insertCell().textContent = money(q.deposit);
        response.appendChild(table);

        response.appendChild(el('p', avail.text, avail.ok ? 'availability ok' : 'availability taken'));
        response.appendChild(el('p', 'Full payment is due before the shoot starts. This is an estimate, and the studio will confirm the final price.'));

        var status = el('p', 'Sending your enquiry to the studio\u2026', 'send-status');
        status.id = 'send-status';
        response.appendChild(status);

        var again = el('button', 'Make another enquiry', 'details-button');
        again.type = 'button';
        again.addEventListener('click', function () {
            form.reset();
            rebuildDuration();
            updateLive();
            response.hidden = true;
            form.querySelector('input').focus();
        });
        response.appendChild(again);
        response.hidden = false;
        response.focus();
        response.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
        return status;
    }

    function mailtoFallback(data, q) {
        var body = [
            'Name: ' + data.name, 'Email: ' + data.email, 'Phone: ' + data.phone,
            'Package: ' + data.packageName, 'Duration: ' + durationSelect.options[durationSelect.selectedIndex].textContent,
            'Date: ' + data.date + (data.time ? ' at ' + data.time : ''), 'People: ' + data.people,
            'Estimated total: ' + money(q.total), '', data.message
        ].join('\n');
        return 'mailto:ktzondi63@gmail.com?subject=' + encodeURIComponent('Booking enquiry: ' + data.packageName) + '&body=' + encodeURIComponent(body);
    }

    function send(statusEl, data, q) {
        var endpoint = form.action.replace('formsubmit.co/', 'formsubmit.co/ajax/');
        var payload = new FormData(form);
        payload.append('estimated_total', money(q.total));
        payload.append('deposit_required', money(q.deposit));

        var controller = 'AbortController' in window ? new AbortController() : null;
        var timeout = window.setTimeout(function () { if (controller) controller.abort(); }, 12000);
        submitButton.disabled = true;

        fetch(endpoint, { method: 'POST', body: payload, headers: { Accept: 'application/json' }, signal: controller ? controller.signal : undefined })
            .then(function (res) {
                if (!res.ok) throw new Error('HTTP ' + res.status);
                return res.json();
            })
            .then(function (result) {
                if (String(result.success) !== 'true') throw new Error(result.message || 'not accepted');
                statusEl.textContent = 'Your enquiry has been sent to the studio. We will reply to ' + data.email + '.';
                statusEl.className = 'send-status ok';
            })
            .catch(function () {
                statusEl.textContent = 'We could not send your enquiry automatically. ';
                var link = el('a', 'Email it to us instead', undefined);
                link.href = mailtoFallback(data, q);
                statusEl.appendChild(link);
                statusEl.appendChild(document.createTextNode('.'));
                statusEl.className = 'send-status fail';
            })
            .then(function () {
                window.clearTimeout(timeout);
                submitButton.disabled = false;
            });
    }

    function onValid() {
        var opt = selected();
        var q = quote();
        if (!q) return;
        var data = {
            name: document.getElementById('full-name').value.trim(),
            email: document.getElementById('email').value.trim(),
            phone: document.getElementById('phone').value.trim(),
            packageName: opt.textContent,
            date: dateInput.value,
            time: document.getElementById('preferred-time').value,
            people: people.value,
            message: document.getElementById('message').value.trim()
        };
        var statusEl = buildPanel(data, q, availability(data.date, data.time));
        send(statusEl, data, q);
    }

    MSForms.attach(form, {
        'full-name': v.name,
        'email': v.email,
        'phone': v.phone(false),
        'package': v.select('Please choose a package.'),
        'duration': v.select('Please choose how long you need.'),
        'preferred-date': v.date,
        'preferred-time': timeRule,
        'num-people': v.people,
        'message': v.length(10, 1000, 'message', true),
        'consent': v.required('Please tick the box so we can respond to your enquiry.')
    }, onValid);

    var timeInput = document.getElementById('preferred-time');
    function recheckTime() { if (timeInput.value) MSForms.check(timeInput, timeRule); }

    pkgSelect.addEventListener('change', function () { rebuildDuration(); updateLive(); recheckTime(); });
    durationSelect.addEventListener('change', recheckTime);
    [durationSelect, people, family].forEach(function (f) { f.addEventListener('input', updateLive); f.addEventListener('change', updateLive); });

    setDateLimits();
    var wanted = new URLSearchParams(location.search).get('package');
    if (wanted && Array.prototype.some.call(pkgSelect.options, function (o) { return o.value === wanted; })) pkgSelect.value = wanted;
    rebuildDuration();
    updateLive();
})();
