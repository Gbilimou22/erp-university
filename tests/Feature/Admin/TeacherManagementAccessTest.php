<?php

namespace Tests\Feature\Admin;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class TeacherManagementAccessTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_render_teacher_list(): void
    {
        $admin = User::factory()->create(['role' => 'admin', 'is_active' => true, 'must_change_password' => false]);

        $this->actingAs($admin)
            ->get(route('admin.teachers.index'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page->component('Admin/Teachers/Index'));
    }

    public function test_admin_can_open_teacher_dossier(): void
    {
        $admin = User::factory()->create(['role' => 'admin', 'is_active' => true, 'must_change_password' => false]);
        $teacher = User::factory()->create(['role' => 'teacher', 'is_active' => true, 'must_change_password' => false]);

        $this->actingAs($admin)
            ->get(route('admin.teachers.show', $teacher))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Admin/Teachers/Show')
                ->where('teacher.id', $teacher->id));
    }
}
