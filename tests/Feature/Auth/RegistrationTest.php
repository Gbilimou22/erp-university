<?php

namespace Tests\Feature\Auth;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RegistrationTest extends TestCase
{
    use RefreshDatabase;

    public function test_registration_information_screen_can_be_rendered(): void
    {
        $this->get('/register')
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('Auth/Register'));
    }

    public function test_guests_cannot_create_accounts_through_public_registration(): void
    {
        $response = $this->post('/register', [
            'name' => 'Test User',
            'email' => 'test@example.test',
            'password' => 'New-password-123',
            'password_confirmation' => 'New-password-123',
        ]);

        $response->assertStatus(405);
        $this->assertGuest();
        $this->assertDatabaseMissing('users', ['email' => 'test@example.test']);
    }
}
