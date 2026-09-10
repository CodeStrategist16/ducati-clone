"use strict";

document.addEventListener("DOMContentLoaded", () => {
    const $ = (selector, scope = document) => scope.querySelector(selector);
    const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const menuToggle = $("#menuToggle");
    const navLinks = $("#navLinks");
    const navItems = $$(".nav-links a");
    const form = $("#testRideForm");
    const bikeSelect = $("#bike");
    const dateInput = $("#date");
    const termsInput = $("#terms");
    const formMessage = $("#formMessage");
    const choiceMessage = $("#choiceMessage");
    const changeMotorcycle = $("#changeMotorcycle");

    const todayISO = () => {
        const now = new Date();
        const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
        return local.toISOString().slice(0, 10);
    };

    const setMenu = (open) => {
        if (!menuToggle || !navLinks) return;
        navLinks.classList.toggle("open", open);
        menuToggle.setAttribute("aria-expanded", String(open));
        menuToggle.setAttribute("aria-label", open ? "Close navigation menu" : "Open navigation menu");
        document.body.classList.toggle("menu-open", open);
    };

    menuToggle?.addEventListener("click", () => {
        setMenu(!navLinks.classList.contains("open"));
    });

    navItems.forEach((link) => link.addEventListener("click", () => setMenu(false)));

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape") setMenu(false);
    });

    document.addEventListener("click", (event) => {
        if (!navLinks?.classList.contains("open")) return;
        if (navLinks.contains(event.target) || menuToggle.contains(event.target)) return;
        setMenu(false);
    });

    window.addEventListener("resize", () => {
        if (window.innerWidth > 820) setMenu(false);
    });

    /* Active navigation — maps the visible content sections to the simple nav. */
    const observedSections = [$("#home"), $("#bikes"), $("#specs"), $("#booking")].filter(Boolean);
    const navMap = new Map(navItems.map((link) => [link.dataset.section, link]));

    if ("IntersectionObserver" in window) {
        const navObserver = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (!entry.isIntersecting) return;
                navMap.forEach((link, id) => {
                    if (id === entry.target.id) link.setAttribute("aria-current", "true");
                    else link.removeAttribute("aria-current");
                });
            });
        }, { rootMargin: "-38% 0px -55% 0px", threshold: 0 });
        observedSections.forEach((section) => navObserver.observe(section));
    }

    /* Reveal-on-scroll */
    const revealItems = $$(".reveal");
    if (prefersReducedMotion || !("IntersectionObserver" in window)) {
        revealItems.forEach((item) => item.classList.add("is-visible"));
    } else {
        const revealObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach((entry) => {
                if (!entry.isIntersecting) return;
                entry.target.classList.add("is-visible");
                observer.unobserve(entry.target);
            });
        }, { threshold: 0.12, rootMargin: "0px 0px -35px 0px" });
        revealItems.forEach((item) => revealObserver.observe(item));
    }

    /* Test-ride date: today or a future date only. */
    if (dateInput) dateInput.min = todayISO();

    const setFormMessage = (message = "", state = "") => {
        if (!formMessage) return;
        formMessage.textContent = message;
        if (state) formMessage.dataset.state = state;
        else delete formMessage.dataset.state;
    };

    const selectBike = (bikeName, shouldScroll = true) => {
        if (!bikeSelect || !bikeName) return;
        const optionExists = [...bikeSelect.options].some((option) => option.value === bikeName);
        if (!optionExists) return;

        bikeSelect.value = bikeName;
        if (choiceMessage) {
            choiceMessage.innerHTML = `You selected <strong>${bikeName}</strong>.<br>Complete the test-ride request below to continue.`;
        }

        if (shouldScroll) {
            $("#booking")?.scrollIntoView({ behavior: prefersReducedMotion ? "auto" : "smooth", block: "start" });
            window.setTimeout(() => bikeSelect.focus({ preventScroll: true }), prefersReducedMotion ? 0 : 500);
        }
    };

    $$(".select-bike").forEach((button) => {
        button.addEventListener("click", () => selectBike(button.dataset.bike, true));
    });

    changeMotorcycle?.addEventListener("click", () => {
        $("#bikes")?.scrollIntoView({ behavior: prefersReducedMotion ? "auto" : "smooth", block: "start" });
    });

    form?.addEventListener("submit", (event) => {
        event.preventDefault();
        setFormMessage();

        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }

        if (!dateInput?.value || dateInput.value < todayISO()) {
            setFormMessage("Please choose today or a future date.", "error");
            dateInput?.focus();
            return;
        }

        if (!termsInput?.checked) {
            setFormMessage("Please agree to the terms and conditions.", "error");
            termsInput?.focus();
            return;
        }

        const name = $("#name")?.value.trim() || "Rider";
        const email = $("#email")?.value.trim() || "";
        const bike = bikeSelect?.value || "Ducati";
        const readableDate = new Intl.DateTimeFormat("en-IN", {
            day: "numeric",
            month: "long",
            year: "numeric"
        }).format(new Date(`${dateInput.value}T00:00:00`));

        setFormMessage(
            `Thank you, ${name}. Your ${bike} test-ride request is prepared for ${readableDate}. We will contact you at ${email}.`,
            "success"
        );

        if (choiceMessage) {
            choiceMessage.innerHTML = `<strong>${bike}</strong> selected.<br>Your next obsession could be one throttle away.`;
        }
    });

    form?.addEventListener("reset", () => {
        window.setTimeout(() => {
            setFormMessage();
            if (dateInput) dateInput.min = todayISO();
            if (choiceMessage) choiceMessage.innerHTML = "Every Ducati has a personality.<br>Select one from the collection and discover the machine that matches yours.";
        }, 0);
    });
});
