<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasColumn('enrollments', 'program_id')) {
            Schema::table('enrollments', function (Blueprint $table) {
                $table->foreignUuid('program_id')->nullable()->constrained('programs')->restrictOnDelete();
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('enrollments', 'program_id')) {
            Schema::table('enrollments', function (Blueprint $table) {
                $table->dropConstrainedForeignId('program_id');
            });
        }
    }
};
