/* Aelvyn, aelvyn.com. Vanilla JS, no dependencies.
   1. Mobile menu
   2. Contents: mark the section in view
   3. Invoice preview: complete at rest; replay, approve, edit, return, reset
   4. Support reply: English / Arabic toggle
   5. Forms (early access on the home page, message on the contact page)
   6. Legal pages: the contents fold is open on desktop, closed on a phone */

(function () {
  "use strict";

  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var phoneQuery = window.matchMedia && window.matchMedia("(max-width: 719.98px)");
  var isPhone = function () { return !!(phoneQuery && phoneQuery.matches); };

  /* ---------------------------------------------------------------- */
  /* 1. Mobile menu                                                    */
  /* ---------------------------------------------------------------- */
  var menuBtn = document.querySelector(".menu-btn");
  var panel = document.getElementById("nav-panel");
  if (menuBtn && panel) {
    var focusables = function () {
      return panel.querySelectorAll("a, button");
    };
    var setMenu = function (open) {
      panel.classList.toggle("is-open", open);
      menuBtn.setAttribute("aria-expanded", String(open));
      menuBtn.textContent = open ? "Close" : "Menu";
      document.body.classList.toggle("menu-open", open);
      if (open) {
        var first = focusables()[0];
        if (first) first.focus();
      }
    };
    menuBtn.addEventListener("click", function () {
      setMenu(!panel.classList.contains("is-open"));
    });
    document.addEventListener("keydown", function (e) {
      if (!panel.classList.contains("is-open")) return;
      if (e.key === "Escape") {
        setMenu(false);
        menuBtn.focus();
      } else if (e.key === "Tab") {
        var items = focusables();
        var first = items[0];
        var last = items[items.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); menuBtn.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); menuBtn.focus(); }
        else if (!e.shiftKey && document.activeElement === menuBtn) { e.preventDefault(); first.focus(); }
      }
    });
    panel.addEventListener("click", function (e) {
      if (e.target.closest("a")) setMenu(false);
    });
    window.addEventListener("resize", function () {
      if (window.innerWidth >= 720 && panel.classList.contains("is-open")) setMenu(false);
    });
  }

  /* ---------------------------------------------------------------- */
  /* 2. Contents: the section in view gets an accent-coloured number   */
  /* The active entry is the last section whose top has passed the     */
  /* header. Above section 01 nothing is active.                       */
  /* ---------------------------------------------------------------- */
  var contents = document.querySelectorAll(".contents-list li");
  if (contents.length) {
    var entries = [];
    contents.forEach(function (li) {
      var a = li.querySelector("a");
      var s = a && document.getElementById(a.getAttribute("href").slice(1));
      if (s) entries.push({ li: li, a: a, s: s });
    });
    var headerH = function () {
      var h = document.querySelector(".site-header");
      return (h ? h.offsetHeight : 64) + 16;
    };
    var markContents = function () {
      var line = headerH();
      var active = null;
      entries.forEach(function (en) {
        if (en.s.getBoundingClientRect().top <= line) active = en;
      });
      entries.forEach(function (en) {
        en.li.classList.toggle("is-active", en === active);
        if (en === active) en.a.setAttribute("aria-current", "true");
        else en.a.removeAttribute("aria-current");
      });
    };
    var spyTick = false;
    var onScroll = function () {
      if (spyTick) return;
      spyTick = true;
      requestAnimationFrame(function () { spyTick = false; markContents(); });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    markContents();
  }

  /* ---------------------------------------------------------------- */
  /* 3. Invoice preview                                                */
  /* The record is complete on first paint: every field read, the      */
  /* draft prepared, the approval tray open. "Replay the read" empties */
  /* the record and fills it again field by field; Approve, Edit and   */
  /* Return act on the draft; "Run it again" restores the first state. */
  /* ---------------------------------------------------------------- */
  var demo = document.getElementById("invoice-demo");
  if (demo) {
    var readBtn = document.getElementById("read-btn");
    var approveBtn = document.getElementById("approve-btn");
    var editBtn = document.getElementById("edit-btn");
    var returnBtn = document.getElementById("return-btn");
    var returnLine = document.getElementById("return-line");
    var returnReason = document.getElementById("return-reason");
    var returnConfirm = document.getElementById("return-confirm");
    var bar = document.getElementById("approval-bar");
    var barLabel = document.getElementById("approval-label");
    var logBody = document.querySelector("#log tbody");
    var recTotal = document.getElementById("rec-total");
    var resetLink = document.getElementById("reset-link");
    var fields = Array.prototype.slice.call(demo.querySelectorAll(".record dd"));
    var initialLog = logBody.innerHTML;
    var timers = [];
    var done = true;      /* the read is complete at rest */
    var reading = false;
    var decided = false;  /* approved or returned */
    var editing = false;
    var totalText = recTotal.querySelector(".val").textContent;
    var READ_LABEL = readBtn.textContent;

    var STEP = 350;

    var clearReading = function () {
      demo.querySelectorAll(".is-reading").forEach(function (el) { el.classList.remove("is-reading"); });
    };

    var now = function () {
      return new Date().toLocaleTimeString("en-GB", { hour12: false });
    };

    var addLog = function (who, entry) {
      var tr = document.createElement("tr");
      var t = document.createElement("td"); t.className = "t"; t.textContent = now();
      var w = document.createElement("td"); w.className = "who" + (who === "you" ? " you" : ""); w.textContent = who;
      var e = document.createElement("td"); e.textContent = entry;
      tr.appendChild(t); tr.appendChild(w); tr.appendChild(e);
      if (!reduce) tr.className = "in-row";
      logBody.appendChild(tr);
    };

    var setBar = function (state, label) {
      bar.classList.remove("is-approved", "is-returned");
      if (state) bar.classList.add(state);
      barLabel.textContent = label;
    };

    var setButtons = function (enabled) {
      [approveBtn, editBtn, returnBtn].forEach(function (b) { b.disabled = !enabled; });
    };

    var fillField = function (dd) {
      dd.classList.remove("is-empty");
      dd.querySelector(".val").classList.add("in");
    };

    var emptyField = function (dd) {
      dd.classList.add("is-empty");
      dd.querySelector(".val").classList.remove("in");
    };

    var finishRead = function () {
      clearReading();
      done = true;
      reading = false;
      readBtn.disabled = false;
      readBtn.textContent = READ_LABEL;
      if (!decided) {
        setButtons(true);
        try { approveBtn.focus({ preventScroll: true }); } catch (err) { approveBtn.focus(); }
        if (bar.scrollIntoView) bar.scrollIntoView({ block: isPhone() ? "center" : "nearest", behavior: scrollBehaviour });
      }
    };

    /* Scrolling is deliberate: on a phone each field is kept in view as it lands, and the approval bar
       is brought to the centre when the read ends. Focus itself never jumps the page. */
    var scrollBehaviour = reduce ? "auto" : "smooth";
    var reveal = function (i) {
      clearReading();
      if (i >= fields.length) { finishRead(); return; }
      var dd = fields[i];
      fillField(dd);
      if (isPhone() && dd.scrollIntoView) dd.scrollIntoView({ block: "nearest", behavior: scrollBehaviour });
      var doc = demo.querySelector('[data-doc="' + dd.getAttribute("data-field") + '"]');
      if (doc) doc.classList.add("is-reading");
      timers.push(setTimeout(function () { reveal(i + 1); }, STEP));
    };

    /* Replay: empty the record, close any edit, then read it again. The decision already taken
       (approved or returned) stands; the log is a record and is not rewound. */
    readBtn.addEventListener("click", function () {
      if (reading) return;
      if (editing) finishEdit();
      reading = true;
      done = false;
      readBtn.disabled = true;
      readBtn.textContent = "Reading";
      setButtons(false);
      returnLine.hidden = true;
      if (reduce) {
        finishRead();
        return;
      }
      fields.forEach(emptyField);
      timers.push(setTimeout(function () { reveal(0); }, STEP));
    });

    approveBtn.addEventListener("click", function () {
      if (!done || decided) return;
      if (editing) finishEdit();
      addLog("you", "Approved. Bill BILL-0318 posted. Payment scheduled for 11 Nov 2026.");
      setBar("is-approved", "Approved");
      setButtons(false);
      decided = true;
      returnLine.hidden = true;
    });

    var finishEdit = function () {
      var input = recTotal.querySelector("input");
      if (!input) return;
      var v = input.value.trim();
      var span = document.createElement("span");
      span.className = "val in";
      span.textContent = v || totalText;
      recTotal.replaceChild(span, input);
      editBtn.textContent = "Edit";
      editing = false;
      if (v && v !== totalText) {
        addLog("you", "Total corrected to " + v + ". Draft updated, not posted.");
      } else {
        addLog("you", "Edit closed, no change.");
      }
    };

    editBtn.addEventListener("click", function () {
      if (!done || decided) return;
      if (editing) { finishEdit(); editBtn.focus(); return; }
      var span = recTotal.querySelector(".val");
      var input = document.createElement("input");
      input.type = "text";
      input.inputMode = "decimal";
      input.className = "total-edit";
      input.value = span.textContent;
      input.setAttribute("aria-label", "Total");
      recTotal.replaceChild(input, span);
      input.focus();
      input.select();
      editBtn.textContent = "Save";
      editing = true;
      input.addEventListener("keydown", function (e) {
        if (e.key === "Enter") { e.preventDefault(); finishEdit(); editBtn.focus(); }
      });
    });

    returnBtn.addEventListener("click", function () {
      if (!done || decided) return;
      returnLine.hidden = false;
      returnReason.value = "";
      returnReason.focus();
    });

    returnConfirm.addEventListener("click", function () {
      if (decided) return;
      var reason = returnReason.value.trim();
      addLog("you", "Returned to agent. Nothing posted." + (reason ? ' "' + reason + '"' : ""));
      setBar("is-returned", "Returned");
      setButtons(false);
      decided = true;
      returnLine.hidden = true;
      returnBtn.focus();
    });

    /* Run it again: back to the first state, the read complete and the draft awaiting approval. */
    var reset = function () {
      timers.forEach(clearTimeout);
      timers = [];
      clearReading();
      if (editing) {
        var input = recTotal.querySelector("input");
        if (input) {
          var span = document.createElement("span");
          span.className = "val in";
          recTotal.replaceChild(span, input);
        }
        editBtn.textContent = "Edit";
        editing = false;
      }
      fields.forEach(fillField);
      recTotal.querySelector(".val").textContent = totalText;
      logBody.innerHTML = initialLog;
      setBar(null, "Awaiting your approval");
      decided = false;
      reading = false;
      done = true;
      setButtons(true);
      returnLine.hidden = true;
      readBtn.disabled = false;
      readBtn.textContent = READ_LABEL;
      try { approveBtn.focus({ preventScroll: true }); } catch (err) { approveBtn.focus(); }
    };

    if (resetLink) {
      resetLink.addEventListener("click", function (e) {
        e.preventDefault();
        reset();
      });
    }

    /* First state: everything read, tray open. The markup already carries it; this guards against a stale
       bfcache restore of a half-run replay. */
    fields.forEach(fillField);
    setButtons(true);
  }

  /* ---------------------------------------------------------------- */
  /* 4. Support reply: English / Arabic                                */
  /* ---------------------------------------------------------------- */
  var toggle = document.querySelector(".lang-toggle");
  var reply = document.getElementById("reply");
  if (toggle && reply) {
    toggle.addEventListener("click", function (e) {
      var btn = e.target.closest("button[data-lang]");
      if (!btn) return;
      var lang = btn.getAttribute("data-lang");
      toggle.querySelectorAll("button[data-lang]").forEach(function (b) {
        b.setAttribute("aria-pressed", String(b === btn));
      });
      reply.querySelectorAll("p[data-lang]").forEach(function (p) {
        p.hidden = p.getAttribute("data-lang") !== lang;
      });
      reply.setAttribute("lang", lang);
      reply.setAttribute("dir", lang === "ar" ? "rtl" : "ltr");
    });
  }

  /* ---------------------------------------------------------------- */
  /* 5. Forms                                                          */
  /* If FORM_KEY is set to a Web3Forms access key, submissions are     */
  /* emailed to hello@aelvyn.com in the background. Until then, the    */
  /* visitor's email app opens with the details filled in, and a note  */
  /* under the button says what to do if it did not open.              */
  /* ---------------------------------------------------------------- */
  var FORM_KEY = ""; // paste your Web3Forms access key here

  var form = document.getElementById("wl-form");
  var ok = document.getElementById("form-ok");
  if (form && ok) {
    /* The HTML carries action="mailto:" as the no-JS fallback. With JS the custom validation below runs instead. */
    form.noValidate = true;
    /* The status region is always in the DOM (role="status"); it shows when it has text. */
    var setStatus = function (cls, text, withEmail) {
      ok.className = "form-ok" + (cls ? " " + cls : "");
      ok.textContent = "";
      if (!text) return;
      ok.appendChild(document.createTextNode(text));
      if (withEmail) {
        var a = document.createElement("a");
        a.href = "mailto:hello@aelvyn.com";
        a.textContent = "hello@aelvyn.com";
        ok.appendChild(a);
        ok.appendChild(document.createTextNode(" with these details."));
      }
    };

    var markInvalid = function () {
      var valid = true;
      form.querySelectorAll(".field").forEach(function (f) {
        var ctrl = f.querySelector("input, select, textarea");
        var err = f.querySelector(".error");
        if (err) err.remove();
        f.classList.remove("has-error");
        if (ctrl && !ctrl.checkValidity()) {
          valid = false;
          f.classList.add("has-error");
          var m = document.createElement("span");
          m.className = "error";
          m.id = ctrl.id + "-error";
          m.textContent = ctrl.type === "email" && ctrl.value ? "Enter a valid email address." : "This field is required.";
          f.appendChild(m);
          ctrl.setAttribute("aria-describedby", m.id);
          ctrl.setAttribute("aria-invalid", "true");
        } else if (ctrl) {
          ctrl.removeAttribute("aria-describedby");
          ctrl.removeAttribute("aria-invalid");
        }
      });
      return valid;
    };

    form.addEventListener("submit", async function (e) {
      e.preventDefault();
      setStatus("", "");
      if (!markInvalid()) {
        var firstBad = form.querySelector(".has-error input, .has-error select, .has-error textarea");
        if (firstBad) firstBad.focus();
        return;
      }
      var d = Object.fromEntries(new FormData(form));
      var lines = [
        "Name: " + d.name,
        "Email: " + d.email,
        d.company && "Company: " + d.company,
        (d.team_size || d.size) && "Team size: " + (d.team_size || d.size),
        d.area && "Topic: " + d.area,
        d.message && "\n" + d.message
      ].filter(Boolean);
      var subject = (d.area || "Website enquiry") + ": " + (d.company || d.name);

      if (FORM_KEY) {
        var btn = form.querySelector("button[type=submit]");
        btn.disabled = true;
        try {
          var res = await fetch("https://api.web3forms.com/submit", {
            method: "POST",
            headers: { "Content-Type": "application/json", Accept: "application/json" },
            body: JSON.stringify(Object.assign({ access_key: FORM_KEY, subject: subject, from_name: "aelvyn.com", replyto: d.email }, d))
          });
          if (!res.ok) throw new Error(res.status);
          form.reset();
          setStatus("", ok.getAttribute("data-msg"));
        } catch (err) {
          setStatus("is-error", "Sorry, something went wrong. Please email ", true);
        } finally {
          btn.disabled = false;
        }
        return;
      }

      /* Mailto fallback. The values stay in the form so they can be copied if no mail app opens. */
      window.location.href =
        "mailto:hello@aelvyn.com?subject=" + encodeURIComponent(subject) +
        "&body=" + encodeURIComponent(lines.join("\n"));
      setStatus("is-note", "If your email app did not open, write to ", true);
    });
  }

  /* ---------------------------------------------------------------- */
  /* 6. Legal pages: contents fold (privacy.html, terms.html)          */
  /* The fold is open on desktop, where its summary is hidden, and     */
  /* closed on a phone. Without JS it stays open.                      */
  /* ---------------------------------------------------------------- */
  var fold = document.querySelector(".toc-fold");
  if (fold && phoneQuery) {
    var syncFold = function () { fold.open = !isPhone(); };
    syncFold();
    if (phoneQuery.addEventListener) phoneQuery.addEventListener("change", syncFold);
    else if (phoneQuery.addListener) phoneQuery.addListener(syncFold);
  }
})();
