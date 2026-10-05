document.getElementById("year").textContent = new Date().getFullYear();

// Early-access form: opens the visitor's email app with the details filled in.
// Swap this for a real form backend (e.g. AWS Lambda + SES) later.
const form = document.getElementById("wl-form");
if (form) {
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const d = Object.fromEntries(new FormData(form));
    const body = [
      `Name: ${d.name}`,
      `Email: ${d.email}`,
      `Company: ${d.company}`,
      `Team size: ${d.size}`,
      `Wants to automate: ${d.area}`,
    ].join("\n");
    window.location.href =
      "mailto:hello@aelvyn.com?subject=" +
      encodeURIComponent(`Early access request: ${d.company}`) +
      "&body=" + encodeURIComponent(body);
  });
}
