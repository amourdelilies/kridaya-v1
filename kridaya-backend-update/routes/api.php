<?php
use App\Http\Controllers\{AuthController,ProfileController,DiscoverController,DealController,AdminController};
use App\Http\Middleware\AdminOnly;
use Illuminate\Support\Facades\Route;

Route::post('/auth/otp', [AuthController::class,'otp'])->middleware('throttle:5,1');
Route::post('/auth/verify', [AuthController::class,'verify'])->middleware('throttle:10,1');

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/me', [AuthController::class,'me']);
    Route::post('/me/plan', [AuthController::class,'setPlan']);
    Route::post('/profile', [ProfileController::class,'store']);
    Route::get('/discover', [DiscoverController::class,'index']);

    Route::get('/deals', [DealController::class,'index']);
    Route::post('/deals', [DealController::class,'store']);
    Route::prefix('/deals/{deal}')->group(function () {
        Route::post('/respond', [DealController::class,'respond']);
        Route::post('/messages', [DealController::class,'sendMessage']);
        Route::post('/mou', [DealController::class,'mou']);
        Route::post('/sign', [DealController::class,'sign']);
        Route::post('/fulfillments', [DealController::class,'fulfil']);
        Route::post('/fulfillments/{fulfillment}/verify', [DealController::class,'verify']);
        Route::post('/end', [DealController::class,'end']);
    });

    Route::middleware(AdminOnly::class)->prefix('/admin')->group(function () {
        Route::get('/profiles', [AdminController::class,'index']);
        Route::post('/profiles/{profile}', [AdminController::class,'decide']);
    });
});
