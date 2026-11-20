<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('students', function (Blueprint $table) {
            if (!Schema::hasColumn('students', 'birth_place')) $table->string('birth_place')->nullable();
            if (!Schema::hasColumn('students', 'nationality')) $table->string('nationality')->nullable();
            if (!Schema::hasColumn('students', 'address')) $table->text('address')->nullable();
            if (!Schema::hasColumn('students', 'photo_path')) $table->string('photo_path')->nullable();
        });

        Schema::table('enrollments', function (Blueprint $table) {
            if (!Schema::hasColumn('enrollments', 'administrative_status')) $table->string('administrative_status')->default('pending');
            if (!Schema::hasColumn('enrollments', 'pedagogical_status')) $table->string('pedagogical_status')->default('pending');
        });

        Schema::create('admissions', function (Blueprint $table) {
            $table->id();
            $table->string('candidate_first_name');
            $table->string('candidate_last_name');
            $table->string('email');
            $table->string('phone')->nullable();
            $table->date('birth_date')->nullable();
            $table->string('birth_place')->nullable();
            $table->uuid('desired_program_id')->nullable();
            $table->string('desired_level')->nullable();
            $table->string('status')->default('pending');
            $table->string('decision')->nullable();
            $table->text('decision_reason')->nullable();
            $table->foreignId('decided_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('decided_at')->nullable();
            $table->foreignId('student_id')->nullable()->constrained('students')->nullOnDelete();
            $table->timestamps();

            $table->foreign('desired_program_id')->references('id')->on('programs')->nullOnDelete();
        });

        Schema::create('admission_documents', function (Blueprint $table) {
            $table->id();
            $table->foreignId('admission_id')->constrained()->cascadeOnDelete();
            $table->string('document_type');
            $table->string('storage_path');
            $table->string('original_name');
            $table->string('checksum')->nullable();
            $table->boolean('is_required')->default(true);
            $table->string('verification_status')->default('pending');
            $table->foreignId('verified_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('verified_at')->nullable();
            $table->timestamps();
        });

        Schema::create('student_documents', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_id')->constrained()->cascadeOnDelete();
            $table->string('document_type');
            $table->string('title');
            $table->string('storage_path');
            $table->string('original_name');
            $table->string('verification_status')->default('pending');
            $table->foreignId('verified_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('verified_at')->nullable();
            $table->timestamps();
        });

        Schema::create('disciplinary_sanctions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_id')->constrained()->cascadeOnDelete();
            $table->string('sanction_type');
            $table->text('reason');
            $table->string('authority');
            $table->date('imposed_at');
            $table->date('effective_until')->nullable();
            $table->string('document_path')->nullable();
            $table->foreignId('recorded_by')->constrained('users')->restrictOnDelete();
            $table->timestamps();
        });

        Schema::create('student_certificates', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_id')->constrained()->cascadeOnDelete();
            $table->string('certificate_type');
            $table->string('reference_number')->unique();
            $table->string('document_path');
            $table->date('issued_at');
            $table->foreignId('issued_by')->constrained('users')->restrictOnDelete();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('student_certificates');
        Schema::dropIfExists('disciplinary_sanctions');
        Schema::dropIfExists('student_documents');
        Schema::dropIfExists('admission_documents');
        Schema::dropIfExists('admissions');
        Schema::table('enrollments', function (Blueprint $table) {
            $table->dropColumn(['administrative_status', 'pedagogical_status']);
        });
        Schema::table('students', function (Blueprint $table) {
            $table->dropColumn(['birth_place', 'nationality', 'address', 'photo_path']);
        });
    }
};
