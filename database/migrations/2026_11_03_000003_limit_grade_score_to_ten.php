<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement('ALTER TABLE grades ADD CONSTRAINT grades_score_range_check CHECK (score >= 0 AND score <= 10)');
    }

    public function down(): void
    {
        DB::statement('ALTER TABLE grades DROP CONSTRAINT grades_score_range_check');
    }
};
