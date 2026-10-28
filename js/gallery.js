(function ($) {
    'use strict';

    var $links = $('.gallery .lightbox-link');
    if (!$links.length) return;

    var current = 0;
    var lastFocus = null;
    var startX = null;

    var $box = $(
        '<div class="lightbox" role="dialog" aria-modal="true" aria-label="Image viewer" hidden>' +
            '<button type="button" class="lightbox-close" aria-label="Close image viewer">&times;</button>' +
            '<button type="button" class="lightbox-nav lightbox-prev" aria-label="Previous image">&#8249;</button>' +
            '<figure class="lightbox-figure">' +
                '<img class="lightbox-image" alt="">' +
                '<figcaption class="lightbox-caption"></figcaption>' +
            '</figure>' +
            '<button type="button" class="lightbox-nav lightbox-next" aria-label="Next image">&#8250;</button>' +
        '</div>'
    ).appendTo('body');

    var $image = $box.find('.lightbox-image');
    var $caption = $box.find('.lightbox-caption');
    var $close = $box.find('.lightbox-close');

    function show(index) {
        current = (index + $links.length) % $links.length;
        var $link = $links.eq(current);
        var alt = $link.find('img').attr('alt') || '';
        $image.attr({ src: $link.attr('href'), alt: alt });
        $caption.text(alt + ' (' + (current + 1) + ' of ' + $links.length + ')');
        $('<img>').attr('src', $links.eq((current + 1) % $links.length).attr('href'));
    }

    function open(index) {
        lastFocus = document.activeElement;
        show(index);
        $box.removeAttr('hidden');
        $('body').addClass('no-scroll');
        window.requestAnimationFrame(function () {
            $box.addClass('is-open');
            $close.trigger('focus');
        });
    }

    function close() {
        $box.removeClass('is-open');
        $('body').removeClass('no-scroll');
        window.setTimeout(function () {
            $box.attr('hidden', '');
            $image.attr('src', '');
            if (lastFocus) lastFocus.focus();
        }, 220);
    }

    $links.on('click', function (e) {
        e.preventDefault();
        open($links.index(this));
    });

    $box.on('click', function (e) {
        if ($(e.target).is('.lightbox, .lightbox-figure')) close();
    });
    $close.on('click', close);
    $box.find('.lightbox-prev').on('click', function () { show(current - 1); });
    $box.find('.lightbox-next').on('click', function () { show(current + 1); });

    $(document).on('keydown', function (e) {
        if ($box.attr('hidden') !== undefined) return;
        if (e.key === 'Escape') close();
        else if (e.key === 'ArrowLeft') show(current - 1);
        else if (e.key === 'ArrowRight') show(current + 1);
        else if (e.key === 'Tab') {
            var $items = $box.find('button');
            var first = $items.first()[0];
            var last = $items.last()[0];
            if (e.shiftKey && document.activeElement === first) {
                e.preventDefault();
                last.focus();
            } else if (!e.shiftKey && document.activeElement === last) {
                e.preventDefault();
                first.focus();
            }
        }
    });

    $box.on('touchstart', function (e) {
        startX = e.originalEvent.changedTouches[0].clientX;
    });
    $box.on('touchend', function (e) {
        if (startX === null) return;
        var dx = e.originalEvent.changedTouches[0].clientX - startX;
        startX = null;
        if (Math.abs(dx) > 50) show(current + (dx < 0 ? 1 : -1));
    });
})(jQuery);
