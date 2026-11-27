/*
  WHAT: Makes the fridge do things: trash day (I'm Feeling Lucky), labeling
        (tab groups), the note pile, the secret envelope, and the tear-off tabs.
  WHY: The site should behave like the extension does, in the fridge's terms.
       Rules copied from the extension: pinned and active tabs are never closed,
       and a note within ~5 seconds of the last one is skipped (HumorSystem cooldown).
  HOW DATA FLOWS: window.TABBY_QUIPS (quips.js) -> pickers below -> sticky notes in #notes.
  SEAMS: SITE-02 reads window.TABBY_QUIPS (written by scripts/site-quips.cjs, SITE-01).
         No storage, no network.
*/
(function () {
  'use strict';
  var Q = window.TABBY_QUIPS;
  var $ = function (id) { return document.getElementById(id); };
  var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var COOLDOWN_MS = 5000;
  var lastNoteAt = 0;
  var count = 4;
  var colors = ['yellow', 'pink', 'green', 'blue'];
  var tilts = ['tilt-l', 'tilt-r', 'tilt-l2', 'tilt-r2'];
  var used = {};

  if (!Q) {
    // The marker ran out: the quips file didn't load. Say so on the fridge, in-world.
    ['lucky-status', 'group-status'].forEach(function (id) {
      var el = $(id);
      if (el) el.textContent = "The marker ran out (the notes didn't load). Refresh and I'll find another pen.";
    });
    // Grouping needs no quips, but its success message promises a note, so the whole
    // fridge goes quiet rather than half-working.
    ['lucky', 'more', 'envelope'].forEach(function (id) { var b = $(id); if (b) b.disabled = true; });
    var gb = document.querySelector('#group-form button[type=submit]');
    if (gb) gb.disabled = true;
    return;
  }

  function pick(list) {
    var fresh = list.filter(function (t) { return !used[t]; });
    if (!fresh.length) { list.forEach(function (t) { delete used[t]; }); fresh = list; }
    var t = fresh[Math.floor(Math.random() * fresh.length)];
    used[t] = true;
    return t;
  }

  function leaveNote(text) {
    var notes = $('notes');
    var n = document.createElement('div');
    n.className = 'note slap ' + colors[count % 4] + ' ' + tilts[(count * 3) % 4];
    var p = document.createElement('p');
    p.className = 'hand';
    p.textContent = text;
    n.appendChild(p);
    notes.insertBefore(n, notes.firstChild);
    while (notes.children.length > 8) notes.removeChild(notes.lastChild);
    count += 1;
    $('count').textContent = String(count);
    lastNoteAt = Date.now();
  }

  // Returns true if a note was left, false if Tabby is still in cooldown.
  function maybeNote(trigger) {
    if (Date.now() - lastNoteAt < COOLDOWN_MS) return false;
    leaveNote(pick(Q.byTrigger[trigger] || Q.all));
    return true;
  }

  /* ---------- Trash day: I'm Feeling Lucky ---------- */
  var lucky = $('lucky');
  var restock = $('restock');
  var luckyStatus = $('lucky-status');
  var tabs = $('tabs');

  function eligible() {
    return Array.prototype.filter.call(tabs.children, function (li) {
      return !li.hasAttribute('data-pinned') && !li.hasAttribute('data-active') && !li.classList.contains('gone');
    });
  }

  lucky.addEventListener('click', function () {
    var pool = eligible();
    if (!pool.length) {
      luckyStatus.textContent = "Nothing left to throw out. Pinned tabs and the one you're on are off limits.";
      restock.hidden = false;
      return;
    }
    lucky.disabled = true;
    lucky.textContent = 'Choosing...';
    luckyStatus.textContent = 'Eeny, meeny...';
    var target = pool[Math.floor(Math.random() * pool.length)];
    var steps = reduced ? 0 : 9 + Math.floor(Math.random() * 4);
    // Start the flashing so the last highlighted tab is the one that actually goes.
    var n = pool.length;
    var start = ((pool.indexOf(target) - (steps - 1)) % n + n) % n;
    var i = 0;
    function flash() {
      pool.forEach(function (li) { li.classList.remove('spot'); });
      if (i < steps) {
        pool[(start + i) % n].classList.add('spot');
        i += 1;
        setTimeout(flash, 70 + i * 12);
        return;
      }
      target.classList.add('gone');
      target.setAttribute('aria-label', target.textContent + ' (closed)');
      var noted = maybeNote('FeelingLuckyClicked');
      var left = eligible().length;
      luckyStatus.textContent = 'Closed "' + target.textContent + '". ' +
        (noted ? 'Note on the fridge.' : "No note this time, I'm still glaring from the last one.") +
        (left ? ' ' + left + ' to go.' : ' That was the last one I can touch.');
      lucky.disabled = false;
      lucky.textContent = "I'm Feeling Lucky";
      if (!left) restock.hidden = false;
    }
    flash();
  });

  // Same shortcut as the extension (Alt+Shift+L), so you can practice.
  document.addEventListener('keydown', function (e) {
    if (e.altKey && e.shiftKey && (e.code === 'KeyL' || e.key.toLowerCase() === 'l') && !lucky.disabled) {
      e.preventDefault();
      lucky.focus();
      lucky.click();
    }
  });

  restock.addEventListener('click', function () {
    Array.prototype.forEach.call(tabs.children, function (li) { li.classList.remove('gone'); li.removeAttribute('aria-label'); });
    restock.hidden = true;
    var noted = maybeNote('TabOpened');
    luckyStatus.textContent = noted ? 'All back. Of course they are.' : 'All back. I saw.';
  });

  /* ---------- Label your stuff: tab groups ---------- */
  // Chrome's own tab group colors.
  var bandColors = ['#1a73e8', '#d93025', '#f9ab00', '#188038', '#d01884', '#a142f4', '#007b83', '#fa903e'];
  var groupsMade = 0;
  var form = $('group-form');
  var groupStatus = $('group-status');

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var boxes = Array.prototype.filter.call(form.querySelectorAll('input[name=t]'), function (b) { return b.checked && !b.disabled; });
    var name = $('group-name').value.trim();
    if (!boxes.length) { groupStatus.textContent = "Pick at least one tab. I can't put a band round nothing."; return; }
    if (!name) { groupStatus.textContent = 'Name it. Even "misc" counts.'; $('group-name').focus(); return; }
    var band = document.createElement('div');
    band.className = 'band';
    band.style.setProperty('--bc', bandColors[groupsMade % bandColors.length]);
    var b = document.createElement('b');
    b.textContent = name;
    band.appendChild(b);
    band.appendChild(document.createTextNode(boxes.map(function (x) { return x.value; }).join(' · ')));
    $('banded').appendChild(band);
    boxes.forEach(function (x) { x.checked = false; x.disabled = true; x.parentNode.hidden = true; });
    $('group-name').value = '';
    groupsMade += 1;
    var noted = maybeNote('TabGroupCreated');
    var left = form.querySelectorAll('input[name=t]:not(:disabled)').length;
    groupStatus.textContent = (noted ? 'Banded. Note on the fridge.' : 'Banded. I have thoughts, but I just left a note.') +
      (left ? '' : " Everything's labeled. Suspicious.");
  });

  /* ---------- The note pile ---------- */
  $('more').addEventListener('click', function () {
    // You asked for this one, so the cooldown doesn't apply.
    leaveNote(pick(Q.all));
  });

  /* ---------- The envelope: easter eggs ---------- */
  var checks = {
    'browser-crashed-from-tabs': 'Chrome just crashed from all your tabs',
    'ctrl-shift-t-pressed-3x': 'you reopen closed tabs three times in a row',
    'date-is-march-14': "it's March 14",
    'date-is-may-4': "it's May 4th",
    'day-is-friday-after-3pm': "it's Friday after 3pm",
    'duplicate-tabs-detected': 'you have the same page open twice',
    'konami-code-entered': 'you enter a certain famous cheat code',
    'new-tab-opened-while-tabs-exist': 'you open yet another tab',
    'rapid-tab-opening': 'you open tabs really fast',
    'season-is-winter': "it's winter",
    'tab-closed-then-reopened': 'you close a tab and open it right back up',
    'tab-just-closed': 'you just closed a tab',
    'time-after-midnight': "it's after midnight",
    'time-exactly-midnight': "it's exactly midnight",
    'timestamp-is-unix-milestone': 'the Unix clock hits a round number'
  };
  function hour(h) { return h === 0 ? 'midnight' : h === 12 ? 'noon' : (h % 12) + (h < 12 ? 'am' : 'pm'); }
  function num(c, noun) {
    if (typeof c === 'number') return (c === 0 ? 'no ' : 'exactly ' + c + ' ') + noun + (c === 1 ? '' : 's') + ' open';
    if (c && c.min !== undefined && c.max !== undefined) return c.min + ' to ' + c.max + ' ' + noun + 's open';
    if (c && c.min !== undefined) return c.min + '+ ' + noun + 's open';
    if (c && c.max !== undefined) return c.max + ' or fewer ' + noun + 's open';
    return 'some ' + noun + 's open';
  }
  function describe(c) {
    var parts = [];
    if (c.customCheck) parts.push(checks[c.customCheck] || c.customCheck.replace(/-/g, ' '));
    if (c.tabCount !== undefined) parts.push('you have ' + num(c.tabCount, 'tab'));
    if (c.groupCount !== undefined) parts.push('you have ' + num(c.groupCount, 'tab group'));
    if (c.domainRegex) parts.push('on ' + c.domainRegex.replace(/\\/g, '').split('|').join(' or '));
    if (c.titleContains) parts.push('a tab title says "' + c.titleContains + '"');
    if (c.urlContains) parts.push('the link is a very specific video');
    if (c.hourRange) parts.push('between ' + hour(c.hourRange.start) + ' and ' + hour(c.hourRange.end));
    var s = parts.join(', ');
    return 'When ' + s + ':';
  }
  var envelope = $('envelope');
  var egg = $('egg');
  function snoop() {
    var e = Q.eggs[Math.floor(Math.random() * Q.eggs.length)];
    $('egg-when').textContent = describe(e.conditions);
    $('egg-quip').textContent = e.quip;
  }
  envelope.addEventListener('click', function () {
    var open = envelope.getAttribute('aria-expanded') === 'true';
    if (!open) snoop();
    envelope.setAttribute('aria-expanded', String(!open));
    egg.hidden = open;
  });
  $('egg-again').addEventListener('click', snoop);

  /* ---------- Tear-off tabs ---------- */
  Array.prototype.forEach.call(document.querySelectorAll('.tear'), function (a) {
    a.addEventListener('click', function (e) {
      if (reduced || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
      e.preventDefault();
      a.classList.add('torn');
      setTimeout(function () { window.location.href = a.href; }, 260);
    });
  });
  // Coming back with the back button: the tab grows back.
  window.addEventListener('pageshow', function () {
    Array.prototype.forEach.call(document.querySelectorAll('.tear.torn'), function (a) { a.classList.remove('torn'); });
  });
})();
