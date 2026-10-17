// Command server runs the productivity HTTP API.
package main

import (
	"context"
	"errors"
	"log/slog"
	"net"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/joho/godotenv"

	"productivity/internal/api"
	"productivity/internal/cache"
	"productivity/internal/config"
	"productivity/internal/database"
	"productivity/internal/mail"
)

func main() {
	log := slog.New(slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{Level: slog.LevelInfo}))
	if err := run(log); err != nil {
		log.Error("server stopped", "error", err)
		os.Exit(1)
	}
}

func run(log *slog.Logger) error {
	// A missing .env is fine: production injects real environment variables.
	_ = godotenv.Load()

	cfg, err := config.Load()
	if err != nil {
		return err
	}

	ctx, stop := signal.NotifyContext(context.Background(), syscall.SIGINT, syscall.SIGTERM)
	defer stop()

	if cfg.AutoMigrate {
		if err := database.Migrate(ctx, cfg.DatabaseURL, log); err != nil {
			return err
		}
	}

	db, err := database.Connect(ctx, cfg.DatabaseURL, cfg.DBMaxConns)
	if err != nil {
		return err
	}
	defer db.Close()

	store, err := cache.New(cfg.RedisURL, log)
	if err != nil {
		return err
	}
	defer store.Close()

	mailer := mail.New(mail.Config{
		Host: cfg.EmailHost, Port: cfg.EmailPort, User: cfg.EmailUser, Pass: cfg.EmailPass,
		From: cfg.EmailFrom, AppName: cfg.AppName, ClientURL: cfg.ClientURL,
		LogLinks: cfg.IsDevelopment(),
	}, log)

	srv := api.New(api.Deps{Config: cfg, DB: db, Cache: store, Mailer: mailer, Logger: log})

	go cleanupExpiredTokens(ctx, db, log)

	httpServer := &http.Server{
		Addr:              net.JoinHostPort("", cfg.Port),
		Handler:           srv.Routes(),
		ReadHeaderTimeout: 10 * time.Second,
		ReadTimeout:       30 * time.Second,
		WriteTimeout:      60 * time.Second,
		IdleTimeout:       120 * time.Second,
		BaseContext:       func(net.Listener) context.Context { return context.WithoutCancel(ctx) },
	}

	errCh := make(chan error, 1)
	go func() {
		log.Info("server listening", "port", cfg.Port, "environment", cfg.Env)
		errCh <- httpServer.ListenAndServe()
	}()

	select {
	case err := <-errCh:
		if !errors.Is(err, http.ErrServerClosed) {
			return err
		}
	case <-ctx.Done():
		log.Info("shutdown signal received, draining connections")
	}

	shutdownCtx, cancel := context.WithTimeout(context.Background(), cfg.ShutdownPeriod)
	defer cancel()
	if err := httpServer.Shutdown(shutdownCtx); err != nil {
		log.Error("http shutdown", "error", err)
	}
	srv.Drain(shutdownCtx)
	return nil
}

// cleanupExpiredTokens deletes expired refresh tokens on startup and hourly.
func cleanupExpiredTokens(ctx context.Context, db *pgxpool.Pool, log *slog.Logger) {
	ticker := time.NewTicker(time.Hour)
	defer ticker.Stop()
	for {
		tag, err := db.Exec(ctx, `DELETE FROM refresh_tokens WHERE "expiresAt" <= $1`, time.Now().UTC())
		switch {
		case err != nil && ctx.Err() == nil:
			log.Error("refresh token cleanup failed", "error", err)
		case err == nil && tag.RowsAffected() > 0:
			log.Info("expired refresh tokens removed", "count", tag.RowsAffected())
		}
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
		}
	}
}
