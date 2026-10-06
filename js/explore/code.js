export const renderCode = (content, lang) => {
  const escaped = content
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  const lineCount = content.split("\n").length;
  const lineNumbers = Array.from({ length: lineCount }, (_, i) => i + 1).join("\n");

  document.getElementById("viewer-body").innerHTML = `
    <div class="code-wrapper">
      <div class="line-numbers">${lineNumbers}</div>
      <pre class="language-${lang}"><code class="language-${lang}">${escaped}</code></pre>
    </div>
  `;

  if (lang !== "none" && window.Prism) {
    Prism.highlightAllUnder(document.getElementById("viewer-body"));
  }
};