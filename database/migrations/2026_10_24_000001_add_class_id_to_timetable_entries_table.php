<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('timetable_entries', function (Blueprint $table) {
            $table->foreignUuid('class_id')->nullable()->after('subject_teacher_assignment_id')->constrained('classes')->nullOnDelete();
            $table->index(['class_id', 'weekday']);
        });
    }

    public function down(): void
    {
        Schema::table('timetable_entries', function (Blueprint $table) {
            $table->dropIndex(['class_id', 'weekday']);
            $table->dropConstrainedForeignId('class_id');
        });
    }
};
