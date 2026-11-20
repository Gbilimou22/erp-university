import '../css/app.css';
import './bootstrap';

import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createRoot, hydrateRoot } from 'react-dom/client';

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

const fieldMessage = (field: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement) => {
    const label = field.closest('label')?.textContent?.replace(/\*\s*$/, '').trim();
    const name = label || field.getAttribute('placeholder') || 'Ce champ';

    if (field.validity.valueMissing) return `${name} doit être renseigné.`;
    if (field.validity.typeMismatch) {
        if (field instanceof HTMLInputElement && field.type === 'email') return 'Saisissez une adresse e-mail valide.';
        if (field instanceof HTMLInputElement && field.type === 'url') return 'Saisissez une adresse web valide.';
        return `${name} contient une valeur invalide.`;
    }
    if (field.validity.rangeUnderflow) return `${name} est inférieur à la valeur minimale autorisée.`;
    if (field.validity.rangeOverflow) return `${name} dépasse la valeur maximale autorisée.`;
    if (field.validity.tooShort) return `${name} est trop court.`;
    if (field.validity.tooLong) return `${name} est trop long.`;
    if (field.validity.stepMismatch) return `${name} doit respecter l’unité demandée.`;
    return `${name} n’est pas valide.`;
};

const clearFieldError = (field: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement) => {
    field.removeAttribute('aria-invalid');
    field.classList.remove('border-red-400', 'focus:border-red-500', 'focus:ring-red-500');
    field.parentElement?.querySelector(':scope > [data-app-field-error]')?.remove();
};

const showFieldError = (field: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement) => {
    clearFieldError(field);

    field.setAttribute('aria-invalid', 'true');
    field.classList.add('border-red-400', 'focus:border-red-500', 'focus:ring-red-500');

    const error = document.createElement('p');
    error.setAttribute('data-app-field-error', '');
    error.setAttribute('role', 'alert');
    error.className = 'mt-1 text-xs font-medium text-red-600';
    error.textContent = fieldMessage(field);

    const container = field.closest('label') || field.parentElement;
    container?.appendChild(error);
};

const installProfessionalValidation = () => {
    const forms = document.querySelectorAll<HTMLFormElement>('form');
    forms.forEach((form) => {
        form.setAttribute('novalidate', '');

        if (form.dataset.professionalValidation === 'true') return;
        form.dataset.professionalValidation = 'true';

        form.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>('input, select, textarea').forEach((field) => {
            field.addEventListener('input', () => clearFieldError(field));
            field.addEventListener('change', () => clearFieldError(field));
        });

        form.addEventListener('submit', (event) => {
            const fields = Array.from(form.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>('input, select, textarea'))
                .filter((field) => !field.disabled && field.getAttribute('aria-hidden') !== 'true');

            fields.forEach((field) => clearFieldError(field));

            const invalidFields = fields.filter((field) => !field.checkValidity());
            if (invalidFields.length === 0) return;

            event.preventDefault();
            event.stopImmediatePropagation();
            invalidFields.forEach(showFieldError);
            invalidFields[0].focus();

            let summary = form.querySelector<HTMLElement>('[data-form-validation-summary]');
            if (!summary) {
                summary = document.createElement('div');
                summary.setAttribute('data-form-validation-summary', '');
                summary.setAttribute('role', 'alert');
                summary.className = 'rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800';
                summary.textContent = 'Veuillez corriger les informations signalées avant de continuer.';
                form.prepend(summary);
            }
        });
    });
};

createInertiaApp({
    title: (title) => `${title} - ${appName}`,
    resolve: (name) =>
        resolvePageComponent(
            `./Pages/${name}.tsx`,
            import.meta.glob('./Pages/**/*.tsx'),
        ),
    setup({ el, App, props }) {
        if (!import.meta.env.SSR) {
            installProfessionalValidation();
            new MutationObserver(installProfessionalValidation).observe(document.body, {
                childList: true,
                subtree: true,
            });
        }

        if (import.meta.env.SSR) {
            hydrateRoot(el, <App {...props} />);
            return;
        }

        createRoot(el).render(<App {...props} />);
    },
    progress: {
        color: '#4B5563',
    },
});
