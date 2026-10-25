<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
public function up(): void
{
Schema::table('timetable_entries', function (Blueprint $table) {
// Ajout des colonnes si elles n'existent pas
if (!Schema::hasColumn('timetable_entries', 'subject_id')) {
$table->foreignId('subject_id')->nullable()->constrained('subjects')->cascadeOnDelete();
}
if (!Schema::hasColumn('timetable_entries', 'teacher_id')) {
$table->foreignId('teacher_id')->nullable()->constrained('users')->cascadeOnDelete();
}
if (!Schema::hasColumn('timetable_entries', 'academic_year_id')) {
$table->foreignId('academic_year_id')->nullable()->constrained('academic_years')->cascadeOnDelete();
}
if (!Schema::hasColumn('timetable_entries', 'weekday')) {
$table->tinyInteger('weekday')->default(1); // 1 = Lundi, etc.
}
if (!Schema::hasColumn('timetable_entries', 'type')) {
$table->string('type', 20)->default('CM'); // CM, TD, TP, Exam
}
});
}

public function down(): void
{
Schema::table('timetable_entries', function (Blueprint $table) {
$table->dropForeign(['subject_id']);
$table->dropForeign(['teacher_id']);
$table->dropForeign(['academic_year_id']);
$table->dropColumn(['subject_id', 'teacher_id', 'academic_year_id', 'weekday', 'type']);
});
}
};
