<?php

namespace Database\Seeders;

use App\Models\Permission;
use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Seeder;

class RolePermissionSeeder extends Seeder
{
    public function run(): void
    {
        $permissions = [
            'institution.view', 'institution.manage',
            'admissions.view', 'admissions.manage',
            'students.view', 'students.manage',
            'teachers.view', 'teachers.manage',
            'academic.view', 'academic.manage',
            'scheduling.view', 'scheduling.manage',
            'attendance.view', 'attendance.manage',
            'grades.view', 'grades.manage', 'grades.publish',
            'finance.view', 'finance.manage',
            'accounting.view', 'accounting.manage',
            'library.view', 'library.manage',
            'hr.view', 'hr.manage',
            'communication.view', 'communication.manage',
            'audit.view', 'settings.manage',
        ];

        foreach ($permissions as $permission) {
            Permission::firstOrCreate(['name' => $permission], ['label' => $permission]);
        }

        $rolePermissions = [
            'admin' => $permissions,
            'registrar' => ['institution.view', 'admissions.view', 'admissions.manage', 'students.view', 'students.manage', 'academic.view', 'scheduling.view', 'grades.view', 'grades.publish', 'finance.view', 'communication.view'],
            'faculty_head' => ['institution.view', 'students.view', 'teachers.view', 'academic.view', 'academic.manage', 'scheduling.view', 'grades.view', 'grades.publish'],
            'department_head' => ['institution.view', 'students.view', 'teachers.view', 'academic.view', 'academic.manage', 'scheduling.view', 'grades.view'],
            'teacher' => ['academic.view', 'scheduling.view', 'attendance.view', 'attendance.manage', 'grades.view', 'grades.manage', 'communication.view'],
            'finance' => ['students.view', 'finance.view', 'finance.manage', 'accounting.view', 'accounting.manage'],
            'librarian' => ['library.view', 'library.manage'],
            'student' => ['academic.view', 'scheduling.view', 'grades.view', 'finance.view'],
            'parent' => [],
            'hr' => ['hr.view', 'hr.manage'],
            'auditor' => ['audit.view', 'institution.view', 'students.view', 'academic.view', 'finance.view', 'accounting.view'],
        ];

        foreach ($rolePermissions as $roleName => $rolePermissionNames) {
            $role = Role::firstOrCreate(['name' => $roleName], ['label' => $roleName]);
            $role->permissions()->sync(
                Permission::whereIn('name', $rolePermissionNames)->pluck('id')->all()
            );

            foreach (User::where('role', $roleName)->get() as $user) {
                $user->roles()->syncWithoutDetaching([$role->id]);
            }
        }
    }
};
