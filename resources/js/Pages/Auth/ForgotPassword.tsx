import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';

export default function ForgotPassword({ status }: { status?: string }) {
    const { data, setData, post, processing, errors } = useForm({
        email: '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        post(route('password.email'));
    };

    return (
        <GuestLayout title="Mot de passe oublié" description="Recevez un lien pour choisir un nouveau mot de passe.">
            <Head title="Mot de passe oublié" />

            {status && (
                <div role="status" className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
                    {status}
                </div>
            )}

            <form onSubmit={submit} className="space-y-4">
                <div>
                    <InputLabel htmlFor="email" value="Adresse e-mail" />
                    <TextInput
                        id="email"
                        type="email"
                        name="email"
                        value={data.email}
                        className="mt-1 block w-full"
                        autoComplete="username"
                        isFocused={true}
                        onChange={(e) => setData('email', e.target.value)}
                        required
                    />

                    <InputError message={errors.email} className="mt-2" />
                </div>

                <div className="pt-1">
                    <PrimaryButton className="w-full justify-center bg-indigo-700 text-sm normal-case tracking-normal hover:bg-indigo-800" disabled={processing}>
                        {processing ? 'Envoi en cours…' : 'Envoyer le lien de réinitialisation'}
                    </PrimaryButton>
                </div>
            </form>
        </GuestLayout>
    );
}
