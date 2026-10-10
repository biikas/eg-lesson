import Quill from 'quill';

/**
 * Quill's getSemanticHTML() (what ngx-quill saves) writes formulas as plain text and videos as links. Override those
 * blots so the saved HTML keeps <span class="ql-formula" data-value> and <iframe class="ql-video">, which the reader
 * renders with KaTeX and as an embedded player.
 */
let done = false;

function esc(s: string) {
  return String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export function setupQuill() {
  if (done) return;
  done = true;
  const FormulaBase = Quill.import('formats/formula') as any;
  class Formula extends FormulaBase {
    html() {
      const { formula } = (this as any).value();
      return `<span class="ql-formula" data-value="${esc(formula)}"></span>`;
    }
  }
  Quill.register('formats/formula', Formula, true);

  const VideoBase = Quill.import('formats/video') as any;
  class Video extends VideoBase {
    html() {
      const { video } = (this as any).value();
      return `<iframe class="ql-video" frameborder="0" allowfullscreen="true" src="${esc(video)}"></iframe>`;
    }
  }
  Quill.register('formats/video', Video, true);
}
