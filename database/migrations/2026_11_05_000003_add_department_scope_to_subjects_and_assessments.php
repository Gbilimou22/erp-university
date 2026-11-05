<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('subjects', function (Blueprint $table) {
            $table->foreignId('department_id')->nullable()->after('course_unit_id')->constrained()->nullOnDelete();
        });

        Schema::table('assessments', function (Blueprint $table) {
            $table->foreignId('department_id')->nullable()->after('subject_id')->constrained()->nullOnDelete();
            $table->index(['academic_year_id', 'department_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::table('assessments', function (Blueprint $table) {
            $table->dropIndex(['academic_year_id', 'department_id', 'status']);
            $table->dropConstrainedForeignId('department_id');
        });
        Schema::table('subjects', function (Blueprint $table) {
            $table->dropConstrainedForeignId('department_id');
        });
    }
};
