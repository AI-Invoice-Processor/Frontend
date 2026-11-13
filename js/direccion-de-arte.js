(() => {
  "use strict";

  const d = document;
  const html = d.documentElement;
  const $ = (selector, context = d) => context.querySelector(selector);
  const $$ = (selector, context = d) => [...context.querySelectorAll(selector)];
  const RM = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const hasGSAP =
    typeof window.gsap !== "undefined" &&
    typeof window.ScrollTrigger !== "undefined";
  const safe = (fn) => {
    try {
      fn();
    } catch (error) {
      console.warn("[ai-invoice-direction]", error);
    }
  };

  const M = {
    ease: "power3.out",
    easeIO: "power2.inOut",
    pop: "power2.out",
    dur: 0.85,
    stagger: 0.08,
    dist: 24,
    lerp: 0.1,
  };

  let lenis;
  let introTimeline;
  let splits = [];

  const showMotionNote = (message) => {
    let note = $(".motion-note");
    if (!note) {
      note = d.createElement("div");
      note.className = "motion-note";
      note.setAttribute("role", "status");
      d.body.appendChild(note);
    }
    note.textContent = message;
    note.classList.add("is-visible");
    window.setTimeout(() => note.classList.remove("is-visible"), 4200);
  };

  const resetIntro = () => {
    if (!hasGSAP) return;
    if (introTimeline) introTimeline.kill();
    gsap.killTweensOf(
      "[data-hero-in], .hero__line-in, .signature-line, .signature-node, .hero__stamp",
    );
    gsap.set("[data-hero-in]", { autoAlpha: 0, y: M.dist * 0.75 });
    gsap.set(".hero__line-in", { yPercent: 125, y: 0 });
    gsap.set(".signature-line", {
      strokeDasharray: 500,
      strokeDashoffset: 500,
    });
    gsap.set(".signature-node", {
      autoAlpha: 0,
      scale: 0.5,
      transformOrigin: "50% 50%",
    });
  };

  const runIntro = () => {
    if (!hasGSAP || RM) {
      html.classList.remove("js");
      if (RM)
        showMotionNote(
          "La animación completa se ve sin el ajuste de reducir movimiento.",
        );
      return;
    }

    resetIntro();
    const path = $(".signature-line");
    introTimeline = gsap.timeline({ defaults: { ease: M.ease } });
    introTimeline
      .to(
        ".hero__line-in",
        { yPercent: 0, duration: M.dur * 1.25, stagger: M.stagger },
        0.1,
      )
      .to(
        ".hero__line-in--accent",
        { color: "#FFFFFF", duration: M.dur * 0.7 },
        0.62,
      )
      .to(
        "[data-hero-in]",
        { autoAlpha: 1, y: 0, duration: M.dur, stagger: M.stagger },
        0.12,
      )
      .to(
        ".signature-line",
        { strokeDashoffset: 0, duration: M.dur * 1.4, ease: M.easeIO },
        0.5,
      )
      .to(
        ".signature-node",
        { autoAlpha: 1, scale: 1, duration: M.dur * 0.5, stagger: 0.08 },
        1.12,
      )
      .to(
        ".hero__stamp",
        { rotation: -90, autoAlpha: 1, duration: M.dur * 0.7 },
        1.16,
      );

    if (path) path.style.strokeDasharray = "500";
  };

  const initLenis = () => {
    if (RM || !window.Lenis || !hasGSAP) return;
    lenis = new Lenis({ lerp: M.lerp, smoothWheel: true, syncTouch: false });
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add((time) => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);
  };

  const initReveals = () => {
    if (!hasGSAP || RM) return;
    $$("[data-reveal]").forEach((element) => {
      gsap.fromTo(
        element,
        { autoAlpha: 0, y: M.dist },
        {
          autoAlpha: 1,
          y: 0,
          duration: M.dur,
          ease: M.ease,
          scrollTrigger: { trigger: element, start: "top 86%", once: true },
        },
      );
    });

    $$("[data-draw]").forEach((path) => {
      const length = path.getTotalLength();
      gsap.set(path, { strokeDasharray: length, strokeDashoffset: length });
      gsap.to(path, {
        strokeDashoffset: 0,
        duration: M.dur * 1.5,
        ease: M.easeIO,
        scrollTrigger: { trigger: path, start: "top 82%", once: true },
      });
    });

    gsap.to(".ribbon--one, .ribbon--two, .ribbon--three, .ribbon--four", {
      y: -8,
      duration: 3.8,
      ease: "sine.inOut",
      yoyo: true,
      repeat: -1,
      stagger: 0.12,
    });
    gsap.to(".board__result", {
      autoAlpha: 1,
      duration: M.dur * 0.8,
      delay: 0.7,
      scrollTrigger: {
        trigger: ".signature-board",
        start: "top 82%",
        once: true,
      },
    });
  };

  const initSplitTitles = () => {
    if (!hasGSAP || RM || !window.SplitText) return;
    splits = $$("[data-split]").map((element) =>
      SplitText.create(element, {
        type: "lines",
        mask: "lines",
        linesClass: "linea",
        autoSplit: true,
        onSplit: (self) =>
          gsap.from(self.lines, {
            yPercent: 115,
            duration: M.dur,
            stagger: M.stagger,
            ease: M.ease,
            scrollTrigger: { trigger: element, start: "top 86%", once: true },
          }),
      }),
    );
    return splits;
  };

  const replay = () => {
    if (RM) {
      showMotionNote(
        "La animación completa se ve sin el ajuste de reducir movimiento.",
      );
      return;
    }
    if (lenis) lenis.scrollTo(0, { immediate: true });
    window.scrollTo({ top: 0, behavior: "auto" });
    runIntro();
  };

  const start = () => {
    if (!hasGSAP) html.classList.remove("js");
    if (hasGSAP) {
      gsap.registerPlugin(ScrollTrigger);
      if (window.SplitText) gsap.registerPlugin(SplitText);
      ScrollTrigger.config({ ignoreMobileResize: true });
    }
    d.addEventListener("click", (event) => {
      const button = event.target.closest("[data-replay]");
      if (button) replay();
    });
    initLenis();
    if (RM) {
      html.classList.remove("js");
      showMotionNote(
        "La animación completa se ve sin el ajuste de reducir movimiento.",
      );
    } else if (hasGSAP) {
      initSplitTitles();
      initReveals();
      runIntro();
      window.setTimeout(() => {
        safe(() => ScrollTrigger.refresh());
      }, 800);
    }
  };

  Promise.race([
    d.fonts ? d.fonts.ready : Promise.resolve(),
    new Promise((resolve) => window.setTimeout(resolve, 1200)),
  ]).then(() => safe(start));
})();
