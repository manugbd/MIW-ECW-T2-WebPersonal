/**
 * Buscador local del sitio.
 * Descarga el índice estático una vez, filtra las páginas del idioma actual y
 * actualiza los resultados mientras se escribe. No envía la consulta a terceros.
 */
(function () {
  "use strict";

  const app = document.querySelector("[data-search-app]");
  if (!app) return;

  const mainInput = document.getElementById("search-query");
  const status = document.getElementById("search-status");
  const resultsList = document.getElementById("search-results");
  const feedback = document.getElementById("search-feedback");
  const feedbackHeading = document.getElementById("search-feedback-heading");
  const feedbackMessage = document.getElementById("search-feedback-message");
  const suggestion = document.getElementById("search-suggestion");
  const suggestionLink = document.getElementById("search-suggestion-link");
  const emptyHint = document.getElementById("search-empty-hint");
  const resultsHeading = document.getElementById("search-results-heading");
  const queryInputs = Array.from(
    document.querySelectorAll("form[data-site-search] input[name='search']"),
  );
  const language = document.documentElement.lang || "es";
  let pages = [];
  let vocabulary = new Map();
  status.textContent = app.dataset.loading;

  // Compacta el texto que el generador extrajo del contenido principal.
  function extractText(text) {
    return String(text || "")
      .replace(/\s+/g, " ")
      .trim();
  }

  // Normaliza mayúsculas y diacríticos para que, por ejemplo, «Gijon» encuentre «Gijón».
  function normalize(value) {
    return String(value)
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLocaleLowerCase(language);
  }

  // También guarda el desplazamiento original para crear un fragmento cercano al término.
  function normalizeWithOffsets(value) {
    let normalized = "";
    const offsets = [];
    let originalOffset = 0;

    for (const character of value) {
      const normalizedCharacter = normalize(character);
      for (let unit = 0; unit < normalizedCharacter.length; unit += 1) {
        normalized += normalizedCharacter[unit];
        offsets.push(originalOffset);
      }
      originalOffset += character.length;
    }

    return { normalized, offsets };
  }

  function updateAddress(query) {
    // Conserva una URL compartible sin recargar la página en cada pulsación.
    const address = new URL(window.location.href);
    if (query) address.searchParams.set("search", query);
    else address.searchParams.delete("search");
    window.history.replaceState(null, "", address);
  }

  function makeExcerpt(page, terms) {
    // Muestra un fragmento de texto cercano a la primera coincidencia.
    const match = terms
      .map((term) => page.normalizedContent.indexOf(term))
      .filter((offset) => offset >= 0)
      .sort((a, b) => a - b)[0];
    const contextStart = match >= 0 ? Math.max(0, page.offsets[match] - 65) : 0;
    const start = Math.min(
      contextStart,
      Math.max(0, page.content.length - 190),
    );
    const end = Math.min(page.content.length, start + 190);
    const rawText = page.content.slice(start, end);
    const leadingSpace = rawText.length - rawText.trimStart().length;
    const text = rawText.trim();
    const textStart = start + leadingSpace;
    return {
      start: textStart,
      prefix: textStart > 0,
      suffix: end < page.content.length,
      text,
    };
  }

  // Convierte coincidencias normalizadas en intervalos del texto original.
  function findHighlights(page, terms) {
    const ranges = [];
    for (const term of new Set(terms)) {
      let searchFrom = 0;
      let match = page.normalizedContent.indexOf(term, searchFrom);
      while (match >= 0) {
        const start = page.offsets[match];
        const nextOffset = page.offsets[match + term.length];
        const end = nextOffset === undefined ? page.content.length : nextOffset;
        if (start !== undefined && end > start) ranges.push({ start, end });
        searchFrom = match + Math.max(1, term.length);
        match = page.normalizedContent.indexOf(term, searchFrom);
      }
    }

    ranges.sort((left, right) => left.start - right.start);
    return ranges.reduce((merged, range) => {
      const previous = merged[merged.length - 1];
      if (previous && range.start <= previous.end) {
        previous.end = Math.max(previous.end, range.end);
      } else {
        merged.push({ ...range });
      }
      return merged;
    }, []);
  }

  // Inserta marcas semánticas con nodos de texto, sin interpretar el contenido como HTML.
  function appendHighlightedText(
    container,
    excerpt,
    excerptStart,
    ranges,
    prefix = false,
    suffix = false,
  ) {
    if (prefix) container.append(document.createTextNode("…"));
    const excerptEnd = excerptStart + excerpt.length;
    let cursor = 0;

    for (const range of ranges) {
      if (range.end <= excerptStart || range.start >= excerptEnd) continue;
      const start = Math.max(0, range.start - excerptStart);
      const end = Math.min(excerpt.length, range.end - excerptStart);
      if (start > cursor)
        container.append(document.createTextNode(excerpt.slice(cursor, start)));

      const mark = document.createElement("mark");
      mark.textContent = excerpt.slice(start, end);
      container.append(mark);
      cursor = end;
    }

    if (cursor < excerpt.length)
      container.append(document.createTextNode(excerpt.slice(cursor)));
    if (suffix) container.append(document.createTextNode("…"));
  }

  function showMessage(message) {
    // Evita dejar resultados antiguos visibles cuando no hay consulta o falla el índice.
    resultsList.replaceChildren();
    feedback.hidden = true;
    status.textContent = message;
  }

  // Calcula la distancia de edición entre dos palabras para proponer erratas cercanas.
  function editDistance(left, right) {
    const previous = Array.from(
      { length: right.length + 1 },
      (_, index) => index,
    );
    for (let row = 1; row <= left.length; row += 1) {
      const current = [row];
      for (let column = 1; column <= right.length; column += 1) {
        current[column] = Math.min(
          current[column - 1] + 1,
          previous[column] + 1,
          previous[column - 1] + (left[row - 1] === right[column - 1] ? 0 : 1),
        );
      }
      for (let column = 0; column <= right.length; column += 1)
        previous[column] = current[column];
    }
    return previous[right.length];
  }

  // Sugiere una corrección solo si la consulta resultante encuentra páginas reales.
  function findSuggestion(terms) {
    let best = null;
    for (let index = 0; index < terms.length; index += 1) {
      const term = terms[index];
      if (term.length < 4) continue;
      const maxDistance = term.length < 6 ? 1 : 2;
      for (const [word, frequency] of vocabulary) {
        if (word === term || Math.abs(word.length - term.length) > maxDistance)
          continue;
        const distance = editDistance(term, word);
        if (distance > maxDistance) continue;
        const candidateTerms = [...terms];
        candidateTerms[index] = word;
        if (
          !pages.some((page) =>
            candidateTerms.every((candidate) =>
              page.normalizedSearch.includes(candidate),
            ),
          )
        )
          continue;
        if (
          !best ||
          distance < best.distance ||
          (distance === best.distance && frequency > best.frequency)
        ) {
          best = { index, word, distance, frequency };
        }
      }
    }
    if (!best) return "";
    const corrected = [...terms];
    corrected[best.index] = best.word;
    return corrected.join(" ");
  }

  function showNoResults(query, terms) {
    feedback.hidden = false;
    feedbackHeading.textContent = app.dataset.noResultsTitle;
    feedbackMessage.textContent = app.dataset.noResults.replace(
      "{query}",
      query,
    );
    const suggestedQuery = findSuggestion(terms);
    suggestion.hidden = !suggestedQuery;
    if (suggestedQuery) {
      suggestionLink.textContent = suggestedQuery;
      const address = new URL(window.location.href);
      address.searchParams.set("search", suggestedQuery);
      suggestionLink.href = address.href;
    }
    status.textContent = feedbackMessage.textContent;
  }

  function search(query) {
    // Exige que aparezcan todos los términos y favorece coincidencias en el título.
    const terms = normalize(query).split(/\s+/).filter(Boolean);
    emptyHint.hidden = terms.length > 0;
    resultsHeading.hidden = true;
    if (!terms.length) {
      showMessage(app.dataset.empty);
      updateAddress("");
      return;
    }

    const matches = pages
      .filter((page) =>
        terms.every((term) => page.normalizedSearch.includes(term)),
      )
      .map((page) => {
        let score = 0;
        for (const term of terms) {
          if (page.normalizedTitle.includes(term)) score += 8;
          else if (page.normalizedDescription.includes(term)) score += 3;
          else score += 1;
        }
        return { page, score };
      })
      .sort(
        (left, right) =>
          right.score - left.score ||
          left.page.title.localeCompare(right.page.title, language),
      );

    resultsList.replaceChildren();
    if (!matches.length) {
      showNoResults(query, terms);
      updateAddress(query);
      return;
    }
    feedback.hidden = true;
    resultsHeading.hidden = false;

    const fragment = document.createDocumentFragment();
    for (const { page } of matches) {
      const item = document.createElement("li");
      const heading = document.createElement("h3");
      const link = document.createElement("a");
      const excerpt = document.createElement("p");
      const destination = new URL(page.url, window.location.origin);

      // El índice se genera localmente, pero se limita el enlace al mismo origen.
      if (destination.origin !== window.location.origin) continue;
      link.href = destination.href;
      link.lang = page.lang;
      const titleOffsets = normalizeWithOffsets(page.title).offsets;
      const titleHighlights = findHighlights(
        {
          content: page.title,
          normalizedContent: page.normalizedTitle,
          offsets: titleOffsets,
        },
        terms,
      );
      appendHighlightedText(link, page.title, 0, titleHighlights);
      const snippet = makeExcerpt(page, terms);
      const highlights = findHighlights(page, terms);
      appendHighlightedText(
        excerpt,
        snippet.text,
        snippet.start,
        highlights,
        snippet.prefix,
        snippet.suffix,
      );
      heading.append(link);
      item.append(heading, excerpt);
      fragment.append(item);
    }

    resultsList.append(fragment);
    status.textContent = app.dataset.resultCount
      .replace("{count}", String(resultsList.children.length))
      .replace("{query}", query);
    updateAddress(query);
  }

  function syncInputs(source, query) {
    // Mantiene iguales el campo permanente de la cabecera y el campo principal.
    for (const input of queryInputs) {
      if (input !== source) input.value = query;
      const clearButton = input.form.querySelector("[data-search-clear]");
      if (clearButton) clearButton.hidden = input.value.length === 0;
    }
  }

  // Sincroniza los formularios de cabecera y página; GET sirve como mejora progresiva.
  for (const input of queryInputs) {
    input.addEventListener("input", () => {
      const query = input.value.trim();
      syncInputs(input, input.value);
      search(query);
    });
  }

  // En la página de resultados, Enter y el botón de la lupa actualizan sin recargar.
  document.querySelectorAll("form[data-site-search]").forEach((form) => {
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const input = form.querySelector("input[name='search']");
      const query = input.value.trim();
      syncInputs(input, query);
      search(query);
      mainInput.focus();
    });
  });

  // Carga el índice generado en la compilación y prepara solo las páginas del idioma activo.
  fetch(app.dataset.indexUrl)
    .then((response) => {
      if (!response.ok) throw new Error("No se pudo cargar el índice local");
      return response.json();
    })
    .then((index) => {
      pages = index
        .filter((page) => page.lang === language && page.title && page.url)
        .map((page) => {
          const content = extractText(page.content);
          const normalizedTitle = normalize(page.title);
          const normalizedDescription = normalize(page.description || "");
          const normalizedContent = normalize(content);
          const { offsets } = normalizeWithOffsets(content);
          const normalizedSearch = normalize(`${page.title} ${content}`);
          return {
            ...page,
            content,
            normalizedTitle,
            normalizedDescription,
            normalizedContent,
            normalizedSearch,
            offsets,
          };
        });

      // Cuenta palabras del índice para ordenar sugerencias por uso real en el contenido.
      vocabulary = new Map();
      for (const page of pages) {
        const words = page.normalizedSearch.match(/[\p{L}\p{N}]{4,}/gu) || [];
        for (const word of new Set(words))
          vocabulary.set(word, (vocabulary.get(word) || 0) + 1);
      }

      const query =
        new URLSearchParams(window.location.search).get("search") || "";
      mainInput.value = query;
      syncInputs(mainInput, query);
      search(query.trim());
    })
    .catch(() => {
      showMessage(app.dataset.error);
      emptyHint.hidden = true;
      feedback.hidden = false;
      feedbackHeading.textContent = app.dataset.unavailableTitle;
      feedbackMessage.textContent = app.dataset.error;
      suggestion.hidden = true;
    });
})();
