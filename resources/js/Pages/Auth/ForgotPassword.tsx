import GuestLayout from '@/Layouts/GuestLayout';
import { Head, Link } from '@inertiajs/react';

export default function ForgotPassword() {
    return (
        <GuestLayout title="Mot de passe oublié ?" description="La récupération est gérée par l’administration de l’université.">
            <Head title="Mot de passe oublié" />
            <div className="space-y-4 text-sm leading-6 text-slate-700">
                <p>Les codes et liens par e-mail ne sont pas utilisés pour cette procédure.</p>
                <p>Contactez le service informatique ou l’administration en personne. Après vérification de votre identité, un administrateur pourra générer un mot de passe temporaire.</p>
                <p>Vous devrez choisir un nouveau mot de passe dès votre prochaine connexion. Ne communiquez jamais votre mot de passe à un tiers.</p>
                <Link href={route('login')} className="inline-flex font-medium text-indigo-700 hover:text-indigo-900">Retour à la connexion</Link>
            </div>
        </GuestLayout>
    );
}
