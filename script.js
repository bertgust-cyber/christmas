(function () {
    'use strict';

    // Die Mitbringliste bleibt vorerst deaktiviert. Zum Aktivieren auf true setzen.
    const SHOW_BRING_LIST = false;

    const SUPABASE_URL = 'https://dggelnithrqlwztsdsoc.supabase.co';
    const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_WKhAHWI5cjLONXz_jgllKA_e7sxhSFg';

    // Keine Website-Anmeldung: Anfragen laufen als nicht angemeldeter Besucher.
    // Datenbankzugriff wird durch Supabase-Grants und RLS-Policies begrenzt.
    const supabaseClient = window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_PUBLISHABLE_KEY,
        {
            auth: {
                persistSession: false,
                autoRefreshToken: false,
                detectSessionInUrl: false
            }
        }
    );

    // Datum und Uhrzeit hier eintragen, sobald sie feststehen.
    const EVENT = {
        date: '',
        time: '',
        place: 'Bei uns zu Hause'
    };

    document.getElementById('eventDate').textContent = EVENT.date || 'Termin folgt';
    document.getElementById('eventTime').textContent = EVENT.time || 'Uhrzeit folgt';
    document.getElementById('eventPlace').textContent = EVENT.place;

    const root = document.documentElement;
    let toastTimer;

    function toast(message) {
        const toastElement = document.getElementById('toast');
        toastElement.textContent = message;
        toastElement.classList.add('show');
        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => toastElement.classList.remove('show'), 2600);
    }

    const bringSection = document.getElementById('mitbringen');
    const bringNavLink = document.querySelector('nav a[href="#mitbringen"]');
    bringSection.hidden = !SHOW_BRING_LIST;
    if (bringNavLink) bringNavLink.hidden = !SHOW_BRING_LIST;

    // Godot-Webexport im eigenen Tab öffnen (funktioniert auch über HTTPS-Tunnel).
    const startGodotGameButton = document.getElementById('startGodotGame');
    startGodotGameButton.addEventListener('click', () => {
        window.open('./game/index.html', '_blank', 'noopener,noreferrer');
    });

    document.getElementById('themeBtn').addEventListener('click', function () {
        const isDay = root.dataset.theme !== 'day';
        root.dataset.theme = isDay ? 'day' : 'night';
        this.textContent = isDay ? '☾' : '☼';
        this.setAttribute('aria-label', isDay ? 'Nachtansicht aktivieren' : 'Tagansicht aktivieren');
    });

    // Schneefall: begrenzte Auflösung, pausiert bei inaktivem Tab.
    const canvas = document.getElementById('sky');
    const ctx = canvas.getContext('2d');
    let flakes = [];
    let width = 0;
    let height = 0;
    let animationFrame = 0;
    let lastFrame = 0;
    let snowPaused = false;
    const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

    function drawSnow(now, deltaTime) {
        ctx.clearRect(0, 0, width, height);
        for (const flake of flakes) {
            if (!reduceMotion && !snowPaused) {
                flake.y += flake.speed * deltaTime;
                flake.x += Math.sin(now / 1500 + flake.phase) * flake.drift * deltaTime;
                if (flake.y > height + 5) {
                    flake.y = -5;
                    flake.x = Math.random() * width;
                }
                if (flake.x < -8) flake.x = width + 5;
                if (flake.x > width + 8) flake.x = -5;
            }
            ctx.beginPath();
            ctx.fillStyle = `rgba(255,255,255,${flake.alpha})`;
            ctx.shadowColor = 'rgba(255,255,255,.65)';
            ctx.shadowBlur = flake.radius > 2 ? 6 : 2;
            ctx.arc(flake.x, flake.y, flake.radius, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.shadowBlur = 0;
    }

    function resizeSnow() {
        const pixelRatio = Math.min(devicePixelRatio || 1, 1.7);
        width = innerWidth;
        height = innerHeight;
        canvas.width = Math.round(width * pixelRatio);
        canvas.height = Math.round(height * pixelRatio);
        ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
        flakes = [];
        const amount = Math.min(115, Math.max(35, Math.floor(width * height / 11500)));
        for (let i = 0; i < amount; i++) {
            flakes.push({
                x: Math.random() * width,
                y: Math.random() * height,
                radius: Math.random() * 2.5 + 0.6,
                speed: 15 + Math.random() * 32,
                drift: Math.random() * 18 - 9,
                phase: Math.random() * 6.28,
                alpha: 0.25 + Math.random() * 0.65
            });
        }
        drawSnow(0, 0);
    }

    function snowTick(now) {
        if (snowPaused || document.hidden || reduceMotion) return;
        const deltaTime = Math.min(0.05, Math.max(0, (now - lastFrame) / 1000));
        lastFrame = now;
        drawSnow(now, deltaTime);
        animationFrame = requestAnimationFrame(snowTick);
    }

    function startSnow() {
        cancelAnimationFrame(animationFrame);
        if (!snowPaused && !document.hidden && !reduceMotion) {
            lastFrame = performance.now();
            animationFrame = requestAnimationFrame(snowTick);
        }
    }

    document.getElementById('snowBtn').addEventListener('click', function () {
        snowPaused = !snowPaused;
        this.textContent = snowPaused ? '▶' : '❄';
        this.setAttribute('aria-label', snowPaused ? 'Schneefall fortsetzen' : 'Schneefall pausieren');
        if (snowPaused) {
            cancelAnimationFrame(animationFrame);
            drawSnow(0, 0);
        } else {
            startSnow();
        }
    });

    addEventListener('resize', resizeSnow);
    document.addEventListener('visibilitychange', startSnow);
    resizeSnow();
    startSnow();

    // Sanfte Einblendungen, bei reduzierter Bewegung ohne Animation.
    if ('IntersectionObserver' in window && !reduceMotion) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.12 });
        document.querySelectorAll('.reveal').forEach((element) => observer.observe(element));
    } else {
        document.querySelectorAll('.reveal').forEach((element) => element.classList.add('visible'));
    }

    function node(tag, className, text) {
        const element = document.createElement(tag);
        if (className) element.className = className;
        if (text !== undefined) element.textContent = text;
        return element;
    }

    async function renderRsvp() {
        const entriesBox = document.getElementById('rsvpEntries');
        const countElement = document.getElementById('rsvpCount');
        entriesBox.replaceChildren();

        const { data: entries, error } = await supabaseClient
            .from('rsvps')
            .select('name, person_count')
            .order('name', { ascending: true });

        if (error) {
            console.error('Zusagen konnten nicht geladen werden:', error);
            countElement.textContent = 'Zusagen konnten gerade nicht geladen werden.';
            entriesBox.appendChild(node('div', 'empty', 'Die gemeinsame Liste ist vorübergehend nicht erreichbar.'));
            return;
        }

        const totalPeople = entries.reduce((sum, entry) => sum + Number(entry.person_count), 0);
        countElement.textContent = entries.length
            ? `${totalPeople} ${totalPeople === 1 ? 'Person freut sich' : 'Personen freuen sich'} schon auf das Treffen.`
            : 'Noch keine Zusagen eingetragen.';

        if (entries.length === 0) {
            entriesBox.appendChild(node('div', 'empty', 'Die gemeinsame Teilnehmerliste ist noch leer.'));
            return;
        }

        entries.forEach((entry) => {
            const row = node('div', 'entry');
            row.appendChild(node('b', '', `${entry.name} · ${entry.person_count} ${Number(entry.person_count) === 1 ? 'Person' : 'Personen'}`));
            entriesBox.appendChild(row);
        });
    }

    document.getElementById('rsvpForm').addEventListener('submit', async function (event) {
        event.preventDefault();
        const name = document.getElementById('rName').value.trim();
        const rawCount = Number(document.getElementById('rCount').value) || 1;
        const personCount = Math.max(1, Math.min(20, rawCount));
        if (!name) return;

        const button = this.querySelector('button[type="submit"]');
        button.disabled = true;
        try {
            const { error } = await supabaseClient
                .from('rsvps')
                .insert({ name, person_count: personCount });

            if (error) {
                console.error('Zusage konnte nicht gespeichert werden:', error);
                toast('Speichern fehlgeschlagen. Bitte versuche es erneut.');
                return;
            }

            this.reset();
            document.getElementById('rCount').value = '1';
            await renderRsvp();
            toast('Zusage gespeichert ♥');
        } catch (error) {
            console.error('Unerwarteter Fehler beim Speichern:', error);
            toast('Verbindungsfehler beim Speichern.');
        } finally {
            button.disabled = false;
        }
    });

    async function renderBring() {
        const entriesBox = document.getElementById('bringEntries');
        const countElement = document.getElementById('bringCount');
        entriesBox.replaceChildren();

        const { data: entries, error } = await supabaseClient
            .from('bring_items')
            .select('id, item, who, created_at')
            .order('created_at', { ascending: true });

        if (error) {
            console.error('Mitbringliste konnte nicht geladen werden:', error);
            countElement.textContent = 'Mitbringliste konnte nicht geladen werden.';
            entriesBox.appendChild(node('div', 'empty', 'Die Mitbringliste ist vorübergehend nicht erreichbar.'));
            return;
        }

        countElement.textContent = entries.length
            ? `${entries.length} ${entries.length === 1 ? 'Beitrag steht' : 'Beiträge stehen'} schon auf der Liste.`
            : 'Noch ist alles offen – die Liste freut sich auf Ideen.';

        if (!entries.length) {
            entriesBox.appendChild(node('div', 'empty', 'Noch keine Beiträge. Was darf auf keinen Fall fehlen?'));
            return;
        }

        entries.forEach((entry) => {
            const row = node('div', 'entry');
            const left = node('div');
            left.appendChild(node('b', '', entry.item));
            left.appendChild(node('small', '', `Bringt mit: ${entry.who}`));
            row.appendChild(left);
            entriesBox.appendChild(row);
        });
    }

    if (SHOW_BRING_LIST) {
        document.getElementById('bringForm').addEventListener('submit', async function (event) {
            event.preventDefault();
            const item = document.getElementById('bItem').value.trim();
            const who = document.getElementById('bWho').value.trim();
            if (!item || !who) return;

            const button = this.querySelector('button[type="submit"]');
            button.disabled = true;
            try {
                const { error } = await supabaseClient.from('bring_items').insert({ item, who });
                if (error) {
                    console.error('Mitbringeintrag konnte nicht gespeichert werden:', error);
                    toast('Speichern fehlgeschlagen. Bitte versuche es erneut.');
                    return;
                }
                this.reset();
                await renderBring();
                toast('Auf die Mitbringliste gesetzt 🎁');
            } catch (error) {
                console.error('Unerwarteter Fehler:', error);
                toast('Verbindungsfehler beim Speichern.');
            } finally {
                button.disabled = false;
            }
        });
    }

    // Aufruf beim Laden, ohne Anmeldung.
    renderRsvp();
    if (SHOW_BRING_LIST) renderBring();
})();
