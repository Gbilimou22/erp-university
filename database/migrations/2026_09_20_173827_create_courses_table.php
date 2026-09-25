<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('courses', function (Blueprint $table) {
            // Clé primaire (UUID ou id standard selon votre convention)
            $table->uuid('id')->primary(); // Si UUID
            // $table->id(); // Si ID auto-incrémenté classique

            // Clé étrangère vers la table departments
            $table->foreignId('department_id')->constrained()->cascadeOnDelete(); // Utilisez foreignId si vous êtes sur des IDs classiques

            $table->string('code', 20);
            $table->string('name', 150);
            $table->text('description')->nullable();
            $table->integer('credits')->default(1);
            $table->timestamps();

            // Contrainte d'unicité : un code de cours doit être unique au sein d'un même département
            $table->unique(['department_id', 'code']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('courses');
    }
};
