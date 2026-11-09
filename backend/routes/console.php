<?php
use Illuminate\Support\Facades\Schedule;
Schedule::command('kridaya:expire-deals')->everyFiveMinutes();
