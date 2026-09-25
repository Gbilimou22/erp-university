<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('students', function (Blueprint $table) {
            $table->id();

            // Clé étrangère liée à la table users
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');

            // Clé étrangère vers le département
            $table->foreignId('department_id')->nullable()->constrained('departments')->onDelete('set null');

            $table->string('registration_number')->unique();
            $table->string('first_name');
            $table->string('last_name');
            $table->string('email')->unique();
            $table->string('phone')->nullable();
            $table->enum('gender', ['M', 'F']);
            $table->date('birth_date');
            $table->string('status')->default('active');

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('students');
    }
};
