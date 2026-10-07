/* Contact actions are intent events. Opening a draft is not a submitted lead. */
(function () {
  'use strict';
  var serviceNames = {
    'marine-upholstery': 'Marine upholstery / seating',
    'boat-covers': 'Custom boat covers',
    'boat-shades': 'Boat shades',
    'yacht-interiors': 'Yacht interior upholstery',
    'other-marine': 'Other marine canvas'
  };

  function track(name, extra) {
    if (typeof window.gtag !== 'function') return;
    window.gtag('event', name, Object.assign({
      page_path: window.location.pathname,
      transport_type: 'beacon'
    }, extra || {}));
  }

  document.addEventListener('click', function (event) {
    var link = event.target.closest && event.target.closest('a');
    if (!link) return;
    var href = link.getAttribute('href') || '';
    var name;
    var cleanUrl;
    if (href.indexOf('tel:') === 0) {
      name = 'lead_phone_click'; cleanUrl = 'tel:+13213109375';
    } else if (href.indexOf('sms:') === 0) {
      name = 'lead_sms_click'; cleanUrl = 'sms:+13213109375';
    } else if (href.indexOf('mailto:') === 0) {
      name = 'lead_email_click'; cleanUrl = 'mailto:contact@pelican-canvas.com';
    } else {
      try {
        var url = new URL(href, window.location.origin);
        if (url.hostname === 'wa.me' || url.hostname === 'api.whatsapp.com') {
          name = 'lead_whatsapp_click'; cleanUrl = 'https://wa.me/13213109375';
        } else if (url.origin === window.location.origin && url.pathname === '/contact/') {
          name = 'lead_estimate_click'; cleanUrl = '/contact/';
        }
      } catch (error) { return; }
    }
    if (name) track(name, {link_url: cleanUrl, contact_placement: link.closest('.mobile-contact') ? 'mobile_bar' : 'page'});
  });

  var form = document.getElementById('project-request');
  if (!form) return;
  form.hidden = false;
  var preset = new URLSearchParams(window.location.search).get('service');
  if (Object.prototype.hasOwnProperty.call(serviceNames, preset)) form.elements.service.value = preset;
  form.addEventListener('submit', function (event) {
    event.preventDefault();
    if (!form.reportValidity()) return;
    var method = event.submitter ? event.submitter.value : 'sms';
    if (['sms', 'whatsapp', 'email'].indexOf(method) < 0) return;
    var data = new FormData(form);
    var service = String(data.get('service'));
    var message = [
      'Hi Pelican Canvas, I would like a project estimate.',
      'Boat: ' + String(data.get('vessel')).trim(),
      'Location: ' + String(data.get('location')).trim(),
      'Project: ' + serviceNames[service],
      'Scope: ' + String(data.get('scope')).trim()
    ];
    if (String(data.get('timeframe')).trim()) message.push('Timeframe: ' + String(data.get('timeframe')).trim());
    message.push('I will attach project photos.');
    var body = encodeURIComponent(message.join('\n'));
    var target;
    if (method === 'email') {
      target = 'mailto:contact@pelican-canvas.com?subject=' + encodeURIComponent('Boat project estimate — ' + String(data.get('vessel')).trim()) + '&body=' + body;
    } else if (method === 'whatsapp') {
      target = 'https://wa.me/13213109375?text=' + body;
    } else {
      var apple = /iPhone|iPad|iPod|Macintosh/.test(navigator.userAgent);
      target = 'sms:+13213109375' + (apple ? '&' : '?') + 'body=' + body;
    }
    // No vessel, location, message text or personal information is sent to analytics.
    track('lead_request_prepared', {contact_method: method, project_type: service});
    track('lead_' + (method === 'email' ? 'email' : method) + '_click', {contact_placement: 'project_form', project_type: service});
    document.getElementById('request-status').textContent = 'Continue in your chosen app, attach photos and send the message. If no app opens, use the contact buttons above.';
    if (method === 'whatsapp') {
      window.open(target, '_blank', 'noopener');
    } else {
      window.location.href = target;
    }
  });
}());
