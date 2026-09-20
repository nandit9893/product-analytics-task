(() => {
  function updateMessage(form, className, message) {
    const container = form.querySelector('.form-message');
    if (!container) {
      return;
    }

    const currentMessage = container.querySelector(`.${className}`);

    if (!message) {
      currentMessage?.remove();
      return;
    }

    if (currentMessage) {
      currentMessage.textContent = message;
      return;
    }

    const messageElement = document.createElement('p');
    messageElement.className = className;
    messageElement.textContent = message;
    container.appendChild(messageElement);
  }

  async function submitForm(event) {
    event.preventDefault();

    const form = event.currentTarget;
    const submitButton = form.querySelector('button[type="submit"]');
    if (submitButton?.disabled) {
      return;
    }

    updateMessage(form, 'error', '');
    updateMessage(form, 'success', '');

    const defaultButtonText = submitButton?.textContent.trim() || '';
    const loadingText = submitButton?.dataset.loadingText || 'Submitting...';
    if (submitButton) {
      submitButton.disabled = true;
      submitButton.setAttribute('aria-busy', 'true');
      submitButton.dataset.defaultText = defaultButtonText;
      submitButton.textContent = loadingText;
      submitButton.classList.add('is-loading');
    }

    try {
      const response = await fetch(form.action, {
        method: form.method || 'POST',
        body: new FormData(form),
      });

      if (response.redirected) {
        window.location.href = response.url;
        return;
      }

      const responseHtml = await response.text();
      const responseDocument = new DOMParser().parseFromString(responseHtml, 'text/html');
      const responseError = responseDocument.querySelector('.error')?.textContent.trim();
      const responseSuccess = responseDocument.querySelector('.success')?.textContent.trim();

      updateMessage(form, 'error', responseError);
      updateMessage(form, 'success', responseSuccess);
    } catch (error) {
      updateMessage(form, 'error', 'Something went wrong. Please try again.');
      console.error('Form submission failed:', error);
    } finally {
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.removeAttribute('aria-busy');
        submitButton.textContent = submitButton.dataset.defaultText || defaultButtonText;
        submitButton.classList.remove('is-loading');
      }
    }
  }

  document.querySelectorAll('form[data-async-submit]').forEach((form) => {
    form.addEventListener('submit', submitForm);
  });

  const productsPage = document.querySelector('.products-page');
  const productsForm = productsPage?.querySelector('.product-filters');
  productsForm?.addEventListener('submit', (event) => {
    event.preventDefault();

    const url = new URL(productsForm.action, window.location.origin);
    const formData = new FormData(productsForm);

    for (const [key, value] of formData.entries()) {
      const normalizedValue = String(value).trim();

      if (!normalizedValue || (key === 'sort' && normalizedValue === 'name') || (key === 'order' && normalizedValue === 'asc')) {
        continue;
      }

      url.searchParams.set(key, normalizedValue);
    }

    productsPage.classList.add('is-loading');
    window.location.assign(url.toString());
  });
  productsPage?.querySelectorAll('.product-pagination a').forEach((link) => {
    link.addEventListener('click', () => productsPage.classList.add('is-loading'));
  });
})();
