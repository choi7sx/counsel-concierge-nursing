const dialog = document.querySelector<HTMLDialogElement>('#consultation-dialog');
const consultationPath = '/private-nursing-consultation-nashville';
let opener: HTMLElement | null = null;
let addedHistoryEntry = false;

function restoreConsultationFocus() {
  requestAnimationFrame(() => {
    if (dialog?.open) return;
    const target = opener?.getClientRects().length ? opener : document.querySelector<HTMLElement>('.menu-toggle');
    target?.focus({ preventScroll: true });
  });
}

function closeConsultation() {
  if (!dialog?.open) return;
  dialog.close();
  if (addedHistoryEntry) {
    addedHistoryEntry = false;
    history.back();
  }
}

function openConsultation(trigger: HTMLElement | null, updateHistory = true) {
  if (!dialog || dialog.open) return;
  opener = trigger;
  document.dispatchEvent(new Event('counsel:open-consultation'));
  if (updateHistory) {
    history.pushState({ ...history.state, consultationOpen: true }, '', '#consultation-request');
    addedHistoryEntry = true;
  }
  dialog.showModal();
  document.documentElement.classList.add('consultation-open');
  dialog.querySelector<HTMLElement>('.consultation-dialog-body')!.scrollTop = 0;
  // Read the introduction first without opening the mobile keyboard immediately.
  dialog.querySelector<HTMLElement>('h2')?.focus({ preventScroll: true });
}

const consultationLinks = [...document.querySelectorAll<HTMLAnchorElement>('a[href]')].filter(link => {
  const url = new URL(link.href);
  return url.origin === location.origin && url.pathname.replace(/\/$/, '') === consultationPath;
});
consultationLinks.forEach(link => {
  link.setAttribute('aria-haspopup', 'dialog');
  link.setAttribute('aria-controls', 'consultation-dialog');
  link.addEventListener('click', event => {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    openConsultation(link);
  });
});
dialog?.querySelector('[data-close-consultation]')?.addEventListener('click', closeConsultation);
dialog?.addEventListener('cancel', event => { event.preventDefault(); closeConsultation(); });
// Only an actual backdrop click closes the form; dragging out of a field does not.
let backdropPointer = false;
dialog?.addEventListener('pointerdown', event => { backdropPointer = event.target === dialog; });
dialog?.addEventListener('click', event => {
  if (backdropPointer && event.target === dialog) closeConsultation();
  backdropPointer = false;
});
dialog?.addEventListener('close', () => {
  document.documentElement.classList.remove('consultation-open');
  restoreConsultationFocus();
});
window.addEventListener('popstate', () => {
  if (!history.state?.consultationOpen && dialog?.open) {
    addedHistoryEntry = false;
    dialog.close();
  } else if (history.state?.consultationOpen && !dialog?.open) {
    addedHistoryEntry = true;
    openConsultation(null, false);
  } else if (!dialog?.open) {
    restoreConsultationFocus();
  }
});
if (location.hash === '#consultation-request') openConsultation(null, false);

for (const form of document.querySelectorAll<HTMLFormElement>('[data-consultation-form]')) {
  const submit = form.querySelector<HTMLButtonElement>('[data-form-submit]')!;
  const fields = form.querySelector<HTMLFieldSetElement>('fieldset')!;
  const status = form.querySelector<HTMLElement>('[data-form-status]')!;
  const submitRow = form.querySelector<HTMLElement>('.consultation-submit-row')!;
  const defaultLabel = submit.innerHTML;
  let sending = false;
  submit.disabled = false;

  function showStatus(message: string, state: 'error' | 'success') {
    status.textContent = message;
    status.dataset.state = state;
    status.hidden = false;
    if (state === 'error') {
      const contact = document.createElement('a');
      contact.href = 'mailto:info@counselconciergenursing.com';
      contact.textContent = 'Email info@counselconciergenursing.com';
      status.append(document.createElement('br'), contact);
    }
    status.focus();
  }

  form.addEventListener('input', event => {
    const input = event.target;
    if (input instanceof HTMLInputElement) input.setCustomValidity('');
  });
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (sending) return;
    const first = form.elements.namedItem('firstName') as HTMLInputElement;
    const last = form.elements.namedItem('lastName') as HTMLInputElement;
    const phone = form.elements.namedItem('phone') as HTMLInputElement;
    for (const name of [first, last]) {
      name.value = name.value.trim();
      name.setCustomValidity(name.value ? '' : 'Please enter your name.');
    }
    const digits = phone.value.replace(/\D/g, '');
    phone.setCustomValidity(digits.length >= 7 && digits.length <= 20 ? '' : 'Please enter a phone number we can reach you on.');
    if (!form.reportValidity()) return;

    const inboxKey = (form.elements.namedItem('inbox_key') as HTMLInputElement).value;
    // Static development servers cannot deliver CloudCannon forms, even if they return 200.
    const localPreview = location.protocol !== 'https:' || ['localhost', '127.0.0.1', '[::1]'].includes(location.hostname);
    if (form.dataset.deliveryReady !== 'true' || !inboxKey || localPreview) {
      showStatus('Online requests are currently unavailable. Your request has not been sent. Please email us or call (615) 933-9208.', 'error');
      return;
    }
    const payload = new URLSearchParams();
    for (const [name, value] of new FormData(form)) payload.append(name, String(value));
    payload.set('page', location.pathname);
    // Include the address in the message body as well as CloudCannon's Reply-To header.
    payload.set('email', payload.get('_replyto') || '');
    status.hidden = true;
    sending = true;
    submit.disabled = true;
    fields.disabled = true;
    form.setAttribute('aria-busy', 'true');
    submit.textContent = 'Sending your request…';
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 20000);
    try {
      const response = await fetch(form.action, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'text/html' },
        body: payload.toString(),
        signal: controller.signal,
        credentials: 'same-origin',
      });
      // CloudCannon returns the form's action page after accepting a submission.
      // Check our receipt marker so a login, error, or generic fallback page is not success.
      const receipt = new DOMParser().parseFromString(await response.text(), 'text/html');
      if (response.status !== 200 || !receipt.querySelector('[data-consultation-receipt]')) throw new Error('Request not accepted');
      form.reset();
      fields.hidden = true;
      submitRow.hidden = true;
      showStatus('Thank you. Your consultation request has been received. We’ll follow up directly to discuss the next steps.', 'success');
    } catch {
      showStatus('We couldn’t confirm that your request was received. Your details are still here. Please try again, or contact us directly.', 'error');
    } finally {
      window.clearTimeout(timeout);
      sending = false;
      submit.disabled = false;
      fields.disabled = false;
      form.removeAttribute('aria-busy');
      submit.innerHTML = defaultLabel;
    }
  });
}
