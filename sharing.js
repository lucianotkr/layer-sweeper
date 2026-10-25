(function (root, factory) {
  'use strict';
  if (typeof module === 'object' && module.exports) module.exports = factory;
  else root.LayerSweeperSharing = factory(root.document, root.navigator, root);
})(typeof window !== 'undefined' ? window : globalThis, function (document, navigator, clock) {
  'use strict';
  let state, elements, timeout, generation = 0;
  function clear() {
    generation++;
    if (timeout) clock.clearTimeout(timeout);
    if (elements) Object.values(elements).forEach(element => element.remove());
    elements = null;
    state = null;
  }
  function place(element, bounds) {
    ['left', 'top', 'width', 'height'].forEach((key, index) => { element.style[key] = `${bounds[index] * 100}%`; });
  }
  function button(tag, name, label) {
    const element = document.createElement(tag);
    element.id = name;
    element.setAttribute('aria-label', label);
    element.setAttribute('data-result-share', name);
    Object.assign(element.style, { position: 'absolute', display: 'block', zIndex: '4', background: 'transparent',
      color: 'transparent', border: '0', padding: '0', margin: '0', fontSize: '0', cursor: 'pointer', pointerEvents: 'auto' });
    element.textContent = label;
    return element;
  }
  async function copy() {
    const current = state;
    const ticket = generation;
    if (!current) return;
    let success = false;
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(current.text);
        success = true;
      } else {
        const text = document.createElement('textarea');
        text.value = current.text;
        text.readOnly = true;
        Object.assign(text.style, { position: 'fixed', left: '-10000px', top: '0' });
        document.body.appendChild(text);
        try { text.focus(); text.select(); success = document.execCommand('copy'); }
        finally { text.remove(); document.getElementById('unity-canvas').focus(); }
      }
    } catch (_) { success = false; }
    if (!elements || generation !== ticket) return;
    elements.status.textContent = success ? current.copied : current.failed;
    elements.status.hidden = false;
    if (timeout) clock.clearTimeout(timeout);
    timeout = clock.setTimeout(() => { if (elements) elements.status.hidden = true; }, 1600);
  }
  function set(next, shareBounds, copyBounds) {
    const intent = new URL(next.intent);
    if (intent.protocol !== 'https:' || intent.hostname !== 'x.com' || intent.pathname !== '/intent/tweet')
      throw new Error('Unexpected score sharing destination');
    if (state && (state.intent !== next.intent || state.text !== next.text)) generation++;
    state = next;
    if (!elements) {
      const stage = document.getElementById('stage');
      const share = button('a', 'result-share-link', next.shareLabel);
      share.target = '_blank';
      share.rel = 'noopener noreferrer';
      const copyButton = button('button', 'result-copy-button', next.copyLabel);
      copyButton.type = 'button';
      copyButton.addEventListener('click', copy);
      const status = document.createElement('div');
      status.id = 'result-copy-status';
      status.setAttribute('role', 'status');
      status.hidden = true;
      Object.assign(status.style, { position: 'absolute', left: '12px', right: '12px', bottom: '12px', zIndex: '5',
        color: '#f7f1de', background: '#18262e', padding: '12px', borderRadius: '10px', textAlign: 'center',
        font: '14px system-ui,sans-serif', pointerEvents: 'none' });
      elements = { share, copy: copyButton, status };
      Object.values(elements).forEach(element => stage.appendChild(element));
    }
    elements.share.href = next.intent;
    elements.share.setAttribute('aria-label', next.shareLabel);
    elements.copy.setAttribute('aria-label', next.copyLabel);
    place(elements.share, shareBounds);
    place(elements.copy, copyBounds);
  }
  return { set, clear };
});
