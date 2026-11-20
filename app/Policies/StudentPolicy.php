<?php

namespace App\Policies;

use App\Models\Student;
use App\Models\User;

class StudentPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasPermission('students.view')
            || $user->isStudent()
            || $user->isAdmin();
    }

    public function view(User $user, Student $student): bool
    {
        if ($user->isAdmin() || ($user->isStudent() && $user->student?->is($student))) {
            return true;
        }

        if (!$user->hasPermission('students.view')) {
            return false;
        }

        $department = $student->department()->with('faculty')->first();
        if (!$department) {
            return false;
        }

        return $user->hasScope('department', $department->id)
            || $user->hasScope('faculty', $department->faculty_id)
            || $user->hasScope('campus', $department->faculty?->campus_id);
    }

    public function create(User $user): bool
    {
        return $user->hasPermission('students.manage') || $user->isAdmin();
    }

    public function update(User $user, Student $student): bool
    {
        if ($user->isAdmin()) {
            return true;
        }

        if (!$user->hasPermission('students.manage')) {
            return false;
        }

        $department = $student->department()->with('faculty')->first();
        if (!$department) {
            return false;
        }

        return $user->hasScope('department', $department->id)
            || $user->hasScope('faculty', $department->faculty_id)
            || $user->hasScope('campus', $department->faculty?->campus_id);
    }

    public function delete(User $user, Student $student): bool
    {
        return $this->update($user, $student);
    }
}
