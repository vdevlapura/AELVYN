const year = document.getElementById("year");
if (year) year.textContent = new Date().getFullYear();

// Forms (early access on the home page, message on the contact page).
// If FORM_KEY is set to a Web3Forms access key, submissions are emailed to
// hello@aelvyn.com in the background. Until then, the visitor's email app opens
// with the details filled in.
const FORM_KEY = ""; // paste your Web3Forms access key here

const form = document.getElementById("wl-form");
if (form) {
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const d = Object.fromEntries(new FormData(form));
    const lines = [
      `Name: ${d.name}`,
      `Email: ${d.email}`,
      d.company && `Company: ${d.company}`,
      d.size && `Team size: ${d.size}`,
      d.area && `Topic: ${d.area}`,
      d.message && `\n${d.message}`,
    ].filter(Boolean);
    const subject = `${d.area || "Website enquiry"}: ${d.company || d.name}`;

    if (FORM_KEY) {
      const btn = form.querySelector("button");
      btn.disabled = true;
      try {
        const res = await fetch("https://api.web3forms.com/submit", {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify({ access_key: FORM_KEY, subject, from_name: "aelvyn.com", replyto: d.email, ...d }),
        });
        if (!res.ok) throw new Error(res.status);
        form.reset();
        document.getElementById("form-ok").style.display = "block";
      } catch {
        alert("Sorry, something went wrong. Please email hello@aelvyn.com.");
      } finally {
        btn.disabled = false;
      }
      return;
    }

    window.location.href =
      "mailto:hello@aelvyn.com?subject=" + encodeURIComponent(subject) +
      "&body=" + encodeURIComponent(lines.join("\n"));
  });
}
