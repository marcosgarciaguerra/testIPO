package main

import (
	"net"
	"net/http"
	"sync"
	"time"

	"golang.org/x/time/rate"
)

type ipLimiter struct {
	mu     sync.Mutex
	visits map[string]*rate.Limiter
}

func newIPLimiter() *ipLimiter {
	return &ipLimiter{visits: make(map[string]*rate.Limiter)}
}

func (l *ipLimiter) allow(ip string) bool {
	l.mu.Lock()
	defer l.mu.Unlock()
	lim, ok := l.visits[ip]
	if !ok {
		lim = rate.NewLimiter(rate.Every(2*time.Second), 5)
		l.visits[ip] = lim
	}
	return lim.Allow()
}

func rateLimitWrites(next http.HandlerFunc, limiter *ipLimiter) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodPost || r.Method == http.MethodPut || r.Method == http.MethodDelete {
			ip := r.RemoteAddr
			if host, _, err := net.SplitHostPort(ip); err == nil {
				ip = host
			}
			if !limiter.allow(ip) {
				apiError(w, http.StatusTooManyRequests, "demasiadas peticiones, espera un momento")
				return
			}
		}
		next(w, r)
	}
}
