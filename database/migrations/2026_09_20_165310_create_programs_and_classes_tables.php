<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Filières / Programmes
        if (!Schema::hasTable('programs')) {
            Schema::create('programs', function (Blueprint $table) {
                $table->uuid('id')->primary();
                $table->foreignId('department_id')->constrained()->cascadeOnDelete();
                $table->string('code', 20);
                $table->string('name', 150);
                $table->enum('degree_level', ['LICENCE', 'MASTER', 'DOCTORAT', 'DUT']);
                $table->integer('duration_years')->default(3);
                $table->timestamps();
            });
        }

        // Classes / Niveaux
        if (!Schema::hasTable('classes')) {
            Schema::create('classes', function (Blueprint $table) {
                $table->uuid('id')->primary();
                $table->foreignUuid('program_id')->constrained('programs')->onDelete('cascade');
                $table->string('code', 20);
                $table->string('name', 100);
                $table->integer('level');
                $table->timestamps();
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('classes');
        Schema::dropIfExists('programs');
    }
};
