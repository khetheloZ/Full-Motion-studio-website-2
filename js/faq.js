(function ($) {
    'use strict';

    var $items = $('.faq-item');
    if (!$items.length) return;

    $('.faq-list').on('click', '.faq-question', function () {
        var $item = $(this).closest('.faq-item');
        var willOpen = !$item.hasClass('is-open');

        $items.not($item).removeClass('is-open').find('.faq-question').attr('aria-expanded', 'false');
        $item.toggleClass('is-open', willOpen);
        $(this).attr('aria-expanded', String(willOpen));
    });
})(jQuery);
