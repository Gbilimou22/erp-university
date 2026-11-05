<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

class PasswordResetTest extends TestCase
{
    use RefreshDatabase;

    public function test_password_recovery_instructions_can_be_rendered(): void
    {
        $this->get('/forgot-password')
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('Auth/ForgotPassword'));
    }

    public function test_guests_cannot_request_an_email_password_reset(): void
    {
        Notification::fake();
        $user = User::factory()->create();

        $this->post('/forgot-password', ['email' => $user->email])->assertStatus(405);

        Notification::assertNothingSent();
    }

    public function test_email_reset_token_routes_are_not_available(): void
    {
        $this->get('/reset-password/fake-token')->assertNotFound();
        $this->post('/reset-password', [
            'token' => 'fake-token',
            'email' => 'student@example.test',
            'password' => 'New-password-123',
            'password_confirmation' => 'New-password-123',
        ])->assertNotFound();
    }

    public function test_an_administrator_can_issue_a_temporary_password_without_email(): void
    {
        Notification::fake();
        $admin = User::factory()->create(['role' => 'admin']);
        $student = User::factory()->create(['role' => 'student']);
        $oldPassword = $student->password;

        $response = $this->actingAs($admin)
            ->from(route('admin.account-recovery.index'))
            ->post(route('admin.account-recovery.reset', $student));

        $response->assertRedirect(route('admin.account-recovery.index'))
            ->assertSessionHas('temporary_password', fn ($password) => is_string($password) && strlen($password) >= 20);

        $temporaryPassword = $response->getSession()->get('temporary_password');
        $student->refresh();
        $this->assertNotSame($oldPassword, $student->password);
        $this->assertTrue(Hash::check($temporaryPassword, $student->password));
        $this->assertTrue($student->must_change_password);
        $this->assertDatabaseHas('audit_events', [
            'actor_id' => $admin->id,
            'action' => 'account.password_reset_by_admin',
            'auditable_id' => $student->id,
        ]);
        Notification::assertNothingSent();
    }
}