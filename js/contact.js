(function () {
    'use strict';

    var form = document.getElementById('contact-form');
    if (!form || !window.MSForms) return;

    var v = MSForms.validators;
    var preview = document.getElementById('email-preview');
    var message = document.getElementById('contact-message');
    var counter = document.getElementById('contact-count');
    var recipient = form.getAttribute('data-recipient');
    var MAX = 1000;

    function el(tag, text, cls) {
        var node = document.createElement(tag);
        if (text !== undefined) node.textContent = text;
        if (cls) node.className = cls;
        return node;
    }

    function updateCount() {
        var len = message.value.length;
        counter.textContent = len + ' / ' + MAX;
        counter.classList.toggle('is-near', len > MAX * 0.9);
    }

    function compose() {
        var name = document.getElementById('contact-name').value.trim();
        var email = document.getElementById('contact-email').value.trim();
        var phone = document.getElementById('contact-phone').value.trim();
        var type = document.getElementById('contact-type').value;
        var lines = [
            'Hello Motion Studio,', '',
            message.value.trim(), '',
            'Message type: ' + type,
            'Name: ' + name,
            'Email: ' + email
        ];
        if (phone) lines.push('Phone: ' + phone);
        return {
            to: recipient,
            subject: type + ' from ' + name + ' (website contact form)',
            body: lines.join('\n')
        };
    }

    function copyText(text, button) {
        function done(ok) {
            button.textContent = ok ? 'Copied' : 'Copy failed, select the text manually';
            window.setTimeout(function () { button.textContent = 'Copy email text'; }, 2200);
        }
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text).then(function () { done(true); }, function () { done(false); });
        } else {
            done(false);
        }
    }

    function showPreview() {
        var mail = compose();
        preview.textContent = '';
        preview.appendChild(el('h2', 'Your email is ready'));
        preview.appendChild(el('p', 'Check the details below, then send the email from your own email app.'));

        var box = el('div', undefined, 'email-box');
        box.appendChild(el('p', 'To: ' + mail.to));
        box.appendChild(el('p', 'Subject: ' + mail.subject));
        box.appendChild(el('pre', mail.body));
        preview.appendChild(box);

        var actions = el('div', undefined, 'package-actions');
        var send = el('a', 'Open in my email app', 'cta-button');
        send.href = 'mailto:' + mail.to + '?subject=' + encodeURIComponent(mail.subject) + '&body=' + encodeURIComponent(mail.body);
        var copy = el('button', 'Copy email text', 'details-button');
        copy.type = 'button';
        copy.addEventListener('click', function () {
            copyText('To: ' + mail.to + '\nSubject: ' + mail.subject + '\n\n' + mail.body, copy);
        });
        var edit = el('button', 'Edit message', 'details-button');
        edit.type = 'button';
        edit.addEventListener('click', function () {
            preview.hidden = true;
            document.getElementById('contact-name').focus();
        });
        actions.appendChild(send);
        actions.appendChild(copy);
        actions.appendChild(edit);
        preview.appendChild(actions);

        preview.hidden = false;
        preview.focus();
        preview.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
    }

    MSForms.attach(form, {
        'contact-name': v.name,
        'contact-email': v.email,
        'contact-phone': v.phone(true),
        'contact-type': v.select('Please choose a message type.'),
        'contact-message': v.length(20, MAX, 'message')
    }, showPreview);

    message.addEventListener('input', updateCount);
    updateCount();
})();
