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

    // Menú desplegable: sin JavaScript los enlaces permanecen visibles.
    const menuButton = document.querySelector(
      'button[aria-controls="navegacion-principal"]',
    );
    
    const menu = document.getElementById("navegacion-principal");
    const tooltip = document.getElementById("ayuda-menu");

    if (menuButton && menu) {
      const mobile = window.matchMedia("(max-width: 900px)");
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
        tooltip.hidden = true;
        setOpen(false);
      };

      menuButton.addEventListener("click", () => {
        tooltip.hidden = true;
        setOpen(menuButton.getAttribute("aria-expanded") !== "true");
      });

      document.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
          tooltip.hidden = true;
          if (
            mobile.matches &&
            menuButton.getAttribute("aria-expanded") === "true"
          ) {
            setOpen(false);
            menuButton.focus();
          }
        }
      });

      menuButton.addEventListener("mouseenter", () => {
        tooltip.hidden = false;
      });

      menuButton.addEventListener("focus", () => {
        tooltip.hidden = false;
      });

      menuButton.addEventListener("mouseleave", () => {
        tooltip.hidden = true;
      });

      menuButton.addEventListener("blur", () => {
        tooltip.hidden = true;
      });

      tooltip.addEventListener("mouseenter", () => {
        tooltip.hidden = false;
      });

      tooltip.addEventListener("mouseleave", () => {
        tooltip.hidden = true;
      });

      mobile.addEventListener("change", syncMenu);
      syncMenu();
    }

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
