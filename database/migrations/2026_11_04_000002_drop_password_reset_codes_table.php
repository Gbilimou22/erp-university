<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::dropIfExists('password_reset_codes');
    }

    public function down(): void
    {
        // The obsolete email-code flow is intentionally not restored.
    }
};
