(() => {
  "use strict";
  const d = document;
  const $ = (selector, context = d) => context.querySelector(selector);
  const $$ = (selector, context = d) => [...context.querySelectorAll(selector)];
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const animated = !reduced && typeof window.gsap !== "undefined";

  const showMessage = (message) => {
    const target = $("[data-auth-message]");
    if (target) target.textContent = message;
  };

  const bind = () => {
    $("[data-nav-toggle]")?.addEventListener("click", () => {
      const nav = $("[data-site-nav]");
      const open = nav?.classList.toggle("is-open");
      $("[data-nav-toggle]")?.setAttribute(
        "aria-expanded",
        String(Boolean(open)),
      );
    });
    $$("[data-site-nav] a").forEach((link) =>
      link.addEventListener("click", () =>
        $("[data-site-nav]")?.classList.remove("is-open"),
      ),
    );
    $$("[data-demo-auth]").forEach((button) =>
      button.addEventListener("click", (event) => {
        event.preventDefault();
        sessionStorage.setItem("aip_role", "aprobador");
        showMessage(
          "Acceso de demostración listo. Abriendo la cola de causación…",
        );
        window.setTimeout(() => {
          window.location.href = "index.html#resumen";
        }, 450);
      }),
    );
    $$("[data-auth-form]").forEach((form) =>
      form.addEventListener("submit", (event) => {
        event.preventDefault();
        const roleSelect = $('select[name="role"]', form);
        if (roleSelect?.value)
          sessionStorage.setItem("aip_role", roleSelect.value);
        const button = $('button[type="submit"]', form);
        if (button) {
          button.disabled = true;
          button.textContent = "Abriendo espacio…";
        }
        showMessage("Rol configurado. Entrando a la cola de causación…");
        window.setTimeout(() => {
          window.location.href = "index.html#resumen";
        }, 550);
      }),
    );
  };

  const animate = () => {
    if (!animated) {
      $$("[data-reveal],[data-hero-reveal]").forEach((item) => {
        item.style.opacity = "1";
        item.style.transform = "none";
      });
      return;
    }
    window.gsap.fromTo(
      $$("[data-hero-reveal]"),
      { opacity: 0, y: 22 },
      {
        opacity: 1,
        y: 0,
        duration: 0.7,
        stagger: 0.08,
        ease: "power2.out",
        clearProps: "all",
      },
    );
    const reveal = (target) => {
      const isProcess = target.classList.contains("process-card");
      const isSocial = target.classList.contains("feature-social-visual");
      const isCopy = target.classList.contains("feature-copy");
      const isCta = target.classList.contains("cta-box");
      const from = isProcess
        ? { opacity: 0, y: 28, scale: 0.96 }
        : isSocial
          ? { opacity: 0, scale: 0.94, x: -16 }
          : isCopy
            ? { opacity: 0, x: 16 }
            : isCta
              ? { opacity: 0, y: 24, scale: 0.96 }
              : { opacity: 0, y: 18 };
      window.gsap.fromTo(target, from, {
        opacity: 1,
        x: 0,
        y: 0,
        scale: 1,
        duration: isCta ? 0.8 : 0.68,
        ease: isProcess ? "back.out(1.2)" : isCta ? "power3.out" : "power2.out",
        clearProps: "all",
      });
      if (isSocial)
        window.gsap.fromTo(
          $$(
            ".social-post,.social-message,.social-reaction,.social-pulse",
            target,
          ),
          { opacity: 0, y: 10, scale: 0.94 },
          {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 0.4,
            stagger: 0.1,
            delay: 0.22,
            ease: "power2.out",
            clearProps: "all",
          },
        );
      if (isSocial) {
        const orbit = $(".social-orbit--one", target);
        const floatingSignals = $$(".social-reaction,.social-pulse", target);
        if (orbit)
          window.gsap.to(orbit, {
            rotation: 360,
            duration: 28,
            repeat: -1,
            ease: "none",
            transformOrigin: "50% 50%",
          });
        if (floatingSignals.length)
          window.gsap.to(floatingSignals, {
            y: -5,
            duration: 2.4,
            repeat: -1,
            yoyo: true,
            ease: "sine.inOut",
          });
      }
      if (isCta)
        window.gsap.fromTo(
          $("a.button", target),
          { opacity: 0, x: 14 },
          {
            opacity: 1,
            x: 0,
            duration: 0.45,
            delay: 0.25,
            ease: "power2.out",
            clearProps: "all",
          },
        );
    };
    if ("IntersectionObserver" in window) {
      const observer = new IntersectionObserver(
        (entries) =>
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            reveal(entry.target);
            observer.unobserve(entry.target);
          }),
        { threshold: 0.14 },
      );
      $$("[data-reveal]").forEach((item) => observer.observe(item));
    }
  };

  bind();
  animate();
})();
