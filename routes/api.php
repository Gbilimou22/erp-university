<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\StudentController;

Route::middleware(['auth:sanctum', 'active', 'role:admin'])->group(function () {
    Route::get('/students', [StudentController::class, 'index'])->name('api.students.index');
    Route::get('/students/{student}', [StudentController::class, 'show'])->name('api.students.show');
});

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware(['auth:sanctum', 'active']);
