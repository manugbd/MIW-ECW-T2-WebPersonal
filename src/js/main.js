/**
 * Script principal de la aplicación web personal de Manuel García Baldó
 * Asignatura: Estándares y Computación Web (ECW)
 *
 * Funcionalidad: Mejora progresiva, actualización de año dinámico y accesibilidad.
 */

(function () {
  "use strict";

  document.addEventListener("DOMContentLoaded", function () {
    // 1. Actualización progresiva del año de copyright en el pie de página
    const copyrightTime = document.querySelector("time[data-copyright]");
    if (copyrightTime) {
      const year = new Date().getFullYear().toString();
      copyrightTime.textContent = year;
      copyrightTime.dateTime = year;
    }

    const languagePicker = document.querySelector('details[data-language]');
    if (languagePicker) {
      document.addEventListener('keydown', event => {
        if (event.key === 'Escape' && languagePicker.open) {
          languagePicker.open = false;
          languagePicker.querySelector('summary').focus();
        }
      });
      document.addEventListener('click', event => {
        if (!languagePicker.contains(event.target)) languagePicker.open = false;
      });
      languagePicker.addEventListener('focusout', event => {
        if (!languagePicker.contains(event.relatedTarget)) languagePicker.open = false;
      });
    }

    const tooltipDelay = 700; // Retardo de apertura de las ayudas, en milisegundos.

    // Menú desplegable: sin JavaScript los enlaces permanecen visibles.
    const menuButton = document.querySelector(
      'button[aria-controls="navegacion-principal"]',
    );

    const menu = document.getElementById("navegacion-principal");
    const tooltip = document.getElementById("ayuda-menu");

    if (menuButton && menu) {
      let menuTooltipTimer;
      const hideMenuTooltip = () => {
        clearTimeout(menuTooltipTimer);
        tooltip.hidden = true;
      };
      const showMenuTooltip = () => {
        clearTimeout(menuTooltipTimer);
        menuTooltipTimer = setTimeout(() => {
          tooltip.hidden = false;
        }, tooltipDelay);
      };
      const mobile = window.matchMedia("(max-width: 70rem)");
      const setOpen = (open) => {
        menuButton.setAttribute("aria-expanded", String(open));
        menu.hidden = mobile.matches && !open;
      };

      const syncMenu = () => {
        if (!mobile.matches && menu.contains(document.activeElement)) {
          menu.hidden = false;
        } else if (mobile.matches && menu.contains(document.activeElement)) {
          menuButton.hidden = false;
          menuButton.focus();
        }

        if (!mobile.matches && document.activeElement === menuButton) {
          menu.querySelector("a").focus();
        }
        menuButton.hidden = !mobile.matches;
        hideMenuTooltip();
        setOpen(false);
      };

      menuButton.addEventListener("click", () => {
        hideMenuTooltip();
        setOpen(menuButton.getAttribute("aria-expanded") !== "true");
      });

      document.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
          hideMenuTooltip();
          if (
            mobile.matches &&
            menuButton.getAttribute("aria-expanded") === "true"
          ) {
            setOpen(false);
            menuButton.focus();
          }
        }
      });

      menuButton.addEventListener("mouseenter", showMenuTooltip);
      menuButton.addEventListener("focus", showMenuTooltip);
      menuButton.addEventListener("mouseleave", hideMenuTooltip);
      menuButton.addEventListener("blur", hideMenuTooltip);
      tooltip.addEventListener("mouseenter", () => {
        clearTimeout(menuTooltipTimer);
        tooltip.hidden = false;
      });
      tooltip.addEventListener("mouseleave", hideMenuTooltip);

      mobile.addEventListener("change", syncMenu);
      syncMenu();
    }

    // Una acción de copia independiente por dirección; no altera el enlace mailto.
    const copyStatus = document.querySelector("[data-copy-status]");
    document.querySelectorAll("button[data-copy-email]").forEach((button) => {
      if (!navigator.clipboard || !window.isSecureContext || !copyStatus)
        return;
      button.hidden = false;
      button.addEventListener("click", async () => {
        button.disabled = true;
        copyStatus.textContent = copyStatus.dataset.copying + " " + button.dataset.copyEmail + ".";
        try {
          await navigator.clipboard.writeText(button.dataset.copyEmail);
          copyStatus.textContent =
            copyStatus.dataset.copied + " " + button.dataset.copyEmail;
        } catch {
          copyStatus.textContent =
            copyStatus.dataset.copyError;
        } finally {
          button.disabled = false;
        }
      });
    });
    // Tooltips persistentes mientras el puntero o el foco estén en su grupo.
    document.querySelectorAll("[data-help]").forEach((group) => {
      const tip = group.querySelector('[role="tooltip"]');
      if (!tip) return;
      let showTimer, hideTimer;
      const show = () => {
        clearTimeout(hideTimer);
        if (!tip.hidden) return;
        clearTimeout(showTimer);
        showTimer = setTimeout(() => {
          tip.hidden = false;
        }, tooltipDelay);
      };
      const hide = () => {
        clearTimeout(showTimer);
        hideTimer = setTimeout(() => {
          if (
            !group.matches(":hover") &&
            !group.contains(document.activeElement)
          )
            tip.hidden = true;
        }, 150);
      };
      group.addEventListener("mouseenter", show);
      group.addEventListener("mouseleave", hide);
      group.addEventListener("focusin", show);
      group.addEventListener("focusout", hide);
      document.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
          clearTimeout(showTimer);
          clearTimeout(hideTimer);
          tip.hidden = true;
        }
      });
    });

    // 2. Comprobación y mejora de accesibilidad para reproductores multimedia nativos
    const mediaElements = document.querySelectorAll("video, audio");
    mediaElements.forEach(function (media) {
      media.addEventListener("play", function () {
        // Pausar otros reproductores si uno inicia reproducción
        mediaElements.forEach(function (otherMedia) {
          if (otherMedia !== media && !otherMedia.paused) {
            otherMedia.pause();
          }
        });
      });
    });
  });
})();
