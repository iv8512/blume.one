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

    document.addEventListener('DOMContentLoaded', function () {
        document.querySelectorAll('.dl-resist-track').forEach(initTrack);
    });
})();
