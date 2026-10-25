<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('classes', function (Blueprint $table) {
            $table->foreignId('academic_year_id')->nullable()->after('program_id')->constrained()->restrictOnDelete();
            $table->string('level_code', 10)->nullable()->after('level');
            $table->unsignedSmallInteger('capacity')->default(60)->after('level_code');
            $table->unique(['program_id', 'academic_year_id', 'level_code', 'code'], 'classes_program_year_level_code_unique');
        });

        Schema::table('enrollments', function (Blueprint $table) {
            $table->foreignUuid('class_id')->nullable()->after('program_id')->constrained('classes')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('enrollments', function (Blueprint $table) {
            $table->dropConstrainedForeignId('class_id');
        });

        Schema::table('classes', function (Blueprint $table) {
            $table->dropUnique('classes_program_year_level_code_unique');
            $table->dropConstrainedForeignId('academic_year_id');
            $table->dropColumn(['level_code', 'capacity']);
        });
    }
};
