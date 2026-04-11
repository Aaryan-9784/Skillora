/**
 * Lightweight markdown renderer — no external deps.
 * Handles: bold, italic, code blocks, inline code, headers, lists, line breaks.
 */
const MarkdownMessage = ({ content, className = "" }) => {
  if (!content) return null;

  const render = (text) => {
    // Code blocks
    text = text.replace(/```[\w]*\n?([\s\S]*?)```/g, (_, code) =>
      `<pre class="bg-surface-secondary dark:bg-dark-muted rounded-lg p-3 my-2 overflow-x-auto text-xs font-mono border border-surface-border dark:border-dark-border"><code>${escHtml(code.trim())}</code></pre>`
    );
    // Inline code
    text = text.replace(/`([^`]+)`/g, (_, c) =>
      `<code class="bg-surface-secondary dark:bg-dark-muted px-1.5 py-0.5 rounded text-xs font-mono text-brand">${escHtml(c)}</code>`
    );
    // Headers
    text = text.replace(/^### (.+)$/gm, '<h3 class="text-sm font-bold text-ink dark:text-slate-100 mt-3 mb-1">$1</h3>');
    text = text.replace(/^## (.+)$/gm,  '<h2 class="text-base font-bold text-ink dark:text-slate-100 mt-3 mb-1">$1</h2>');
    text = text.replace(/^# (.+)$/gm,   '<h1 class="text-lg font-bold text-ink dark:text-slate-100 mt-3 mb-1">$1</h1>');
    // Bold + italic
    text = text.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>');
    text = text.replace(/\*\*(.+?)\*\*/g,     '<strong class="font-semibold">$1</strong>');
    text = text.replace(/\*(.+?)\*/g,         '<em>$1</em>');
    // Unordered lists
    text = text.replace(/^[-•] (.+)$/gm, '<li class="ml-4 list-disc">$1</li>');
    text = text.replace(/(<li.*<\/li>\n?)+/g, (m) => `<ul class="space-y-0.5 my-1">${m}</ul>`);
    // Ordered lists
    text = text.replace(/^\d+\. (.+)$/gm, '<li class="ml-4 list-decimal">$1</li>');
    // Line breaks
    text = text.replace(/\n\n/g, '</p><p class="mt-2">');
    text = text.replace(/\n/g, '<br/>');
    return `<p>${text}</p>`;
  };

  const escHtml = (s) => s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");

  return (
    <div
      className={`prose-sm leading-relaxed ${className}`}
      dangerouslySetInnerHTML={{ __html: render(content) }}
    />
  );
};

export default MarkdownMessage;
