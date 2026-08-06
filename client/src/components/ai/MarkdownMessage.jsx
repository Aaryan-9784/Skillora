import { useEffect, useRef } from "react";
import toast from "react-hot-toast";

/**
 * Enhanced markdown renderer with code copy header and clean ChatGPT styling.
 */
const MarkdownMessage = ({ content, className = "" }) => {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const buttons = containerRef.current.querySelectorAll(".copy-code-btn");
    const handleCopy = (e) => {
      const btn = e.currentTarget;
      const codeText = decodeURIComponent(btn.getAttribute("data-code") || "");
      navigator.clipboard.writeText(codeText);
      toast.success("Code copied to clipboard");
      const originalText = btn.innerHTML;
      btn.innerHTML = "✓ Copied";
      setTimeout(() => { btn.innerHTML = originalText; }, 2000);
    };
    buttons.forEach((btn) => btn.addEventListener("click", handleCopy));
    return () => {
      buttons.forEach((btn) => btn.removeEventListener("click", handleCopy));
    };
  }, [content]);

  if (!content) return null;

  const render = (text) => {
    // Code blocks with syntax header and copy button
    text = text.replace(/```([\w-]*)\n?([\s\S]*?)```/g, (_, lang, code) => {
      const language = lang || "code";
      const escCode = escHtml(code.trim());
      const encodedCode = encodeURIComponent(code.trim());
      return `<div class="my-3 rounded-xl overflow-hidden border border-slate-700/60 bg-[#0D1117] shadow-xl">
        <div class="flex items-center justify-between px-4 py-1.5 bg-[#161B22] border-b border-slate-800 text-[11px] font-mono text-slate-400">
          <span class="font-bold text-indigo-400 uppercase tracking-wider">${language}</span>
          <button type="button" class="copy-code-btn hover:text-white transition-colors cursor-pointer flex items-center gap-1 py-0.5 px-2 rounded hover:bg-white/10" data-code="${encodedCode}">
            📋 Copy code
          </button>
        </div>
        <pre class="p-4 overflow-x-auto text-xs font-mono text-slate-200 leading-relaxed"><code>${escCode}</code></pre>
      </div>`;
    });

    // Inline code
    text = text.replace(/`([^`]+)`/g, (_, c) =>
      `<code class="bg-slate-800/80 text-indigo-300 px-1.5 py-0.5 rounded text-xs font-mono border border-slate-700/50">${escHtml(c)}</code>`
    );
    // Blockquotes
    text = text.replace(/^> (.+)$/gm, '<blockquote class="border-l-2 border-indigo-500 pl-3 my-2 text-slate-400 italic text-xs">$1</blockquote>');
    // Headers
    text = text.replace(/^### (.+)$/gm, '<h3 class="text-sm font-bold text-white mt-4 mb-1.5">$1</h3>');
    text = text.replace(/^## (.+)$/gm,  '<h2 class="text-base font-bold text-white mt-4 mb-2">$1</h2>');
    text = text.replace(/^# (.+)$/gm,   '<h1 class="text-lg font-black text-white mt-4 mb-2">$1</h1>');
    // Bold + italic
    text = text.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>');
    text = text.replace(/\*\*(.+?)\*\*/g,     '<strong class="font-bold text-white">$1</strong>');
    text = text.replace(/\*(.+?)\*/g,         '<em>$1</em>');
    // Unordered lists
    text = text.replace(/^[-•] (.+)$/gm, '<li class="ml-4 list-disc text-slate-200">$1</li>');
    text = text.replace(/(<li class="ml-4 list-disc.*<\/li>\n?)+/g, (m) => `<ul class="space-y-1 my-2">${m}</ul>`);
    // Ordered lists
    text = text.replace(/^\d+\. (.+)$/gm, '<li class="ml-4 list-decimal text-slate-200">$1</li>');
    text = text.replace(/(<li class="ml-4 list-decimal.*<\/li>\n?)+/g, (m) => `<ol class="space-y-1 my-2">${m}</ol>`);
    // Line breaks
    text = text.replace(/\n\n/g, '</p><p class="mt-2 text-slate-200 leading-relaxed">');
    text = text.replace(/\n/g, '<br/>');
    return `<p class="text-slate-200 leading-relaxed">${text}</p>`;
  };

  const escHtml = (s) => s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");

  return (
    <div
      ref={containerRef}
      className={`prose-sm leading-relaxed text-xs lg:text-sm ${className}`}
      dangerouslySetInnerHTML={{ __html: render(content) }}
    />
  );
};

export default MarkdownMessage;
