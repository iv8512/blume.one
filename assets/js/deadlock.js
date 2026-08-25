(function () {
    function formatTime(totalSeconds) {
        var sec = Math.max(0, Math.round(totalSeconds));
        var m = Math.floor(sec / 60);
        var s = sec % 60;
        return m + ':' + (s < 10 ? '0' : '') + s;
    }

    function initTrack(track) {
        var startPct = parseFloat(track.dataset.startPct);
        var maxPct = parseFloat(track.dataset.maxPct);
        var startSec = parseFloat(track.dataset.startSec);
        var maxSec = parseFloat(track.dataset.maxSec);
        var cursor = track.querySelector('.dl-resist-cursor');
        var tooltip = track.querySelector('.dl-resist-tooltip');

        function update(clientX) {
            var rect = track.getBoundingClientRect();
            var frac = (clientX - rect.left) / rect.width;
            frac = Math.min(1, Math.max(0, frac));
            var pct = startPct + frac * (maxPct - startPct);
            var sec = startSec + frac * (maxSec - startSec);
            var leftPct = frac * 100;
            cursor.style.left = leftPct + '%';
            tooltip.style.left = leftPct + '%';
            tooltip.textContent = Math.round(pct) + '% resist @ ' + formatTime(sec);
        }

        track.addEventListener('mousemove', function (e) {
            track.classList.add('is-hovering');
            update(e.clientX);
        });

        track.addEventListener('mouseleave', function () {
            track.classList.remove('is-hovering');
        });

        track.addEventListener('touchmove', function (e) {
            if (!e.touches || !e.touches.length) return;
            track.classList.add('is-hovering');
            update(e.touches[0].clientX);
        }, { passive: true });

        track.addEventListener('touchend', function () {
            track.classList.remove('is-hovering');
        });
    }

    function initItemTips() {
        var cards = document.querySelectorAll('.dl-item-card');
        var tip = document.getElementById('dl-tip');
        if (!tip) return null;

        var elName = tip.querySelector('.dl-tip-name');
        var elIcon = tip.querySelector('.dl-tip-icon');
        var elCost = tip.querySelector('.dl-tip-cost span');
        var elTier = tip.querySelector('.dl-tip-tier');
        var elInfos = tip.querySelector('.dl-tip-infos');
        var elUpgradesFrom = tip.querySelector('.dl-tip-upgrades-from');
        var elUpgradesTo = tip.querySelector('.dl-tip-upgrades-to');

        function buildStatIcon(s) {
            if (!s.icon) return null;
            var path = '/assets/img/deadlock/items/icons/props/' + s.icon + '.svg';
            if (s.iconColored) {
                var img = document.createElement('img');
                img.className = 'dl-tip-stat-icon';
                img.src = path;
                img.alt = '';
                return img;
            }
            var span = document.createElement('span');
            span.className = 'dl-tip-stat-icon dl-tip-stat-icon--mask';
            span.style.setProperty('--icon-img', 'url(' + path + ')');
            if (s.iconColor) span.style.setProperty('--icon-color', s.iconColor);
            return span;
        }

        function buildStatCell(s) {
            var cell = document.createElement('div');
            cell.className = 'dl-tip-stat-cell';
            var valueRow = document.createElement('span');
            valueRow.className = 'dl-tip-stat-cell-value-row';
            var icon = buildStatIcon(s);
            if (icon) valueRow.appendChild(icon);
            var value = document.createElement('span');
            value.className = 'dl-tip-stat-cell-value';
            value.textContent = s.value;
            if (s.valueColor) value.style.color = s.valueColor;
            valueRow.appendChild(value);
            var label = document.createElement('span');
            label.className = 'dl-tip-stat-cell-label';
            label.appendChild(document.createTextNode(s.label));
            cell.appendChild(valueRow);
            cell.appendChild(label);
            return cell;
        }

        function buildPlainRow(s) {
            var row = document.createElement('div');
            row.className = 'dl-tip-plain-row';
            var label = document.createElement('span');
            label.className = 'dl-tip-stat-label';
            var icon = buildStatIcon(s);
            if (icon) label.appendChild(icon);
            label.appendChild(document.createTextNode(s.label));
            var value = document.createElement('span');
            value.className = 'dl-tip-stat-value';
            value.textContent = s.value;
            if (s.valueColor) value.style.color = s.valueColor;
            row.appendChild(label);
            row.appendChild(value);
            return row;
        }

        function buildInfoSection(info) {
            var section = document.createElement('div');
            section.className = 'dl-tip-info-section';

            if (info.type !== 'Innate' || info.timerLabel) {
                var header = document.createElement('div');
                header.className = 'dl-tip-info-header';
                var label = document.createElement('span');
                label.textContent = info.type;
                header.appendChild(label);
                if (info.timerLabel) {
                    var timer = document.createElement('span');
                    timer.className = 'dl-tip-timer';
                    var timerIcon = document.createElement('span');
                    timerIcon.className = 'dl-tip-timer-icon';
                    timerIcon.style.setProperty('--icon-img', 'url(/assets/img/deadlock/items/icons/props/' + (info.timerKind === 'charge' ? 'recharge' : 'cooldown') + '.svg)');
                    timer.appendChild(timerIcon);
                    timer.appendChild(document.createTextNode(info.timerLabel));
                    header.appendChild(timer);
                }
                section.appendChild(header);
            }

            if (info.desc) {
                var desc = document.createElement('p');
                desc.className = 'dl-tip-info-desc';
                desc.innerHTML = info.desc;
                section.appendChild(desc);
            }

            if (info.hintLabel) {
                var hint = document.createElement('p');
                hint.className = 'dl-tip-info-hint';
                hint.textContent = info.hintLabel;
                section.appendChild(hint);
            }

            var mainStats = info.mainStats || [];
            var altStats = info.altStats || [];

            if (info.type === 'Innate') {
                var innateRows = mainStats.concat(altStats);
                if (innateRows.length) {
                    var rows = document.createElement('div');
                    rows.className = 'dl-tip-plain-rows';
                    innateRows.forEach(function (s) { rows.appendChild(buildPlainRow(s)); });
                    section.appendChild(rows);
                }
                return section;
            }

            if (mainStats.length) {
                var grid = document.createElement('div');
                grid.className = 'dl-tip-stat-grid';
                mainStats.forEach(function (s) { grid.appendChild(buildStatCell(s)); });
                section.appendChild(grid);
            }

            if (altStats.length) {
                var altRows = document.createElement('div');
                altRows.className = 'dl-tip-plain-rows';
                altStats.forEach(function (s) { altRows.appendChild(buildPlainRow(s)); });
                section.appendChild(altRows);
            }

            return section;
        }

        function buildUpgradesBlock(el, label, list) {
            el.innerHTML = '';
            if (!list || !list.length) {
                el.classList.remove('has-content');
                return;
            }
            el.classList.add('has-content');
            var labelEl = document.createElement('span');
            labelEl.className = 'dl-tip-upgrades-label';
            labelEl.textContent = label;
            el.appendChild(labelEl);
            list.forEach(function (u) {
                var row = document.createElement('div');
                row.className = 'dl-tip-upgrades-row';
                var icon = document.createElement('img');
                icon.className = 'dl-tip-upgrades-icon';
                icon.src = u.icon || '';
                icon.alt = '';
                var name = document.createElement('span');
                name.className = 'dl-tip-upgrades-name';
                name.textContent = u.name || '';
                row.appendChild(icon);
                row.appendChild(name);
                el.appendChild(row);
            });
        }

        function show(card) {
            var data;
            try { data = JSON.parse(card.dataset.tip || '{}'); } catch (e) { data = {}; }

            var cat = card.dataset.tipCat;
            tip.style.setProperty('--tip-cat-color', 'var(--dl-cat-' + cat + ')');
            tip.style.setProperty('--tip-header-bg', 'url(/assets/img/deadlock/items/cards/tooltip-header-' + cat + '.png)');
            tip.style.setProperty('--tip-body-bg', 'url(/assets/img/deadlock/items/cards/tooltip-bg-' + cat + '.png)');
            elName.textContent = card.dataset.tipName || '';
            elIcon.src = card.dataset.tipIcon || '';
            elCost.textContent = card.dataset.tipCost || '';
            elTier.textContent = card.dataset.tipTier || '';

            elInfos.innerHTML = '';
            (data.infos || []).forEach(function (info) { elInfos.appendChild(buildInfoSection(info)); });

            buildUpgradesBlock(elUpgradesFrom, 'Upgrades From:', data.upgradesFrom);
            buildUpgradesBlock(elUpgradesTo, 'Upgrades To:', data.upgradesTo);

            tip.classList.add('is-visible');
            position(card);
        }

        function position(card) {
            var rect = card.getBoundingClientRect();
            var tipRect = tip.getBoundingClientRect();
            var gap = 10;

            var left = rect.left + rect.width / 2 - tipRect.width / 2;
            left = Math.max(8, Math.min(left, window.innerWidth - tipRect.width - 8));

            var spaceAbove = rect.top;
            var spaceBelow = window.innerHeight - rect.bottom;
            var top;
            if (spaceAbove >= tipRect.height + gap || spaceAbove >= spaceBelow) {
                top = rect.top - tipRect.height - gap;
            } else {
                top = rect.bottom + gap;
            }
            top = Math.max(8, Math.min(top, window.innerHeight - tipRect.height - 8));

            tip.style.left = left + 'px';
            tip.style.top = top + 'px';
        }

        function hide() {
            tip.classList.remove('is-visible');
        }

        function attach(card) {
            card.addEventListener('mouseenter', function () { show(card); });
            card.addEventListener('mouseleave', hide);
        }

        cards.forEach(attach);

        return { attach: attach };
    }

    function initTabs(onShown) {
        var tabs = document.querySelectorAll('.dl-tab');
        if (!tabs.length) return;

        tabs.forEach(function (tab) {
            tab.addEventListener('click', function () {
                var target = tab.dataset.dlTab;

                tabs.forEach(function (t) {
                    var isActive = t === tab;
                    t.classList.toggle('is-active', isActive);
                    t.setAttribute('aria-selected', isActive ? 'true' : 'false');
                });

                document.querySelectorAll('.dl-tab-panel').forEach(function (panel) {
                    var isActive = panel.dataset.dlTabPanel === target;
                    panel.classList.toggle('is-active', isActive);
                    panel.hidden = !isActive;
                });

                if (typeof onShown === 'function') onShown(target);
            });
        });
    }

    // Item randomizer: deals a hand of item cards (cloned from the Items tab's
    // cards, so art/tooltips come for free) drawn from a shuffled pool filtered
    // by the checked categories/tiers. Picking a card moves it to the table
    // permanently; Discard returns the rest of the hand to the pool and deals
    // a fresh one, consuming one of a limited number of discards. The pool
    // itself is rebuilt (and everything reset) on New Draw or any settings change.
    function initRoulette(tipApi) {
        var panel = document.querySelector('[data-dl-tab-panel="roulette"]');
        if (!panel) return null;

        var handEl = panel.querySelector('.dl-roulette-hand');
        var tableEl = panel.querySelector('.dl-roulette-table-slots');
        var discardBtn = panel.querySelector('.dl-roulette-discard');
        var discardCountEl = panel.querySelector('.dl-roulette-discard-count');
        var restartBtn = panel.querySelector('.dl-roulette-restart');
        var pickCountEl = panel.querySelector('.dl-roulette-pick-count-val');
        var pickCapEl = panel.querySelector('.dl-roulette-pick-cap-val');
        var catInputs = panel.querySelectorAll('.dl-roulette-cat');
        var tierInputs = panel.querySelectorAll('.dl-roulette-tier');
        var handSizeInput = panel.querySelector('#dl-hand-size');
        var discardSettingInput = panel.querySelector('#dl-discard-setting');
        var pickCapInput = panel.querySelector('#dl-pick-cap');
        if (!handEl || !tableEl) return null;

        var sourceCards = null;
        var pool = [];
        var discardsLeft = 0;
        var discardBusy = false;
        var pickedCount = 0;
        var pickCap = 0;
        var handSize = 5;
        var started = false;

        function clampInt(value, min, max) {
            var n = parseInt(value, 10);
            if (isNaN(n)) n = min;
            return Math.min(max, Math.max(min, n));
        }

        function shuffle(arr) {
            for (var i = arr.length - 1; i > 0; i--) {
                var j = Math.floor(Math.random() * (i + 1));
                var t = arr[i]; arr[i] = arr[j]; arr[j] = t;
            }
            return arr;
        }

        function collectSource() {
            if (!sourceCards) {
                sourceCards = Array.prototype.slice.call(document.querySelectorAll('.dl-item-card'));
            }
            return sourceCards;
        }

        function checkedValues(inputs) {
            return Array.prototype.filter.call(inputs, function (i) { return i.checked; })
                .map(function (i) { return i.value; });
        }

        function buildPool() {
            var cats = checkedValues(catInputs);
            var tiers = checkedValues(tierInputs);
            pool = shuffle(collectSource().filter(function (card) {
                return cats.indexOf(card.dataset.tipCat) !== -1 && tiers.indexOf(card.dataset.tipTier) !== -1;
            }).slice());
        }

        // Discarding replaces the whole hand, so once used it forfeits
        // whatever's currently sitting there as pick opportunities. Locks
        // the button once using it could no longer mathematically leave
        // enough future cards (discardsLeft fresh hands' worth) to reach
        // Max Picks, instead of letting the player discard their way into
        // an unfinishable loadout.
        function updateDiscardUI() {
            if (discardCountEl) discardCountEl.textContent = discardsLeft;
            var remainingNeeded = pickCap - pickedCount;
            var wouldStrand = remainingNeeded > 0 && (discardsLeft * handSize) < remainingNeeded;
            if (discardBtn) {
                discardBtn.disabled = discardsLeft <= 0 || discardBusy || wouldStrand;
                discardBtn.title = wouldStrand ? 'Not enough discards left to still reach Max Picks' : '';
            }
        }

        function updatePickUI() {
            if (pickCountEl) pickCountEl.textContent = pickedCount;
            if (pickCapEl) pickCapEl.textContent = pickCap;
            handEl.classList.toggle('is-full', pickedCount >= pickCap);
            updateDiscardUI();
        }

        function makeCard(sourceEl) {
            var card = sourceEl.cloneNode(true);
            card.classList.add('dl-roulette-card');
            card.dlSource = sourceEl;
            if (tipApi) tipApi.attach(card);
            return card;
        }

        // The deal-in animation uses fill-mode "both" so dealt cards don't pop
        // before their staggered delay; left in place afterward it would keep
        // pinning transform to its own end frame, blocking the fan rotation
        // and hover lift below, so the class is dropped once it finishes.
        function clearAnimOnEnd(el, cls) {
            el.addEventListener('animationend', function onEnd(e) {
                if (e.target !== el) return;
                el.removeEventListener('animationend', onEnd);
                el.classList.remove(cls);
            });
        }

        function dealHand() {
            handEl.innerHTML = '';
            var dealt = [];
            for (var i = 0; i < handSize && pool.length; i++) {
                var card = makeCard(pool.pop());
                card.classList.add('dl-card-deal');
                card.style.animationDelay = (i * 55) + 'ms';
                clearAnimOnEnd(card, 'dl-card-deal');
                card.addEventListener('click', function () { pick(this); });
                handEl.appendChild(card);
                dealt.push(card);
            }

            var center = (dealt.length - 1) / 2;
            dealt.forEach(function (card, i) {
                card.style.setProperty('--fan-rot', ((i - center) * 4) + 'deg');
            });
        }

        // Flies the actual hand card over to the table (FLIP: snapshot its
        // on-screen position, reparent it, then animate from the old spot to
        // the new one) instead of fading a clone out and a different one in,
        // which read as the card just vanishing rather than moving.
        function pick(cardEl) {
            if (pickedCount >= pickCap || cardEl.dlPicked) return;
            cardEl.dlPicked = true;

            var startRect = cardEl.getBoundingClientRect();
            var fanRot = cardEl.style.getPropertyValue('--fan-rot') || '0deg';

            cardEl.classList.add('dl-roulette-card--picked');
            tableEl.appendChild(cardEl);

            var endRect = cardEl.getBoundingClientRect();
            var dx = startRect.left - endRect.left;
            var dy = startRect.top - endRect.top;

            cardEl.style.transition = 'none';
            cardEl.style.transform = 'translate(' + dx + 'px, ' + dy + 'px) rotate(' + fanRot + ')';
            void cardEl.offsetWidth;
            cardEl.style.transition = 'transform .32s cubic-bezier(.22,.68,.32,1)';
            cardEl.style.transform = 'translate(0, 0) rotate(0deg)';

            cardEl.addEventListener('transitionend', function onEnd(e) {
                if (e.propertyName !== 'transform') return;
                cardEl.removeEventListener('transitionend', onEnd);
                cardEl.style.transition = '';
                cardEl.style.transform = '';
            });

            pickedCount++;
            updatePickUI();
        }

        // Discard's leave animation takes ~220ms; without this lock, clicking
        // Discard again before it finishes would grab the same still-in-DOM
        // hand cards a second time, double-pushing their source items into
        // the pool and double-registering their animationend handlers.
        function discard() {
            if (discardsLeft <= 0 || discardBusy) return;
            discardBusy = true;
            discardsLeft--;
            updateDiscardUI();

            var cards = Array.prototype.slice.call(handEl.children);
            if (!cards.length) {
                dealHand();
                discardBusy = false;
                updateDiscardUI();
                return;
            }
            var remaining = cards.length;
            cards.forEach(function (card) {
                pool.push(card.dlSource);
                card.classList.add('dl-card-pick-out');
                card.addEventListener('animationend', function onEnd() {
                    card.removeEventListener('animationend', onEnd);
                    card.remove();
                    remaining--;
                    if (remaining === 0) {
                        shuffle(pool);
                        dealHand();
                        discardBusy = false;
                        updateDiscardUI();
                    }
                });
            });
        }

        function newDraw() {
            pickCap = clampInt(pickCapInput ? pickCapInput.value : 6, 1, 30);
            discardsLeft = clampInt(discardSettingInput ? discardSettingInput.value : 3, 0, 30);
            handSize = clampInt(handSizeInput ? handSizeInput.value : 5, 1, 12);
            discardBusy = false;
            pickedCount = 0;
            tableEl.innerHTML = '';
            updatePickUI();
            buildPool();
            dealHand();
        }

        // Categories, tiers, and the number settings are only read when
        // newDraw() runs, so changing them just stages the next draw --
        // the current hand/table stay put until New Draw is clicked.
        if (discardBtn) discardBtn.addEventListener('click', discard);
        if (restartBtn) restartBtn.addEventListener('click', newDraw);

        return {
            ensureStarted: function () {
                if (started) return;
                started = true;
                newDraw();
            }
        };
    }

    // Grows item cards (within a hard floor) to fill leftover vertical space,
    // since columns otherwise sit top-aligned with dead space below whenever
    // their content is shorter than the page. All cards share one size, set
    // by whichever column has the least room to grow -- that column ends up
    // filling its space exactly, the others are simply allowed to fall short.
    //
    // This runs in two passes because card width and height can't both be
    // grown continuously: growing width changes how many cards fit per row,
    // which changes height in sudden jumps (one more/fewer row), not smoothly.
    // So pass 1 finds the biggest *discrete* width+height scale that still
    // fits (may undershoot by up to one row's worth), then pass 2 tops up
    // height only -- which nothing else depends on, so it can be solved for
    // exactly -- to close whatever gap pass 1 left, closing it to the pixel.
    function initShopFit() {
        var shop = document.querySelector('.dl-shop');
        var cols = document.querySelectorAll('.dl-shop-col');
        if (!shop || !cols.length) return null;

        function bestFitScale(col, avail) {
            col.style.setProperty('--dl-item-scale', 1);
            var natural = col.scrollHeight;
            if (!avail || natural >= avail) {
                col.style.removeProperty('--dl-item-scale');
                return 1;
            }
            // Growing the scale also grows card width, which changes how many
            // cards fit per row -- so height doesn't grow smoothly with scale,
            // it can drop sharply whenever a row gains/loses a card. That
            // breaks binary search's monotonicity assumption, so scan instead:
            // check every step and keep the largest that still fits.
            var best = 1;
            var step = 0.02;
            for (var s = 1 + step; s <= 1.6 + 1e-9; s += step) {
                col.style.setProperty('--dl-item-scale', s);
                if (col.scrollHeight <= avail) {
                    best = s;
                }
            }
            col.style.removeProperty('--dl-item-scale');
            return best;
        }

        // Adds a uniform per-card height (in px, on top of the scale from
        // pass 1) so the tightest column's remaining gap closes exactly,
        // without changing any column's card count per row.
        function bestFitGrow(avail) {
            var minPerRow = Infinity;
            cols.forEach(function (col) {
                var h0 = col.scrollHeight;
                var residual = avail - h0;
                if (residual <= 0) return;
                col.style.setProperty('--dl-item-vgrow', '1px');
                var rows = col.scrollHeight - h0;
                col.style.removeProperty('--dl-item-vgrow');
                if (rows <= 0) return;
                minPerRow = Math.min(minPerRow, residual / rows);
            });
            return minPerRow === Infinity ? 0 : Math.max(0, minPerRow);
        }

        function fitAll() {
            shop.style.setProperty('--dl-item-scale', 1);
            shop.style.setProperty('--dl-item-vgrow', '0px');
            cols.forEach(function (col) {
                col.style.removeProperty('--dl-item-scale');
                col.style.removeProperty('--dl-item-vgrow');
            });
            // The row itself (not individual columns) reflects the real
            // available height, since columns sit top-aligned within it.
            var avail = shop.clientHeight;

            var scale = 1.6;
            cols.forEach(function (col) {
                scale = Math.min(scale, bestFitScale(col, avail));
            });
            shop.style.setProperty('--dl-item-scale', scale);

            var vgrow = bestFitGrow(avail);
            shop.style.setProperty('--dl-item-vgrow', vgrow + 'px');
        }

        var resizeTimer;
        window.addEventListener('resize', function () {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(fitAll, 150);
        });

        return fitAll;
    }

    document.addEventListener('DOMContentLoaded', function () {
        document.querySelectorAll('.dl-resist-track').forEach(initTrack);
        var fitShop = initShopFit();
        var tipApi = initItemTips();
        var roulette = initRoulette(tipApi);
        initTabs(function (target) {
            if (target === 'items' && fitShop) fitShop();
            if (target === 'roulette' && roulette) roulette.ensureStarted();
        });
    });
})();
