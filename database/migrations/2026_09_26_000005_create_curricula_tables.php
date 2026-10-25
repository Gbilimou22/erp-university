<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('curricula', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('program_id')->constrained()->restrictOnDelete();
            $table->foreignId('academic_year_id')->constrained()->restrictOnDelete();
            $table->string('name', 150);
            $table->unsignedSmallInteger('version');
            $table->timestamps();

            $table->unique(['program_id', 'version']);
            $table->index(['program_id', 'academic_year_id']);
        });

        Schema::create('curriculum_semesters', function (Blueprint $table) {
            $table->id();
            $table->foreignUuid('curriculum_id')->constrained()->cascadeOnDelete();
            $table->string('code', 20);
            $table->string('name', 100);
            $table->unsignedSmallInteger('position');
            $table->timestamps();

            $table->unique(['curriculum_id', 'code']);
            $table->unique(['curriculum_id', 'position']);
        });

        Schema::create('curriculum_course_units', function (Blueprint $table) {
            $table->id();
            $table->foreignId('curriculum_semester_id')->constrained('curriculum_semesters')->cascadeOnDelete();
            $table->foreignId('course_unit_id')->constrained()->restrictOnDelete();
            $table->boolean('is_required')->default(true);
            $table->timestamps();

            $table->unique(['curriculum_semester_id', 'course_unit_id']);
            $table->index('course_unit_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('curriculum_course_units');
        Schema::dropIfExists('curriculum_semesters');
        Schema::dropIfExists('curricula');
    }
};
