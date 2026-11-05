<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('subject_teacher_assignments', function (Blueprint $table) {
            $table->decimal('planned_hours', 7, 2)->nullable()->after('academic_year_id');
        });

        Schema::create('teaching_sessions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('subject_teacher_assignment_id')->constrained()->restrictOnDelete();
            $table->foreignId('recorded_by')->constrained('users')->restrictOnDelete();
            $table->date('delivered_on');
            $table->decimal('hours', 4, 2);
            $table->string('topic', 200);
            $table->timestamps();
            $table->index(['subject_teacher_assignment_id', 'delivered_on']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('teaching_sessions');

        Schema::table('subject_teacher_assignments', function (Blueprint $table) {
            $table->dropColumn('planned_hours');
        });
    }
};
