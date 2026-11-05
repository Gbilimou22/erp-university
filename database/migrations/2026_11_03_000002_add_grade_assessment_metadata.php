<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('grades', function (Blueprint $table) {
            $table->string('assessment_label', 100)->nullable();
            $table->foreignId('entered_by')->nullable()->constrained('users')->nullOnDelete();
            $table->unique(
                ['enrollment_id', 'subject_id', 'type', 'assessment_label'],
                'grades_assessment_unique'
            );
        });
    }

    public function down(): void
    {
        Schema::table('grades', function (Blueprint $table) {
            $table->dropUnique('grades_assessment_unique');
            $table->dropConstrainedForeignId('entered_by');
            $table->dropColumn('assessment_label');
        });
    }
};
