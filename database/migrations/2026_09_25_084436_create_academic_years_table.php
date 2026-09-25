<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // The initial migration already creates this table with a bigint key.
        // Add the optional code field here so existing installations can migrate too.
        if (!Schema::hasColumn('academic_years', 'code')) {
            Schema::table('academic_years', function (Blueprint $table) {
                $table->string('code')->nullable()->unique();
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('academic_years', 'code')) {
            Schema::table('academic_years', function (Blueprint $table) {
                $table->dropUnique(['code']);
                $table->dropColumn('code');
            });
        }
    }
};
