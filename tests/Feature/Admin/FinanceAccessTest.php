<?php

namespace Tests\Feature\Admin;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class FinanceAccessTest extends TestCase
{
    use RefreshDatabase;

    public function test_active_admin_can_access_the_school_finance_page(): void
    {
        $admin = User::factory()->create([
            'role' => 'admin',
            'is_active' => true,
            'must_change_password' => false,
        ]);

        $this->actingAs($admin)
            ->get(route('admin.finance.index'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Admin/Finance/Index')
                ->has('fees.data', 0));
    }

    public function test_non_admin_cannot_access_the_school_finance_page(): void
    {
        $student = User::factory()->create([
            'role' => 'student',
            'is_active' => true,
            'must_change_password' => false,
        ]);

        $this->actingAs($student)
            ->get(route('admin.finance.index'))
            ->assertForbidden();
    }
}