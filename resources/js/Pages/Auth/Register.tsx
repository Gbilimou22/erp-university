import GuestLayout from '@/Layouts/GuestLayout';
import { Head, Link } from '@inertiajs/react';

export default function Register() {
    return (
        <GuestLayout title="Accès au portail" description="Les comptes sont créés par l’administration de l’université.">
            <Head title="Accès au portail" />
            <div className="space-y-4 text-sm leading-6 text-slate-700">
                <p>La création autonome de compte est désactivée afin que chaque accès corresponde à un dossier étudiant ou à un compte du personnel.</p>
                <p>Pour obtenir un accès, adressez-vous au service de scolarité ou à l’administration. Vos identifiants temporaires vous seront remis directement et devront être changés lors de la première connexion.</p>
                <Link href={route('login')} className="inline-flex font-medium text-indigo-700 hover:text-indigo-900">Retour à la connexion</Link>
            </div>
        </GuestLayout>
    );
}
