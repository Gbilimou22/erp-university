<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Admission;
use App\Models\AdmissionDocument;
use App\Models\AuditEvent;
use App\Models\Program;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class AdmissionController extends Controller
{
    public function index(Request $request): Response
    {
        $query = Admission::query()->with(['program:id,name,code', 'documents', 'student:id,registration_number']);

        if ($request->filled('search')) {
            $search = $request->string('search')->toString();
            $query->where(function ($admissions) use ($search) {
                $admissions->where('candidate_first_name', 'ilike', "%{$search}%")
                    ->orWhere('candidate_last_name', 'ilike', "%{$search}%")
                    ->orWhere('email', 'ilike', "%{$search}%");
            });
        }

        if ($request->filled('status')) {
            $query->where('status', $request->string('status')->toString());
        }

        return Inertia::render('Admin/Admissions/Index', [
            'admissions' => $query->latest()->paginate(20)->withQueryString(),
            'programs' => Program::query()->select('id', 'name', 'code')->orderBy('name')->get(),
            'filters' => $request->only(['search', 'status']),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'candidate_first_name' => ['required', 'string', 'max:100'],
            'candidate_last_name' => ['required', 'string', 'max:100'],
            'email' => ['required', 'email', 'max:255'],
            'phone' => ['nullable', 'string', 'max:30'],
            'birth_date' => ['nullable', 'date', 'before:today'],
            'birth_place' => ['nullable', 'string', 'max:150'],
            'desired_program_id' => ['nullable', 'exists:programs,id'],
            'desired_level' => ['nullable', 'string', 'max:20'],
            'documents' => ['nullable', 'array'],
            'documents.*.document_type' => ['required_with:documents', 'string', 'max:100'],
            'documents.*.file' => ['required_with:documents', 'file', 'max:10240', 'mimes:pdf,jpg,jpeg,png'],
            'documents.*.is_required' => ['nullable', 'boolean'],
        ]);

        DB::transaction(function () use ($request, $validated): void {
            $admission = Admission::create([
                'candidate_first_name' => $validated['candidate_first_name'],
                'candidate_last_name' => $validated['candidate_last_name'],
                'email' => $validated['email'],
                'phone' => $validated['phone'] ?? null,
                'birth_date' => $validated['birth_date'] ?? null,
                'birth_place' => $validated['birth_place'] ?? null,
                'desired_program_id' => $validated['desired_program_id'] ?? null,
                'desired_level' => $validated['desired_level'] ?? null,
                'status' => 'pending',
            ]);

            foreach ($request->input('documents', []) as $index => $document) {
                $file = $request->file("documents.{$index}.file");
                if (!$file) {
                    continue;
                }

                $path = $file->store('private/admissions', 'local');
                AdmissionDocument::create([
                    'admission_id' => $admission->id,
                    'document_type' => $document['document_type'],
                    'storage_path' => $path,
                    'original_name' => $file->getClientOriginalName(),
                    'checksum' => hash_file('sha256', $file->getRealPath()) ?: null,
                    'is_required' => (bool) ($document['is_required'] ?? true),
                    'verification_status' => 'pending',
                ]);
            }

            AuditEvent::create([
                'actor_id' => $request->user()?->id,
                'action' => 'admission.created',
                'auditable_type' => Admission::class,
                'auditable_id' => $admission->id,
                'after' => $admission->only(['candidate_first_name', 'candidate_last_name', 'email', 'desired_program_id', 'desired_level', 'status']),
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent(),
            ]);
        });

        return back()->with('success', 'Candidature enregistrée.');
    }

    public function decide(Request $request, Admission $admission): RedirectResponse
    {
        $validated = $request->validate([
            'decision' => ['required', 'in:accepted,rejected,waiting,additional_documents'],
            'decision_reason' => ['nullable', 'string', 'max:2000'],
        ]);

        $admission->update([
            'decision' => $validated['decision'],
            'decision_reason' => $validated['decision_reason'] ?? null,
            'decided_by' => $request->user()?->id,
            'decided_at' => now(),
            'status' => $validated['decision'] === 'accepted' ? 'admitted' : ($validated['decision'] === 'rejected' ? 'rejected' : 'processing'),
        ]);

        AuditEvent::create([
            'actor_id' => $request->user()?->id,
            'action' => 'admission.decided',
            'auditable_type' => Admission::class,
            'auditable_id' => $admission->id,
            'after' => $admission->only(['decision', 'decision_reason', 'status', 'decided_by', 'decided_at']),
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
        ]);

        return back()->with('success', 'Décision enregistrée.');
    }

    public function verifyDocument(Request $request, AdmissionDocument $document): RedirectResponse
    {
        $validated = $request->validate([
            'verification_status' => ['required', 'in:pending,verified,rejected'],
        ]);

        $document->update([
            'verification_status' => $validated['verification_status'],
            'verified_by' => $request->user()?->id,
            'verified_at' => now(),
        ]);

        return back()->with('success', 'Statut de la pièce mis à jour.');
    }
}
