<?php

namespace Tests\Feature\Admin;

use App\Models\Permission;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class PermissionRouteAccessTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_access_permission_protected_admissions_route(): void
    {
        $admin = User::factory()->create(['role' => 'admin', 'is_active' => true, 'must_change_password' => false]);

        $this->actingAs($admin)
            ->get(route('admin.admissions.index'))
            ->assertOk();
    }

    public function test_admin_can_render_teacher_management_page(): void
    {
        $admin = User::factory()->create(['role' => 'admin', 'is_active' => true, 'must_change_password' => false]);

        $this->actingAs($admin)
            ->get(route('admin.teachers.index'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Admin/Teachers/Index')
                ->has('teachers.data'));
    }

    public function test_department_head_without_admission_permission_is_forbidden(): void
    {
        $head = User::factory()->create(['role' => 'department_head', 'is_active' => true, 'must_change_password' => false]);

        $this->actingAs($head)
            ->get(route('admin.admissions.index'))
            ->assertForbidden();
    }

    public function test_user_with_permission_can_access_admissions_route(): void
    {
        $permission = Permission::create(['name' => 'admissions.view', 'label' => 'Voir les admissions']);
        $role = Role::create(['name' => 'registrar', 'label' => 'Scolarité']);
        $role->permissions()->attach($permission);

        $registrar = User::factory()->create(['role' => 'registrar', 'is_active' => true, 'must_change_password' => false]);
        $registrar->roles()->attach($role);

        $this->actingAs($registrar)
            ->get(route('admin.admissions.index'))
            ->assertOk();
    }
}
