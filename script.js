/* ==========================================================
   Translating The World — Script principal
   ========================================================== */

(function () {
    'use strict';

    /* ---------- Envío de formularios (Web3Forms) ----------
       1. Date de alta en https://web3forms.com con el correo destinatario
       2. Sustituye la clave de abajo por tu "Access Key" (te llega por email) */
    const WEB3FORMS_ACCESS_KEY = '1edc12ed-b4f7-46bf-a567-c20414e60d08';
    const WEB3FORMS_ENDPOINT = 'https://api.web3forms.com/submit';

    // Envía un payload a Web3Forms. Devuelve true si llegó bien.
    // Extrae el email/nombre del propio payload para el remitente.
    const submitForm = async payload => {
        try {
            const response = await fetch(WEB3FORMS_ENDPOINT, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
                body: JSON.stringify({
                    access_key: WEB3FORMS_ACCESS_KEY,
                    botcheck: '',              // honeypot anti-spam (los formularios lo rellenan si un bot lo activa)
                    ...payload
                })
            });
            const result = await response.json();
            if (!response.ok || result.success !== true) {
                // Deja el motivo en consola (F12) para poder diagnosticar envíos fallidos
                console.warn('[Web3Forms] Envío rechazado:', result.message || result);
            }
            return response.ok && result.success === true;
        } catch (err) {
            console.warn('[Web3Forms] Error de red al enviar:', err);
            return false;
        }
    };

    /* ---------- Header con scroll ---------- */
    const header = document.getElementById('header');
    const updateHeader = () => {
        if (window.scrollY > 20) header.classList.add('is-scrolled');
        else header.classList.remove('is-scrolled');
    };
    // Sin header (página futura sin cabecera) no debe romperse el resto del script
    if (header) {
        window.addEventListener('scroll', updateHeader, { passive: true });
        updateHeader();
    }

    /* ---------- Menú móvil ---------- */
    const menuToggle = document.getElementById('menu-toggle');
    const nav = document.getElementById('nav');
    if (menuToggle && nav) {
        const setMenu = open => {
            menuToggle.classList.toggle('is-open', open);
            nav.classList.toggle('is-open', open);
            menuToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
            menuToggle.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
        };
        menuToggle.addEventListener('click', () => {
            setMenu(!nav.classList.contains('is-open'));
        });
        nav.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => setMenu(false));
        });
        // Al pasar a escritorio, asegura que el menú quede cerrado
        window.addEventListener('resize', () => {
            if (window.innerWidth > 720) setMenu(false);
        });
    }

    /* ---------- Contadores animados ---------- */
    const counters = document.querySelectorAll('[data-counter]');
    const animateCounter = el => {
        const target = parseInt(el.dataset.counter, 10);
        const duration = 1500;
        const start = performance.now();
        const step = now => {
            const progress = Math.min((now - start) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            const value = Math.round(target * eased);
            el.textContent = target >= 100
                ? value.toLocaleString('es-ES') + '+'
                : String(value);
            if (progress < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
    };

    const counterObserver = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                animateCounter(entry.target);
                counterObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.5 });
    counters.forEach(c => counterObserver.observe(c));

    /* ---------- Reveal on scroll ---------- */
    const revealEls = document.querySelectorAll(
        '.lang-card, .tst-card, .teacher-card, .custom__form, .contact__form, .section__head'
    );
    revealEls.forEach(el => el.classList.add('reveal'));

    const revealObserver = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
                revealObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });
    revealEls.forEach(el => revealObserver.observe(el));

    /* ---------- Tarjetas de profesores (flip) ---------- */
    document.querySelectorAll('.teacher-card__flip').forEach(btn => {
        btn.addEventListener('click', () => {
            const card = btn.closest('.teacher-card');
            const flipped = card.classList.toggle('is-flipped');
            card.querySelectorAll('.teacher-card__flip').forEach(b => {
                b.setAttribute('aria-expanded', flipped ? 'true' : 'false');
            });
        });
    });

    /* ---------- Carrusel de testimonios ---------- */
    (() => {
        const carousel = document.getElementById('tst-carousel');
        if (!carousel) return;
        const track = carousel.querySelector('.tst__track');
        const cards = track.querySelectorAll('.tst-card');
        const prevBtn = carousel.querySelector('.tst__nav--prev');
        const nextBtn = carousel.querySelector('.tst__nav--next');
        const dotsContainer = carousel.querySelector('.tst__dots');
        if (!track || cards.length === 0) return;

        // Construir un dot por testimonio (1 tarjeta visible a la vez)
        const buildDots = () => {
            dotsContainer.innerHTML = '';
            cards.forEach((_, i) => {
                const dot = document.createElement('button');
                dot.type = 'button';
                dot.className = 'tst__dot';
                dot.setAttribute('role', 'tab');
                dot.setAttribute('aria-label', `Ir al testimonio ${i + 1} de ${cards.length}`);
                dot.dataset.index = String(i);
                dot.addEventListener('click', () => goTo(i));
                dotsContainer.appendChild(dot);
            });
        };
        buildDots();

        // Desplaza el track al inicio de la tarjeta i
        const goTo = (index) => {
            const target = cards[index];
            if (!target) return;
            const left = target.offsetLeft - track.offsetLeft;
            track.scrollTo({ left, behavior: 'smooth' });
        };

        const updateActiveDot = () => {
            const scrollLeft = track.scrollLeft;
            // Usa offsetLeft para detectar el card activo (más fiable que offsetWidth+gap)
            const trackLeft = track.offsetLeft;
            let activeIndex = 0;
            let minDist = Infinity;
            cards.forEach((card, i) => {
                const dist = Math.abs(card.offsetLeft - trackLeft - scrollLeft);
                if (dist < minDist) { minDist = dist; activeIndex = i; }
            });
            const dots = dotsContainer.querySelectorAll('.tst__dot');
            dots.forEach((d, i) => d.classList.toggle('is-active', i === activeIndex));
        };
        track.addEventListener('scroll', () => {
            window.requestAnimationFrame(updateActiveDot);
        });

        prevBtn && prevBtn.addEventListener('click', () => {
            const trackLeft = track.offsetLeft;
            let current = 0;
            let minDist = Infinity;
            cards.forEach((card, i) => {
                const dist = Math.abs(card.offsetLeft - trackLeft - track.scrollLeft);
                if (dist < minDist) { minDist = dist; current = i; }
            });
            goTo(Math.max(0, current - 1));
        });
        nextBtn && nextBtn.addEventListener('click', () => {
            const trackLeft = track.offsetLeft;
            let current = 0;
            let minDist = Infinity;
            cards.forEach((card, i) => {
                const dist = Math.abs(card.offsetLeft - trackLeft - track.scrollLeft);
                if (dist < minDist) { minDist = dist; current = i; }
            });
            goTo(Math.min(cards.length - 1, current + 1));
        });

        // Inicializar dot activo
        updateActiveDot();
    })();

    /* ---------- Tabs de Recursos / Experiencias ---------- */
    (() => {
        const tabs = document.querySelectorAll('.resources__tab');
        const panels = document.querySelectorAll('.resources__panel');
        if (!tabs.length || !panels.length) return;

        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const targetId = tab.dataset.target;
                tabs.forEach(t => {
                    const isActive = t === tab;
                    t.classList.toggle('is-active', isActive);
                    t.setAttribute('aria-selected', isActive ? 'true' : 'false');
                });
                panels.forEach(p => {
                    const isActive = p.id === targetId;
                    p.classList.toggle('is-active', isActive);
                    if (isActive) p.removeAttribute('hidden');
                    else p.setAttribute('hidden', '');
                });
            });
        });
    })();

    /* ---------- Validación y envío de formularios ---------- */
    const showFeedback = (el, msg, ok) => {
        el.textContent = msg;
        el.classList.toggle('is-success', ok);
        el.classList.toggle('is-error', !ok);
    };

    const validateFields = form => {
        let valid = true;
        form.querySelectorAll('[required]').forEach(field => {
            field.classList.remove('is-error');
            const value = (field.value || '').trim();
            let fieldOk = value.length > 0;
            if (fieldOk && field.type === 'email') {
                fieldOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
            }
            if (!fieldOk) {
                field.classList.add('is-error');
                valid = false;
            }
        });
        return valid;
    };

    const customForm = document.getElementById('custom-form');
    const customFeedback = document.getElementById('custom-feedback');
    if (customForm) {
        customForm.addEventListener('submit', async e => {
            e.preventDefault();
            if (!validateFields(customForm)) {
                showFeedback(customFeedback, 'Por favor, rellena todos los campos obligatorios.', false);
                return;
            }
            const data = Object.fromEntries(new FormData(customForm).entries());
            showFeedback(customFeedback, 'Enviando solicitud…', true);
            const sent = await submitForm({
                subject: 'Solicitud de curso a medida — ' + (data.name || 'web'),
                from_name: 'Web Translating The World',
                ...data
            });
            if (!sent) {
                showFeedback(customFeedback, 'No se pudo enviar la solicitud. Inténtalo de nuevo o escríbenos por WhatsApp.', false);
                return;
            }
            showFeedback(
                customFeedback,
                `¡Gracias, ${data.name.split(' ')[0]}! Hemos recibido tu solicitud. Te escribiremos en menos de 24 h.`,
                true
            );
            customForm.reset();
        });
    }

    const contactForm = document.getElementById('contact-form');
    const contactFeedback = document.getElementById('contact-feedback');
    if (contactForm) {
        contactForm.addEventListener('submit', async e => {
            e.preventDefault();
            if (!validateFields(contactForm)) {
                showFeedback(contactFeedback, 'Revisa los campos marcados en rojo.', false);
                return;
            }
            const data = Object.fromEntries(new FormData(contactForm).entries());
            showFeedback(contactFeedback, 'Enviando mensaje…', true);
            const sent = await submitForm({
                subject: 'Mensaje de contacto — ' + (data['c-name'] || data.name || 'web'),
                from_name: 'Web Translating The World',
                ...data
            });
            if (!sent) {
                showFeedback(contactFeedback, 'No se pudo enviar el mensaje. Inténtalo de nuevo o escríbenos por WhatsApp.', false);
                return;
            }
            showFeedback(contactFeedback, '¡Mensaje enviado! Te respondemos hoy mismo.', true);
            contactForm.reset();
        });
    }

    /* ---------- Botones de idiomas → preseleccionan asunto del formulario ---------- */
    const subjectField = document.getElementById('c-subject');
    const nameField = document.getElementById('c-name');

    const fillSubject = (text) => {
        if (!subjectField) return;
        subjectField.value = text;
        subjectField.scrollIntoView({ behavior: 'smooth', block: 'center' });
        subjectField.focus({ preventScroll: true });
        // leve pulsación visual
        subjectField.style.transition = 'box-shadow 0.6s, border-color 0.6s';
        subjectField.style.boxShadow = '0 0 0 4px rgba(184, 53, 15, 0.18)';
        setTimeout(() => { subjectField.style.boxShadow = ''; }, 800);
    };

    document.querySelectorAll('[data-info]').forEach(btn => {
        btn.addEventListener('click', () => {
            fillSubject(`Más información sobre ${btn.dataset.info}`);
            if (nameField) nameField.focus({ preventScroll: true });
        });
    });

    document.querySelectorAll('[data-trial]').forEach(btn => {
        btn.addEventListener('click', () => {
            fillSubject(`Solicitar clase de prueba de ${btn.dataset.trial}`);
            if (nameField) nameField.focus({ preventScroll: true });
        });
    });

    /* ---------- Año dinámico ---------- */
    const yearEl = document.getElementById('year');
    if (yearEl) yearEl.textContent = new Date().getFullYear();

    /* ---------- Cookies (RGPD) ---------- */
    const CookieConsent = (() => {
        const STORAGE_KEY = 'tw_cookie_consent';
        const banner = document.getElementById('cookie-banner');
        const modal  = document.getElementById('cookie-modal');
        const analyticsInput = document.getElementById('cookie-analytics');
        const preferencesInput = document.getElementById('cookie-preferences');
        if (!banner || !modal) return null;

        const get = () => {
            try { return JSON.parse(localStorage.getItem(STORAGE_KEY)); }
            catch { return null; }
        };
        const set = (value) => {
            try {
                localStorage.setItem(STORAGE_KEY, JSON.stringify({
                    ...value,
                    timestamp: new Date().toISOString()
                }));
            } catch {}
        };

        const showBanner = () => {
            banner.removeAttribute('hidden');
            banner.style.display = 'block';
        };
        const hideBanner = () => {
            banner.style.display = 'none';
            banner.setAttribute('hidden', '');
        };
        const openModal  = () => {
            const current = get();
            if (current) {
                if (analyticsInput)     analyticsInput.checked     = !!current.analytics;
                if (preferencesInput)  preferencesInput.checked   = !!current.preferences;
            }
            modal.removeAttribute('hidden');
            modal.style.display = 'flex';
            document.body.style.overflow = 'hidden';
        };
        const closeModal = () => {
            modal.style.display = 'none';
            modal.setAttribute('hidden', '');
            document.body.style.overflow = '';
        };

        const apply = (decision) => {
            set(decision);
            window.dispatchEvent(new CustomEvent('cookieconsent', { detail: decision }));
        };

        // Acciones
        const actions = {
            accept: () => apply({ analytics: true,  preferences: true }),
            reject: () => apply({ analytics: false, preferences: false }),
            save:   () => apply({
                analytics:   !!(analyticsInput && analyticsInput.checked),
                preferences: !!(preferencesInput && preferencesInput.checked)
            }),
            config: openModal
        };

        const handleAction = (action) => {
            console.log('[cookies] action:', action);
            if (typeof actions[action] === 'function') {
                actions[action]();
            }
            hideBanner();
            closeModal();
        };

        // Listeners — banner
        banner.addEventListener('click', e => {
            const btn = e.target.closest('[data-cookie-action]');
            if (!btn) return;
            e.preventDefault();
            handleAction(btn.dataset.cookieAction);
        });

        // Listeners — modal (botones de acción)
        modal.addEventListener('click', e => {
            const actionBtn = e.target.closest('[data-cookie-action]');
            if (actionBtn) {
                e.preventDefault();
                handleAction(actionBtn.dataset.cookieAction);
                return;
            }
            const closeBtn = e.target.closest('[data-cookie-close]');
            if (closeBtn) {
                e.preventDefault();
                closeModal();
            }
        });

        document.addEventListener('keydown', e => {
            if (e.key === 'Escape' && !modal.hasAttribute('hidden')) closeModal();
        });

        // Mostrar banner si no hay consentimiento previo
        if (!get()) {
            setTimeout(showBanner, 400);
        }

        // Activar scripts de terceros bloqueados hasta obtener consentimiento.
        // Uso en el HTML:
        //   <script type="text/plain" data-consent="analytics" src="..."></script>
        const enableThirdPartyScripts = (decision) => {
            const map = { analytics: !!decision.analytics, preferences: !!decision.preferences };
            document.querySelectorAll('script[type="text/plain"][data-consent]').forEach(node => {
                const kind = node.dataset.consent;
                if (!map[kind]) return;
                const s = document.createElement('script');
                for (const attr of node.attributes) {
                    if (attr.name === 'type' || attr.name === 'data-consent') continue;
                    s.setAttribute(attr.name, attr.value);
                }
                if (!s.src && node.textContent) s.text = node.textContent;
                node.parentNode.replaceChild(s, node);
            });
            // Google Consent Mode v2 — actualizar estado
            if (typeof window.gtag === 'function') {
                window.gtag('consent', 'update', {
                    analytics_storage: map.analytics ? 'granted' : 'denied',
                    ad_storage: map.analytics ? 'granted' : 'denied',
                    ad_user_data: map.analytics ? 'granted' : 'denied',
                    ad_personalization: map.analytics ? 'granted' : 'denied'
                });
            }
        };

        // Reaccionar a eventos de consentimiento (aplicados por cualquier acción)
        window.addEventListener('cookieconsent', e => enableThirdPartyScripts(e.detail || {}));

        // Si ya había un consentimiento previo guardado, aplicarlo al cargar
        const stored = get();
        if (stored) enableThirdPartyScripts(stored);

        return { open: openModal };
    })();
    window.CookieConsent = CookieConsent;

    /* ---------- Prueba de nivel (página dedicada) ---------- */
    const LevelTestPage = (() => {
        const step1 = document.getElementById('test-step-1');
        if (!step1) return null;

        const step2       = document.getElementById('test-step-2');
        const step3       = document.getElementById('test-step-3');
        const form1       = document.getElementById('test-step-1-form');
        const form2       = document.getElementById('test-step-2-form');
        const questionsBox = document.getElementById('test-questions');
        const progressBar = document.getElementById('test-progress-bar');
        const progressLabel = document.getElementById('test-progress-label');
        const progressText = document.getElementById('test-progress-text');
        const progressRoot = document.querySelector('.test__progress');
        const successEmail = document.getElementById('test-success-email');

        const steps = [step1, step2, step3].filter(Boolean);
        const TOTAL_STEPS = steps.length;

        // Estado del alumno
        const state = { data: null, answers: {}, score: null };

        const goToStep = (n) => {
            steps.forEach(s => s.classList.toggle('is-active', Number(s.id.replace('test-step-', '')) === n));
            const pct = (n / TOTAL_STEPS) * 100;
            if (progressBar) progressBar.style.setProperty('--test-progress', pct + '%');
            if (progressLabel) progressLabel.innerHTML = 'Paso <strong>' + n + '</strong> de ' + TOTAL_STEPS;
            if (progressRoot) progressRoot.setAttribute('aria-valuenow', String(n));
            window.scrollTo({ top: 0, behavior: 'smooth' });
        };

        const validateStep1 = (form) => {
            let ok = true;
            form.querySelectorAll('[required]').forEach(field => {
                field.classList.remove('is-error');
                const value = (field.value || '').trim();
                let fieldOk = value.length > 0;
                if (fieldOk && field.type === 'email') {
                    fieldOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
                }
                if (field.type === 'checkbox') fieldOk = field.checked;
                if (!fieldOk) { field.classList.add('is-error'); ok = false; }
            });
            return ok;
        };

        const gradeQuiz = () => {
            const sets = questionsBox ? questionsBox.querySelectorAll('.test__question[data-correct]') : [];
            if (!sets.length) return null;
            let correct = 0;
            const detail = [];
            sets.forEach(set => {
                const name = set.querySelector('input[type="radio"]')?.name;
                const expected = set.dataset.correct;
                const checked = questionsBox.querySelector(`input[name="${name}"]:checked`);
                const got = checked ? checked.value : null;
                const ok = got === expected;
                if (ok) correct++;
                detail.push({ question: name, expected, got, ok });
            });
            return { correct, total: sets.length, detail };
        };

        const updateProgress = () => {
            if (!progressText || !questionsBox) return;
            const total = questionsBox.querySelectorAll('.test__question').length;
            const answered = questionsBox.querySelectorAll('.test__question input[type="radio"]:checked').length;
            progressText.textContent = answered + ' / ' + total;
        };

        // Listeners
        document.querySelectorAll('[data-test-prev]').forEach(btn => {
            btn.addEventListener('click', () => goToStep(1));
        });

        // Quitar estado de error al cambiar
        if (questionsBox) {
            questionsBox.addEventListener('change', e => {
                if (e.target.matches('input[type="radio"]')) {
                    const fieldset = e.target.closest('.test__question');
                    if (fieldset) fieldset.classList.remove('is-error');
                    updateProgress();
                }
            });
        }

        // Paso 1 → Paso 2
        form1?.addEventListener('submit', e => {
            e.preventDefault();
            if (!validateStep1(form1)) {
                // Scroll al primer campo con error
                const firstError = form1.querySelector('.is-error');
                if (firstError) firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
                return;
            }
            state.data = Object.fromEntries(new FormData(form1).entries());
            updateProgress();
            goToStep(2);
        });

        // Limpiar formulario paso 1
        form1?.addEventListener('reset', () => {
            setTimeout(() => {
                form1.querySelectorAll('.is-error').forEach(el => el.classList.remove('is-error'));
            }, 0);
        });

        // Paso 2 → Paso 3
        form2?.addEventListener('submit', async e => {
            e.preventDefault();
            const submitError = document.getElementById('test-submit-error');
            const sets = questionsBox ? questionsBox.querySelectorAll('.test__question') : [];
            let allAnswered = true;
            let firstUnanswered = null;
            sets.forEach(set => {
                const name = set.querySelector('input[type="radio"]')?.name;
                if (name && !questionsBox.querySelector(`input[name="${name}"]:checked`)) {
                    allAnswered = false;
                    set.classList.add('is-error');
                    if (!firstUnanswered) firstUnanswered = set;
                } else {
                    set.classList.remove('is-error');
                }
            });
            if (sets.length && !allAnswered) {
                if (firstUnanswered) firstUnanswered.scrollIntoView({ behavior: 'smooth', block: 'center' });
                return;
            }

            state.answers = {};
            sets.forEach(set => {
                const name = set.querySelector('input[type="radio"]')?.name;
                if (!name) return;
                const checked = questionsBox.querySelector(`input[name="${name}"]:checked`);
                state.answers[name] = checked ? checked.value : null;
            });

            state.score = gradeQuiz();

            // Desglose legible para el correo: una línea por pregunta
            const detail = {};
            (state.score?.detail || []).forEach(d => {
                const n = d.question.replace('q', '');
                detail[`Pregunta ${n} (correcta: ${d.expected})`] =
                    (d.got || '—') + (d.ok ? ' ✓' : ' ✗');
            });

            // Envío real a Web3Forms
            const submitBtn = form2.querySelector('button[type="submit"]');
            if (submitBtn) submitBtn.disabled = true;
            if (submitError) submitError.hidden = true;

            const sent = await submitForm({
                subject: `Prueba de nivel — ${state.data?.name || 'alumno'} (${state.score?.correct ?? '?'}/${state.score?.total ?? '?'})`,
                from_name: 'Web Translating The World',
                submittedAt: new Date().toISOString(),
                ...state.data,
                'Puntuación automática': `${state.score?.correct ?? '?'} de ${state.score?.total ?? '?'}`,
                ...detail,
                // Honeypot del paso 2: si un bot lo marcó, Web3Forms lo descarta como spam
                botcheck: form2.elements['botcheck']?.checked ? 'on' : ''
            });

            if (!sent) {
                if (submitBtn) submitBtn.disabled = false;
                if (submitError) {
                    submitError.textContent = 'No se pudo enviar la prueba. Revisa tu conexión e inténtalo de nuevo, o escríbenos por WhatsApp.';
                    submitError.hidden = false;
                    submitError.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
                return;
            }

            // Pintamos el email en la pantalla de éxito
            if (successEmail && state.data && state.data.email) {
                successEmail.textContent = state.data.email;
            }

            goToStep(3);
        });

        return { goToStep };
    })();
    window.LevelTestPage = LevelTestPage;
})();
