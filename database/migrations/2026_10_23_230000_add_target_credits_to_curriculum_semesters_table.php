<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('curriculum_semesters', function (Blueprint $table) {
            $table->unsignedSmallInteger('target_credits')->nullable()->after('position');
        });
    }

    public function down(): void
    {
        Schema::table('curriculum_semesters', function (Blueprint $table) {
            $table->dropColumn('target_credits');
        });
    }
};
