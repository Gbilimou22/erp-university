<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use RuntimeException;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        if (! app()->environment('local', 'testing')) {
            throw new RuntimeException('Le peuplement synthétique est réservé aux environnements local et testing.');
        }

        $this->call([
            AdminUserSeeder::class,
            CoherentDemoDataSeeder::class,
        ]);
    }
}
