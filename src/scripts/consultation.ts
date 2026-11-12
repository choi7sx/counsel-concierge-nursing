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

// The consultation and Work With Us forms submit through CloudCannon's form service.
for (const form of document.querySelectorAll<HTMLFormElement>('[data-site-form]')) {
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
    if (input instanceof HTMLInputElement || input instanceof HTMLTextAreaElement) input.setCustomValidity('');
  });
  // Show the chosen file's name in the upload box.
  for (const input of form.querySelectorAll<HTMLInputElement>('input[type="file"]')) {
    const label = input.parentElement!.querySelector<HTMLElement>('[data-file-name]')!;
    const empty = label.textContent;
    const update = () => {
      input.setCustomValidity('');
      label.textContent = input.files?.[0]?.name || empty;
    };
    input.addEventListener('change', update);
    form.addEventListener('reset', () => setTimeout(update));
  }
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (sending) return;
    for (const input of form.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>('[data-trim]')) {
      input.value = input.value.trim();
      input.setCustomValidity(input.required && !input.value ? 'Please fill in this field.' : '');
    }
    const phone = form.elements.namedItem('phone') as HTMLInputElement | null;
    if (phone) {
      const digits = phone.value.replace(/\D/g, '');
      const valid = (!phone.required && !digits) || (digits.length >= 7 && digits.length <= 20);
      phone.setCustomValidity(valid ? '' : 'Please enter a phone number we can reach you on.');
    }
    for (const input of form.querySelectorAll<HTMLInputElement>('input[type="file"]')) {
      const tooLarge = [...input.files ?? []].some(file => file.size > Number(input.dataset.maxBytes));
      input.setCustomValidity(tooLarge ? 'Please choose a file smaller than 5MB.' : '');
    }
    if (!form.reportValidity()) return;

    const inboxKey = (form.elements.namedItem('inbox_key') as HTMLInputElement).value;
    // Static development servers cannot deliver CloudCannon forms, even if they return 200.
    const localPreview = location.protocol !== 'https:' || ['localhost', '127.0.0.1', '[::1]'].includes(location.hostname);
    if (form.dataset.deliveryReady !== 'true' || !inboxKey || localPreview) {
      showStatus('Online forms are currently unavailable. Your message has not been sent. Please email us or call (615) 933-9208.', 'error');
      return;
    }
    const data = new FormData(form);
    data.set('page', location.pathname);
    // Include the address in the message body as well as CloudCannon's Reply-To header.
    data.set('email', String(data.get('_replyto') || ''));
    // Files need a multipart body; the consultation form keeps the URL-encoded format.
    const multipart = form.enctype === 'multipart/form-data';
    const body = multipart ? data : new URLSearchParams([...data].map(([name, value]) => [name, String(value)]));
    status.hidden = true;
    sending = true;
    submit.disabled = true;
    form.setAttribute('aria-busy', 'true');
    submit.textContent = 'Sending…';
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), multipart ? 60000 : 20000);
    // Disable fields only after reading them; disabled fields are not submitted.
    fields.disabled = true;
    try {
      const response = await fetch(form.action, {
        method: 'POST',
        headers: multipart ? { Accept: 'text/html' } : { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'text/html' },
        body,
        signal: controller.signal,
        credentials: 'same-origin',
      });
      // CloudCannon returns the form's action page after accepting a submission.
      // Check our receipt marker so a login, error, or generic fallback page is not success.
      const receipt = new DOMParser().parseFromString(await response.text(), 'text/html');
      if (response.status !== 200 || !receipt.querySelector('[data-form-receipt]')) throw new Error('Submission not accepted');
      form.reset();
      // Once sent, show only the heading, the one-line introduction, and the confirmation.
      for (const element of [fields, submitRow, ...form.querySelectorAll<HTMLElement>('[data-pre-send]')]) element.hidden = true;
      showStatus(form.dataset.success!, 'success');
      // Analytics records only which form was sent (src/lib/analytics.ts).
      document.dispatchEvent(new CustomEvent('counsel:form-sent', { detail: { form: form.dataset.analyticsForm, element: form } }));
    } catch {
      showStatus('We couldn’t confirm that your message was received. Your details are still here. Please try again, or contact us directly.', 'error');
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
