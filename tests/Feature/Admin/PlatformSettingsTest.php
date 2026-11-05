<?php

namespace Tests\Feature\Admin;

use App\Models\AcademicYear;
use App\Models\Campus;
use App\Models\Department;
use App\Models\DepartmentFeeSchedule;
use App\Models\Faculty;
use App\Models\PlatformSetting;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class PlatformSettingsTest extends TestCase
{
    use RefreshDatabase;

    private function fakePng(string $name): UploadedFile
    {
        return UploadedFile::fake()->createWithContent(
            $name,
            base64_decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+nmQAAAABJRU5ErkJggg=='),
        );
    }

    private function administrator(): User
    {
        return User::factory()->create(['role' => 'admin', 'is_active' => true, 'must_change_password' => false]);
    }

    /** @return array{Department, AcademicYear} */
    private function departmentAndYear(): array
    {
        $campus = Campus::create(['code' => 'CAMP-01', 'name' => 'Campus principal']);
        $faculty = Faculty::create(['campus_id' => $campus->id, 'code' => 'FST', 'name' => 'Sciences']);
        $department = Department::create(['faculty_id' => $faculty->id, 'code' => 'INFO', 'name' => 'Informatique']);
        $year = AcademicYear::create([
            'name' => '2026-2027',
            'code' => 'AY-2026-2027',
            'start_date' => '2026-09-01',
            'end_date' => '2027-07-31',
            'is_current' => true,
        ]);

        return [$department, $year];
    }

    public function test_admin_can_manage_platform_information_and_department_fee_schedule(): void
    {
        $this->actingAs($this->administrator());
        [$department, $year] = $this->departmentAndYear();

        $this->get(route('admin.settings.index'))->assertOk()->assertInertia(fn (Assert $page) => $page
            ->component('Admin/Settings/Index')
            ->where('departments.0.name', 'Informatique')
            ->where('academicYears.0.name', '2026-2027'));

        $this->post(route('admin.settings.platform.update'), [
            'platform_name' => 'Université Exemple',
            'contact_email' => 'contact@example.test',
            'contact_phone' => '+224 620 00 00 00',
            'address' => 'Conakry',
            'website' => 'https://example.test',
            'platform_tagline' => 'Apprendre et innover',
        ])->assertSessionHasNoErrors();

        $this->put(route('admin.settings.departments.fee-schedule.update', $department), [
            'academic_year_id' => $year->id,
            'registration_amount' => 100,
            'registration_due_date' => '2026-09-10',
            'tuition_installment_1_amount' => 300,
            'tuition_installment_1_due_date' => '2026-10-10',
            'tuition_installment_2_amount' => 300,
            'tuition_installment_2_due_date' => '2027-01-10',
            'tuition_installment_3_amount' => 300,
            'tuition_installment_3_due_date' => '2027-04-10',
        ])->assertSessionHasNoErrors();

        $this->put(route('admin.settings.departments.fee-schedule.update', $department), [
            'academic_year_id' => $year->id,
            'registration_amount' => 120,
            'registration_due_date' => '2026-09-10',
            'tuition_installment_1_amount' => 300,
            'tuition_installment_1_due_date' => '2026-10-10',
            'tuition_installment_2_amount' => 300,
            'tuition_installment_2_due_date' => '2027-01-10',
            'tuition_installment_3_amount' => 300,
            'tuition_installment_3_due_date' => '2027-04-10',
        ])->assertSessionHasNoErrors();

        $this->assertDatabaseHas('platform_settings', ['key' => 'platform_name', 'value' => 'Université Exemple']);
        $this->assertDatabaseHas('platform_settings', ['key' => 'website', 'value' => 'https://example.test']);
        $this->assertDatabaseHas('platform_settings', ['key' => 'platform_tagline', 'value' => 'Apprendre et innover']);
        $this->assertDatabaseHas('department_fee_schedules', [
            'department_id' => $department->id,
            'academic_year_id' => $year->id,
            'registration_amount' => 120,
        ]);
        $this->assertSame(1, DepartmentFeeSchedule::count());
        $this->assertSame('Université Exemple', PlatformSetting::where('key', 'platform_name')->value('value'));
        $this->get(route('admin.settings.index'))->assertInertia(fn (Assert $page) => $page
            ->where('platformSettings.platform_name', 'Université Exemple')
            ->where('platformSettings.website', 'https://example.test'));
    }

    public function test_admin_can_upload_and_replace_university_logo_and_emblem(): void
    {
        Storage::fake('public');
        $this->actingAs($this->administrator());

        $this->post(route('admin.settings.platform.update'), [
            'platform_name' => 'Université Exemple',
            'contact_email' => '',
            'contact_phone' => '',
            'address' => '',
            'website' => '',
            'platform_tagline' => '',
            'logo' => $this->fakePng('logo.png'),
            'emblem' => $this->fakePng('emblem.png'),
        ])->assertSessionHasNoErrors();

        $logoPath = PlatformSetting::where('key', 'logo_path')->value('value');
        $emblemPath = PlatformSetting::where('key', 'emblem_path')->value('value');
        $this->assertNotEmpty($logoPath);
        $this->assertNotEmpty($emblemPath);
        Storage::disk('public')->assertExists($logoPath);
        Storage::disk('public')->assertExists($emblemPath);
        $this->get(route('admin.settings.index'))->assertInertia(fn (Assert $page) => $page
            ->where('platformSettings.logo_url', Storage::disk('public')->url($logoPath))
            ->where('platformSettings.emblem_url', Storage::disk('public')->url($emblemPath)));

        $this->post(route('admin.settings.platform.update'), [
            'platform_name' => 'Université Exemple',
            'contact_email' => '',
            'contact_phone' => '',
            'address' => '',
            'website' => '',
            'platform_tagline' => '',
            'logo' => $this->fakePng('new-logo.png'),
        ])->assertSessionHasNoErrors();

        Storage::disk('public')->assertMissing($logoPath);
        $newLogoPath = PlatformSetting::where('key', 'logo_path')->value('value');
        Storage::disk('public')->assertExists($newLogoPath);
        Storage::disk('public')->assertExists($emblemPath);

        $this->post(route('admin.settings.platform.update'), [
            'platform_name' => 'Université Exemple',
            'contact_email' => '',
            'contact_phone' => '',
            'address' => '',
            'website' => '',
            'platform_tagline' => '',
            'remove_logo' => true,
        ])->assertSessionHasNoErrors();

        Storage::disk('public')->assertMissing($newLogoPath);
        $this->assertDatabaseHas('platform_settings', ['key' => 'logo_path', 'value' => null]);
        Storage::disk('public')->assertExists($emblemPath);
    }

    public function test_department_fee_schedule_dates_must_be_inside_the_academic_year_and_in_order(): void
    {
        $this->actingAs($this->administrator());
        [$department, $year] = $this->departmentAndYear();

        $this->put(route('admin.settings.departments.fee-schedule.update', $department), [
            'academic_year_id' => $year->id,
            'registration_amount' => 100,
            'registration_due_date' => '2026-08-31',
            'tuition_installment_1_amount' => 300,
            'tuition_installment_1_due_date' => '2026-10-10',
            'tuition_installment_2_amount' => 300,
            'tuition_installment_2_due_date' => '2027-01-10',
            'tuition_installment_3_amount' => 300,
            'tuition_installment_3_due_date' => '2027-04-10',
        ])->assertInvalid(['registration_due_date']);

        $this->assertDatabaseCount('department_fee_schedules', 0);
    }
}
