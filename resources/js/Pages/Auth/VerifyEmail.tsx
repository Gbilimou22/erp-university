import PrimaryButton from '@/Components/PrimaryButton';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';

export default function VerifyEmail({ status }: { status?: string }) {
    const { post, processing } = useForm({});

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        post(route('verification.send'));
    };

    return (
        <GuestLayout title="Vérifiez votre adresse e-mail" description="Cette étape permet de sécuriser votre compte.">
            <Head title="Vérification de l’adresse e-mail" />

            <div className="text-sm leading-6 text-slate-600">
                Cliquez sur le lien de vérification envoyé à votre adresse e-mail. Si vous ne l’avez pas reçu, vous pouvez demander un nouvel envoi.
            </div>

            {status === 'verification-link-sent' && (
                <div role="status" className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
                    Un nouveau lien vient d’être envoyé à l’adresse associée à votre compte.
                </div>
            )}

            <form onSubmit={submit} className="mt-5 space-y-4">
                <div>
                    <PrimaryButton className="w-full justify-center bg-indigo-700 text-sm normal-case tracking-normal hover:bg-indigo-800" disabled={processing}>
                        {processing ? 'Envoi en cours…' : 'Renvoyer le lien de vérification'}
                    </PrimaryButton>

                    <Link
                        href={route('logout')}
                        method="post"
                        as="button"
                        className="mt-4 block text-center text-sm font-medium text-slate-500 hover:text-slate-800"
                    >
                        Se déconnecter
                    </Link>
                </div>
            </form>
        </GuestLayout>
    );
}
