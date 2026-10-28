(function () {
    'use strict';

    var v = {};

    v.required = function (message) {
        return function (field) {
            if (field.type === 'checkbox') return field.checked ? '' : message;
            return field.value.trim() ? '' : message;
        };
    };

    v.name = function (field) {
        var value = field.value.trim();
        if (!value) return 'Please enter your full name.';
        if (value.length < 2) return 'Your name must be at least 2 characters.';
        if (!/^[\p{L}][\p{L}\s'.\-]{1,59}$/u.test(value)) return 'Use letters, spaces, hyphens or apostrophes only.';
        return '';
    };

    v.email = function (field) {
        var value = field.value.trim();
        if (!value) return 'Please enter your email address.';
        if (value.length > 120 || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value)) return 'Enter a valid email address, like name@example.com.';
        return '';
    };

    v.phone = function (optional) {
        return function (field) {
            var value = field.value.trim();
            if (!value) return optional ? '' : 'Please enter your phone number.';
            var digits = value.replace(/[\s\-()]/g, '');
            if (!/^(\+27|0027|0)[1-9]\d{8}$/.test(digits)) return 'Enter a South African number like 075 400 7473 or +27 75 400 7473.';
            return '';
        };
    };

    v.select = function (message) {
        return function (field) { return field.value ? '' : message; };
    };

    v.date = function (field) {
        if (!field.value) return 'Please choose your preferred date.';
        var chosen = new Date(field.value + 'T00:00:00');
        if (isNaN(chosen.getTime())) return 'Enter a valid date.';
        var today = new Date();
        today.setHours(0, 0, 0, 0);
        var limit = new Date(today);
        limit.setFullYear(limit.getFullYear() + 1);
        if (chosen < today) return 'The date cannot be in the past.';
        if (chosen > limit) return 'Please choose a date within the next 12 months.';
        return '';
    };

    v.time = function (field) {
        if (!field.value) return '';
        return /^([01]\d|2[0-3]):[0-5]\d$/.test(field.value) ? '' : 'Enter a valid time, like 14:30.';
    };

    v.people = function (field) {
        var value = field.value.trim();
        if (!value) return 'Please enter the number of people.';
        if (!/^\d+$/.test(value)) return 'Use whole numbers only.';
        var n = parseInt(value, 10);
        if (n < 1 || n > 30) return 'Enter a number between 1 and 30.';
        return '';
    };

    v.length = function (min, max, label, optional) {
        return function (field) {
            var len = field.value.trim().length;
            if (!len) return optional ? '' : 'Please enter your ' + label + '.';
            if (len < min) return 'Your ' + label + ' must be at least ' + min + ' characters (currently ' + len + ').';
            if (len > max) return 'Your ' + label + ' must be ' + max + ' characters or fewer.';
            return '';
        };
    };

    function errorBox(field) {
        var id = field.id + '-error';
        var box = document.getElementById(id);
        if (!box) {
            box = document.createElement('p');
            box.id = id;
            box.className = 'field-error';
            var anchor = field.closest('.check-row') || field;
            anchor.insertAdjacentElement('afterend', box);
            field.setAttribute('aria-describedby', id);
        }
        return box;
    }

    function check(field, rule) {
        var message = rule(field);
        var box = errorBox(field);
        box.textContent = message;
        field.setAttribute('aria-invalid', message ? 'true' : 'false');
        field.classList.toggle('is-invalid', Boolean(message));
        return message;
    }

    function attach(form, rules, onValid) {
        var status = form.querySelector('.form-status');
        var attempted = false;

        form.setAttribute('novalidate', '');

        Object.keys(rules).forEach(function (id) {
            var field = document.getElementById(id);
            if (!field) return;
            var run = function () { if (attempted) check(field, rules[id]); };
            field.addEventListener('blur', run);
            field.addEventListener('input', run);
            field.addEventListener('change', run);
        });

        form.addEventListener('submit', function (e) {
            e.preventDefault();
            attempted = true;

            var honeypot = form.querySelector('.hp-field input');
            if (honeypot && honeypot.value) return;

            var firstInvalid = null;
            var problems = 0;
            Object.keys(rules).forEach(function (id) {
                var field = document.getElementById(id);
                if (!field || field.closest('[hidden]')) return;
                if (check(field, rules[id])) {
                    problems += 1;
                    if (!firstInvalid) firstInvalid = field;
                }
            });

            if (firstInvalid) {
                if (status) status.textContent = 'Please fix ' + problems + (problems === 1 ? ' field' : ' fields') + ' highlighted below and try again.';
                firstInvalid.focus();
                return;
            }
            if (status) status.textContent = '';
            onValid();
        });

        form.addEventListener('reset', function () {
            attempted = false;
            form.querySelectorAll('.field-error').forEach(function (box) { box.textContent = ''; });
            form.querySelectorAll('[aria-invalid]').forEach(function (f) {
                f.setAttribute('aria-invalid', 'false');
                f.classList.remove('is-invalid');
            });
            if (status) status.textContent = '';
        });
    }

    window.MSForms = { validators: v, attach: attach, check: check };
})();
