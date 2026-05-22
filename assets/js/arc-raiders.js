(function () {
    var schedule = (SCHEDULE && SCHEDULE.data) || [];
    var now = Date.now();

    function pad(n) { return n < 10 ? '0' + n : '' + n; }

    function formatTime(ms) {
        var d = new Date(ms);
        return pad(d.getHours()) + ':' + pad(d.getMinutes());
    }

    function groupByMap(events) {
        var byMap = {};
        events.forEach(function (e) {
            if (!byMap[e.map]) byMap[e.map] = [];
            byMap[e.map].push(e);
        });
        return byMap;
    }

    function renderMapGrid(events) {
        var byMap = groupByMap(events);
        return Object.keys(byMap).sort().map(function (mapName) {
            var items = byMap[mapName].map(function (e) {
                return '<div class="arc-event-item">'
                    + '<img class="arc-event-icon" src="' + e.icon + '" alt="" loading="lazy">'
                    + '<span class="arc-event-name">' + e.name + '</span>'
                    + '</div>';
            }).join('');
            return '<div class="arc-map-card">'
                + '<div class="arc-map-name">' + mapName + '</div>'
                + '<div class="arc-event-list">' + items + '</div>'
                + '</div>';
        }).join('');
    }

    var slotMap = {};
    schedule.forEach(function (e) {
        var key = e.startTime + '_' + e.endTime;
        if (!slotMap[key]) slotMap[key] = { startTime: e.startTime, endTime: e.endTime, events: [] };
        slotMap[key].events.push(e);
    });
    var slots = Object.values(slotMap).sort(function (a, b) { return a.startTime - b.startTime; });

    var currentSlot = slots.find(function (s) { return s.startTime <= now && now < s.endTime; });
    var futureSlots = slots.filter(function (s) { return s.startTime >= (currentSlot ? currentSlot.endTime : now); });

    var msgEl = document.getElementById('arc-events-msg');
    var gridEl = document.getElementById('arc-map-grid');
    var upcomingEl = document.getElementById('arc-upcoming');

    if (!currentSlot) {
        msgEl.textContent = 'No events found for this time slot.';
    } else {
        function tick() {
            var diff = Math.max(0, currentSlot.endTime - Date.now());
            var m = Math.floor(diff / 60000);
            var s = Math.floor((diff % 60000) / 1000);
            document.getElementById('arc-countdown').textContent = m + ':' + pad(s);
        }
        setInterval(tick, 1000);
        tick();

        gridEl.innerHTML = renderMapGrid(currentSlot.events);
        msgEl.style.display = 'none';
        gridEl.style.display = 'grid';
    }

    function formatIn(ms) {
        var diff = Math.max(0, ms - Date.now());
        var h = Math.floor(diff / 3600000);
        var m = Math.floor((diff % 3600000) / 60000);
        return h > 0 ? 'in ' + h + 'h ' + m + 'm' : 'in ' + m + 'm';
    }

    if (futureSlots.length) {
        var allMaps = [];
        futureSlots.forEach(function (slot) {
            slot.events.forEach(function (e) {
                if (!allMaps.includes(e.map)) allMaps.push(e.map);
            });
        });
        allMaps.sort();

        var activeMap = null;
        var activeEvent = null;
        var filtersEl = document.getElementById('arc-upcoming-filters');

        var allEventNames = [];
        futureSlots.forEach(function (slot) {
            slot.events.forEach(function (e) {
                if (!allEventNames.includes(e.name)) allEventNames.push(e.name);
            });
        });
        allEventNames.sort();

        function renderUpcoming() {
            upcomingEl.innerHTML = futureSlots.map(function (slot) {
                var events = slot.events.filter(function (e) {
                    return (!activeMap || e.map === activeMap) && (!activeEvent || e.name === activeEvent);
                });
                if (!events.length) return '';
                return '<div class="arc-upcoming-slot">'
                    + '<div class="arc-upcoming-time">'
                    + formatTime(slot.startTime) + ' – ' + formatTime(slot.endTime)
                    + '<span class="arc-upcoming-in" data-start="' + slot.startTime + '">' + formatIn(slot.startTime) + '</span>'
                    + '</div>'
                    + '<div class="arc-map-grid arc-map-grid--upcoming">' + renderMapGrid(events) + '</div>'
                    + '</div>';
            }).join('');
        }

        function compatibleMaps() {
            return allMaps.filter(function (map) {
                return futureSlots.some(function (slot) {
                    return slot.events.some(function (e) {
                        return e.map === map && (!activeEvent || e.name === activeEvent);
                    });
                });
            });
        }

        function compatibleEvents() {
            return allEventNames.filter(function (name) {
                return futureSlots.some(function (slot) {
                    return slot.events.some(function (e) {
                        return e.name === name && (!activeMap || e.map === activeMap);
                    });
                });
            });
        }

        var EVENT_ICONS = {
            'Beachcombing':         { vb: '0 0 47.2 43.02',          d: '<path fill="currentColor" d="M23.6 43.017h7.652c0-8.808 7.14-15.949 15.949-15.949v-7.652c-13.034 0-23.6 10.566-23.6 23.6Z"/><path fill="currentColor" d="M0 19.417v7.652c8.808 0 15.949 7.14 15.949 15.949h7.652c0-13.034-10.566-23.6-23.6-23.6ZM19.24 17.718a14.7 14.7 0 0 1 2.893 4.073 15 15 0 0 1 1.391 4.908h.152a15 15 0 0 1 1.391-4.908 14.96 14.96 0 0 1 6.974-6.974 15 15 0 0 1 4.908-1.391v-.152A14.895 14.895 0 0 1 23.675 0h-.152a14.895 14.895 0 0 1-13.274 13.274v.152a14.7 14.7 0 0 1 4.891 1.391 14.8 14.8 0 0 1 4.098 2.901Z"/>' },
            'Bird City':            { vb: '0.54 0.12 82.92 81.76',   d: '<path fill="currentColor" fill-rule="evenodd" d="M.666 51.019 44.793 6.892c9.04-9.029 23.683-9.029 32.717.005L56.835 27.571A80.06 80.06 0 0 1 .666 51.019m59.556-39.234a3.92 3.92 0 0 0 3.917-3.916 3.92 3.92 0 0 0-3.917-3.918 3.92 3.92 0 0 0-3.917 3.918 3.92 3.92 0 0 0 3.917 3.916M.54 9.54l34.147.005-17.071 17.071zm44.157 56.547L33.646 55.035l22.099.004zM83.46 53.324 70.079 66.705A51.81 51.81 0 0 1 33.728 81.88l28.558-28.559c5.85-5.843 15.327-5.843 21.174.003m-11.189 3.164a2.536 2.536 0 0 0 2.535-2.535 2.537 2.537 0 0 0-2.535-2.535 2.54 2.54 0 0 0-2.535 2.535 2.537 2.537 0 0 0 2.535 2.535"/>' },
            'Close Scrutiny':       { vb: '0 0 41.52 44.47',         d: '<path fill="currentColor" d="m30.306 3.315-.02.02L26.952 0H14.564L3.355 11.21l.021.021L0 14.606v12.388l9.37 9.288V24.048L6.04 20.8 17.326 9.514l-.021-.022 3.452-3.452 11.287 11.287.02-.02 3.412 3.411-3.33 3.33v12.234l9.37-9.37V14.524z"/><path fill="currentColor" d="m14.5 21.188 6.237-6.238 6.238 6.238-6.238 6.238zM13.411 42.555h14.655v1.912H13.411zM13.411 37.555h14.655v3.676H13.411zM13.411 29.394h14.655v6.838H13.411z"/>' },
            'Electromagnetic Storm':{ vb: '0 0 25.38 47.89',         d: '<path fill="currentColor" d="m25.38 20.219-10.642-.11L18.995 0 0 27.685l10.481-.017-4.256 20.219z"/>' },
            'Harvester':            { vb: '0 0 180 180',              d: '<path fill="currentColor" fill-rule="evenodd" d="M161.543 144.602H83.144c-27.906 0-50.61-24.495-50.61-54.602h-13c0 37.276 28.535 67.602 63.61 67.602h66.263C133.557 171.542 112.767 180 90 180c-49.706 0-90-40.294-90-90 0-20.534 6.881-39.457 18.457-54.602h78.399c27.906 0 50.609 24.495 50.609 54.602h13c0-37.276-28.535-67.602-63.609-67.602H30.592C46.443 8.458 67.232 0 90 0c49.706 0 90 40.294 90 90 0 20.534-6.882 39.457-18.457 54.602M90 51.549 51.549 90 90 128.451 128.451 90zM70 90l20-20 19.1 20L90 109.1z"/>' },
            'Hidden Bunker':        { vb: '0 0 43.92 35.86',         d: '<path fill="currentColor" d="M0 31.954h43.923v3.904H0zM37.999 30.457h-9.761v-7.826c0-3.833-2.816-6.951-6.277-6.951s-6.277 3.118-6.277 6.951v7.826h-9.76v-7.826c0-9.214 7.195-16.711 16.037-16.711s16.037 7.497 16.037 16.711v7.826Z"/><path fill="currentColor" d="M43.923 30.457h-3.904v-8.496c0-9.957-8.1-18.057-18.057-18.057s-18.057 8.1-18.057 18.057v8.496H0v-8.496C0 9.852 9.852 0 21.962 0s21.961 9.852 21.961 21.961z"/>' },
            'Husk Graveyard':       { vb: '0 0 60 76',               d: '<path fill="currentColor" d="M44.118 0H33.53v11.529h-7.059V0H15.883L0 26v24l15.882 26H26.47V64.471h7.059V76h10.588l15.882-26V26zM54 46h-5.675C45.238 53.061 38.2 58 30 58s-15.237-4.939-18.325-12H6V30h5.675C14.762 22.939 21.8 18 30 18s15.237 4.939 18.325 12H54z"/><path fill="currentColor" d="M46 35.219h-5.241c-1.236-4.795-5.577-8.342-10.759-8.342s-9.522 3.547-10.759 8.342H14v5.562h5.241c1.236 4.795 5.577 8.342 10.759 8.342s9.522-3.547 10.759-8.342H46z"/>' },
            'Hurricane':            { vb: '0.22 0.6 89.56 84.81',    d: '<path fill="currentColor" fill-rule="evenodd" d="M73.772 71.622v-7.813c4.519 0 8.197-3.677 8.197-8.202 0-4.356-3.418-7.931-7.714-8.179v.003a6 6 0 0 0-.481-.018H.219v-7.812h73.464q.044-.002.089-.003.06 0 .118.003h.365v.009c8.604.253 15.526 7.332 15.526 15.997 0 8.827-7.181 16.015-16.009 16.015m-6.535-39.013v.012H6.229v-7.813h60.527q.245 0 .481-.018c4.297-.246 7.716-3.822 7.716-8.178 0-4.525-3.678-8.203-8.197-8.203-4.525 0-8.203 3.678-8.203 8.203h-7.812c0-8.828 7.187-16.015 16.015-16.015s16.009 7.187 16.009 16.015c0 8.665-6.923 15.744-15.528 15.997M52.543 53.391c8.605.253 15.528 7.332 15.528 15.997 0 8.828-7.181 16.015-16.009 16.015s-16.015-7.187-16.015-16.015h7.812c0 4.525 3.678 8.203 8.203 8.203 4.519 0 8.197-3.678 8.197-8.203 0-4.356-3.419-7.932-7.716-8.179a6 6 0 0 0-.481-.017H6.229v-7.813h46.314z"/>' },
            'Launch Tower Loot':    { vb: '0.41 0.34 65.19 87.31',   d: '<path fill="currentColor" fill-rule="evenodd" d="m48.848 16.637 16.747 71.019H35.643V.344h21.088V12.09h-5.552zm-31.696 0-2.331-4.547H9.269V.344h21.088v87.312H.405z"/>' },
            'Locked Gate':          { vb: '0.93 0.93 84.14 84.14',   d: '<path fill="currentColor" fill-rule="evenodd" d="M73.937 85.068V43c0-17.058-13.878-30.937-30.937-30.937S12.063 25.942 12.063 43v42.068H.932V43C.932 19.804 19.803.932 43 .932S85.068 19.804 85.068 43v42.068zM42.952 37.456a4.78 4.78 0 0 1 4.78 4.781v7.878h-9.56v-7.878a4.78 4.78 0 0 1 4.78-4.781m-5.518 29.06H19.535V43.068c0-12.938 10.526-23.464 23.465-23.464 12.937 0 23.464 10.526 23.464 23.464v42H55.332v-42c0-6.8-5.533-12.333-12.332-12.333-6.801 0-12.334 5.533-12.334 12.333v12.317h17.066v29.683H19.471V73.937h17.963z"/>' },
            'Lush Blooms':          { vb: '51.7 59.9 152.75 144.25', d: '<path fill="currentColor" d="m193.39 59.926 3.095.016q3.757.02 7.515.058.141 18.047.207 36.095.03 8.381.095 16.763.063 8.101.078 16.203.01 3.078.043 6.156c.115 11.308-.007 21.197-4.423 31.783l-1.145 2.753C192.35 184.558 179.702 194.897 165 201l-2.297.969c-6.65 2.287-13.149 2.175-20.094 2.105l-3.094-.016q-3.757-.02-7.515-.058a8736 8736 0 0 1-.207-36.095q-.03-8.382-.095-16.763-.063-8.102-.078-16.203a878 878 0 0 0-.043-6.156c-.115-11.308.007-21.197 4.423-31.783l1.145-2.753C143.65 79.442 156.298 69.103 171 63l2.297-.969c6.65-2.287 13.149-2.175 20.094-2.105M52 109q4.538-.043 9.074-.066c.85-.01 1.698-.018 2.573-.027 16.208-.067 30.564 5.674 42.291 16.833 10.15 10.14 17.993 23.666 18.29 38.3q-.002 2.792-.033 5.585l-.008 2.992c-.011 3.128-.036 6.255-.062 9.383q-.016 3.197-.027 6.395-.034 7.802-.098 15.605c-3.516.05-7.031.08-10.547.105l-2.995.043c-7.89.045-14.165-.984-21.458-4.148l-2.652-1.098C71.553 192.178 60.935 180.004 55 165c-2.449-7.421-3.423-14.125-3.293-21.918l.013-2.98c.016-3.096.054-6.193.093-9.29q.022-3.176.04-6.353c.033-5.153.085-10.306.147-15.459"/>' },
            'Matriarch':            { vb: '0.92 0.14 136.16 137.06', d: '<path fill="currentColor" fill-rule="evenodd" d="M111.671 126.488 86.232 101.05l25.731-25.731-25.731-25.722 25.439-25.438 25.411 25.402v51.525zM52.604 32.572l-16.2-16.205L52.627.145l16.402 16.401L85.424.145l16.223 16.222-16.199 16.205zM26.037 75.328l25.731 25.722-25.439 25.438L.918 101.086V49.561l25.411-25.402 25.439 25.438zM69 51.1l20 20-20 20-20.9-20zm30.133 86.108H38.918l30.108-30.152z"/>' },
            'Night Raid':           { vb: '0.12 0.84 191.76 190.32', d: '<path fill="currentColor" fill-rule="evenodd" d="M62.811 121.403c0-18.329 14.859-33.189 33.189-33.189s33.188 14.86 33.188 33.189S114.33 154.592 96 154.592s-33.189-14.859-33.189-33.189m40.564 69.755v-22.443c22.936-3.566 40.565-23.392 40.565-47.312 0-26.434-21.506-47.939-47.94-47.939s-47.94 21.505-47.94 47.939c0 23.92 17.629 43.745 40.564 47.312v22.443C39.122 187.388.121 146.057.121 95.59c0-47.936 35.18-87.652 81.128-94.748V15.83c-37.712 6.959-66.377 40.064-66.377 79.76 0 26.086 12.4 49.302 31.591 64.148-8.226-10.596-13.153-23.877-13.153-38.335 0-34.623 28.067-62.69 62.69-62.69s62.69 28.067 62.69 62.69c0 14.458-4.928 27.74-13.153 38.336 19.191-14.846 31.591-38.063 31.591-64.149 0-39.696-28.665-72.801-66.378-79.76V.842c45.949 7.096 81.129 46.812 81.129 94.748 0 50.467-39.001 91.798-88.504 95.568"/>' }
        };

        function updateFilterVisibility() {
            var okMaps = compatibleMaps();
            var okEvents = compatibleEvents();
            document.querySelectorAll('#arc-filter-maps-panel .arc-filter-icon-btn').forEach(function (b) {
                b.classList.toggle('arc-filter-icon-btn--hidden', !okMaps.includes(b.dataset.val));
            });
            document.querySelectorAll('#arc-filter-events-panel .arc-filter-icon-btn').forEach(function (b) {
                b.classList.toggle('arc-filter-icon-btn--hidden', !okEvents.includes(b.dataset.val));
            });
        }

        function makeDropdown(containerId, items, iconMap, getActive, setActive) {
            var dropdown = document.getElementById(containerId);
            var trigger = document.getElementById(containerId + '-trigger');
            var panel = document.getElementById(containerId + '-panel');
            var triggerIcon = trigger.querySelector('.arc-filter-icon-trigger-icon');
            var triggerLabel = trigger.querySelector('.arc-filter-icon-trigger-label');

            panel.innerHTML = items.map(function (val) {
                var icon = iconMap && iconMap[val];
                var svg = icon ? '<svg xmlns="http://www.w3.org/2000/svg" viewBox="' + icon.vb + '">' + icon.d + '</svg>' : '';
                return '<button class="arc-filter-icon-btn" data-val="' + val + '">' + svg + '<span>' + val + '</span></button>';
            }).join('');

            function updateTrigger() {
                var active = getActive();
                var icon = iconMap && active && iconMap[active];
                if (active) {
                    triggerIcon.innerHTML = icon ? '<svg xmlns="http://www.w3.org/2000/svg" viewBox="' + icon.vb + '">' + icon.d + '</svg>' : '';
                    triggerLabel.textContent = active;
                    trigger.classList.add('arc-filter-icon-trigger--active');
                } else {
                    triggerIcon.innerHTML = '';
                    triggerLabel.textContent = 'All';
                    trigger.classList.remove('arc-filter-icon-trigger--active');
                }
            }

            trigger.addEventListener('click', function (e) {
                e.stopPropagation();
                var isOpen = dropdown.classList.contains('arc-filter-icon-dropdown--open');
                document.querySelectorAll('.arc-filter-icon-dropdown--open').forEach(function (d) {
                    d.classList.remove('arc-filter-icon-dropdown--open');
                });
                if (!isOpen) dropdown.classList.add('arc-filter-icon-dropdown--open');
            });

            document.addEventListener('click', function () {
                dropdown.classList.remove('arc-filter-icon-dropdown--open');
            });

            panel.querySelectorAll('.arc-filter-icon-btn').forEach(function (btn) {
                btn.addEventListener('click', function (e) {
                    e.stopPropagation();
                    var val = btn.dataset.val;
                    setActive(getActive() === val ? null : val);
                    panel.querySelectorAll('.arc-filter-icon-btn').forEach(function (b) {
                        b.classList.toggle('arc-filter-icon-btn--active', b.dataset.val === getActive());
                    });
                    updateTrigger();
                    dropdown.classList.remove('arc-filter-icon-dropdown--open');
                    updateFilterVisibility();
                    renderUpcoming();
                });
            });
        }

        makeDropdown('arc-filter-maps', allMaps, null, function () { return activeMap; }, function (v) { activeMap = v; });
        makeDropdown('arc-filter-events', allEventNames, EVENT_ICONS, function () { return activeEvent; }, function (v) { activeEvent = v; });
        updateFilterVisibility();
        filtersEl.style.display = 'flex';

        renderUpcoming();
        upcomingEl.style.display = 'block';

        setInterval(function () {
            document.querySelectorAll('.arc-upcoming-in').forEach(function (el) {
                el.textContent = formatIn(parseInt(el.dataset.start, 10));
            });
        }, 60000);
    }

    var bpGrid = document.querySelector('.arc-bp-grid');

    function sizeBlueprints() {
        if (!bpGrid) return;
        if (window.innerWidth <= 900) {
            bpGrid.style.gridTemplateColumns = '';
            bpGrid.style.gridTemplateRows = '';
            return;
        }
        var w = bpGrid.clientWidth;
        var h = bpGrid.clientHeight;
        if (!w || !h) return;
        var n = bpGrid.querySelectorAll('.arc-bp-item').length;
        var gap = 6;
        var bestCols = 1, bestScore = 0;
        for (var cols = 1; cols <= n; cols++) {
            var rows = Math.ceil(n / cols);
            var score = Math.min(
                (w - (cols - 1) * gap) / cols,
                (h - (rows - 1) * gap) / rows
            );
            if (score > bestScore) { bestScore = score; bestCols = cols; }
        }
        var bestRows = Math.ceil(n / bestCols);
        bpGrid.style.gridTemplateColumns = 'repeat(' + bestCols + ', 1fr)';
        bpGrid.style.gridTemplateRows = 'repeat(' + bestRows + ', 1fr)';
    }

    if (bpGrid && window.ResizeObserver) {
        new ResizeObserver(sizeBlueprints).observe(bpGrid);
    }

    document.querySelectorAll('.arc-bp-item').forEach(function (el) {
        el.addEventListener('click', function () {
            document.querySelectorAll('.arc-bp-item').forEach(function (i) { i.classList.remove('arc-bp-item--active'); });
            el.classList.add('arc-bp-item--active');
            document.getElementById('arc-info-empty').style.display = 'none';
            var content = document.getElementById('arc-info-content');
            content.style.display = 'flex';
            document.getElementById('arc-info-img').src = el.dataset.img;
            document.getElementById('arc-info-name').textContent = el.dataset.name;
            var meta = document.getElementById('arc-info-meta');
            var rows = [];
            if (el.dataset.map) rows.push(['Map', el.dataset.map.split('|')]);
            if (el.dataset.condition) rows.push(['Condition', el.dataset.condition.split('|')]);
            if (el.dataset.containers) rows.push(['Found in', el.dataset.containers.split('|')]);
            if (el.dataset.scavengable) rows.push(['Scavengable', el.dataset.scavengable]);
            if (el.dataset.questReward) rows.push(['Quest Reward', el.dataset.questReward]);
            if (el.dataset.trialsReward) rows.push(['Trials Reward', el.dataset.trialsReward]);
            meta.innerHTML = rows.map(function (r) {
                var vals = Array.isArray(r[1]) ? r[1] : [r[1]];
                return '<div class="arc-info-row"><span class="arc-info-label">' + r[0] + '</span>'
                    + vals.map(function (v) { return '<span class="arc-info-value">' + v + '</span>'; }).join('')
                    + '</div>';
            }).join('');
        });
    });
})();
