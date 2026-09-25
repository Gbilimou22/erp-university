<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('rooms', function (Blueprint $table) {
            $table->id();
            $table->foreignId('campus_id')->constrained()->restrictOnDelete();
            $table->string('code', 30);
            $table->string('name', 150);
            $table->unsignedInteger('capacity')->default(1);
            $table->string('type', 30)->default('classroom');
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->unique(['campus_id', 'code']);
        });

        Schema::create('timetable_entries', function (Blueprint $table) {
            $table->id();
            $table->foreignId('subject_teacher_assignment_id')->constrained('subject_teacher_assignments')->restrictOnDelete();
            $table->foreignId('room_id')->constrained()->restrictOnDelete();
            $table->unsignedSmallInteger('weekday'); // ISO-8601: 1 lundi - 7 dimanche
            $table->time('start_time');
            $table->time('end_time');
            $table->timestamps();
            $table->index(['weekday', 'start_time', 'end_time']);
            $table->index(['room_id', 'weekday']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('timetable_entries');
        Schema::dropIfExists('rooms');
    }
};
