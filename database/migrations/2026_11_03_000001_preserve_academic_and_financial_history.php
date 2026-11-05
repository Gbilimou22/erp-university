<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('grades', function (Blueprint $table) {
            $table->dropForeign(['enrollment_id']);
            $table->foreign('enrollment_id')->references('id')->on('enrollments')->restrictOnDelete();
        });

        Schema::table('student_fees', function (Blueprint $table) {
            $table->dropForeign(['enrollment_id']);
            $table->foreign('enrollment_id')->references('id')->on('enrollments')->restrictOnDelete();
        });

        Schema::table('payments', function (Blueprint $table) {
            $table->dropForeign(['student_fee_id']);
            $table->foreign('student_fee_id')->references('id')->on('student_fees')->restrictOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('payments', function (Blueprint $table) {
            $table->dropForeign(['student_fee_id']);
            $table->foreign('student_fee_id')->references('id')->on('student_fees')->cascadeOnDelete();
        });

        Schema::table('student_fees', function (Blueprint $table) {
            $table->dropForeign(['enrollment_id']);
            $table->foreign('enrollment_id')->references('id')->on('enrollments')->cascadeOnDelete();
        });

        Schema::table('grades', function (Blueprint $table) {
            $table->dropForeign(['enrollment_id']);
            $table->foreign('enrollment_id')->references('id')->on('enrollments')->cascadeOnDelete();
        });
    }
};
