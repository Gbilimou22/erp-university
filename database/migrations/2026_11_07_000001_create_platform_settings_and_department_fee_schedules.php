<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('platform_settings', function (Blueprint $table) {
            $table->id();
            $table->string('key')->unique();
            $table->text('value')->nullable();
            $table->timestamps();
        });

        Schema::create('department_fee_schedules', function (Blueprint $table) {
            $table->id();
            $table->foreignId('department_id')->constrained()->cascadeOnDelete();
            $table->foreignId('academic_year_id')->constrained()->cascadeOnDelete();
            $table->decimal('registration_amount', 12, 2);
            $table->date('registration_due_date');
            $table->decimal('tuition_installment_1_amount', 12, 2);
            $table->date('tuition_installment_1_due_date');
            $table->decimal('tuition_installment_2_amount', 12, 2);
            $table->date('tuition_installment_2_due_date');
            $table->decimal('tuition_installment_3_amount', 12, 2);
            $table->date('tuition_installment_3_due_date');
            $table->timestamps();

            $table->unique(['department_id', 'academic_year_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('department_fee_schedules');
        Schema::dropIfExists('platform_settings');
    }
};
