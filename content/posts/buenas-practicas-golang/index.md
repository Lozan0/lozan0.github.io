---
title: Buenas practicas en Golang
date: 2026-09-05
tags: ['Desarrollo', 'Golang', 'Skills']
---

# Escribir buen código en Go

Guía práctica basada en las fuentes oficiales:

- **Effective Go** — https://go.dev/doc/effective_go
- **Google Go Style Guide** (Style Guide, Decisions, Best Practices) — https://google.github.io/styleguide/go/
- **Go Code Review Comments** — https://go.dev/wiki/CodeReviewComments
- **Go Proverbs** — https://go-proverbs.github.io/
- **Organizing a Go module** — https://go.dev/doc/modules/layout

> Regla cero: `gofmt` decide el formato, no tú. Nunca discutas estilo de formato en un code review; discute nombres, límites de paquetes y APIs.

> **Nota importante:** Como todos sabemos, hoy en día la IA ya es capaz de escribir código por nosotros, y muchas veces lo hace de mejor manera. No obstante, esta guía pretende que entiendas cómo debería escribirse el código en Go para que puedas generar proyectos con código limpio, siguiendo las buenas prácticas de sus creadores. Esto se puede lograr de manera eficiente con la [skill](#16-bonus-skill) que te dejo al final, para que puedas integrarla a tu flujo de desarrollo.

---

## Índice

1. [Mentalidad: Go no es Java ni Python](#1-mentalidad)
2. [Nombres (naming)](#2-nombres)
3. [Estructuras (structs)](#3-estructuras)
4. ["Clases": métodos y receptores](#4-clases-metodos-y-receptores)
5. [Punteros vs valores](#5-punteros-vs-valores)
6. [Composición en lugar de herencia](#6-composicion-embedding)
7. [Interfaces](#7-interfaces)
8. [Inyección de dependencias](#8-inyeccion-de-dependencias)
9. [Exportación: público vs privado](#9-exportacion)
10. [Errores](#10-errores)
11. [Concurrencia y context](#11-concurrencia-y-context)
12. [Estructura de proyecto](#12-estructura-de-proyecto)
13. [Tests](#13-tests)
14. [Checklist y herramientas](#14-checklist)
15. [Resumen en 12 líneas](#15-resumen-en-12-líneas)
16. [Bonus: skill](#16-bonus-skill)

---

## 1. Mentalidad

Go no tiene clases, ni herencia, ni constructores implícitos, ni excepciones. Tiene:

| Quieres... | En Go se hace con... |
|---|---|
| Clase | `struct` + métodos con receptor |
| Constructor | función `NewXxx()` que devuelve el tipo |
| Herencia | **composición** (embedding) |
| Interfaz/polimorfismo | `interface` satisfecha implícitamente |
| Atributos privados | identificador en minúscula |
| Excepciones | valores de `error` devueltos |
| Genéricos | type parameters (Go 1.18+), con moderación |

Tres proverbios que resumen la filosofía:

- *"Clear is better than clever."* (Claro es mejor que ingenioso.)
- *"The bigger the interface, the weaker the abstraction."*
- *"A little copying is better than a little dependency."*

---

## 2. Nombres

### 2.1 MixedCaps, nunca snake_case

```go
// ❌ mal
var max_retry_count int
func send_email() {}

// ✅ bien
var maxRetryCount int
func sendEmail() {}
func SendEmail() {} // exportado
```

### 2.2 La longitud del nombre es proporcional a su alcance

Un nombre de vida corta puede (y debe) ser corto. Uno exportado y global debe ser descriptivo.

```go
// ✅ idiomático: i, r, w, err, ctx, buf en ámbitos pequeños
for i, v := range items {
    fmt.Println(i, v)
}

func Copy(dst io.Writer, src io.Reader) (int64, error) { ... }

// ❌ ruido innecesario
for indexOfCurrentItem, valueOfCurrentItem := range items { ... }
```

### 2.3 Evita el "stutter" (tartamudeo) con el paquete

El nombre del paquete forma parte del nombre completo del identificador.

```go
// paquete: user

// ❌ se usa como user.UserService, user.NewUserService
type UserService struct{}
func NewUserService() *UserService

// ✅ se usa como user.Service, user.New
type Service struct{}
func New() *Service
```

Ejemplos reales de la stdlib: `http.Server` (no `http.HTTPServer`), `bytes.Buffer`, `time.Duration`, `errors.New`.

### 2.4 Nombres de paquete

```go
// ✅ cortos, minúscula, una sola palabra, sin guiones ni underscore
package user
package httputil
package pubsub

// ❌
package userManagement
package user_service
package utils        // no dice nada
package common       // basurero: acabará dependiendo de todo
package base
```

### 2.5 Getters y setters

Go **no** usa el prefijo `Get`.

```go
type Config struct {
    owner string
}

// ✅
func (c *Config) Owner() string       { return c.owner }
func (c *Config) SetOwner(o string)   { c.owner = o }

// ❌
func (c *Config) GetOwner() string    { return c.owner }
```

Excepción: si el getter hace una petición real (RPC, HTTP), `Get` sí puede aparecer (`client.GetUser(ctx, id)`).

### 2.6 Interfaces terminan en `-er`

```go
type Reader interface   { Read(p []byte) (int, error) }
type Notifier interface { Notify(ctx context.Context, msg string) error }
type Validator interface{ Validate() error }
```

### 2.7 Comentarios de documentación

Empiezan con el nombre del identificador y son frases completas. Son lo que verá `go doc` y pkg.go.dev.

```go
// ✅
// Service coordina el ciclo de vida de los usuarios.
// Es seguro para uso concurrente.
type Service struct{ ... }

// Register crea un usuario nuevo y devuelve ErrDuplicate si el email ya existe.
func (s *Service) Register(ctx context.Context, email string) (*User, error)

// ❌
// esta es la struct de servicio
type Service struct{ ... }
```

---

## 3. Estructuras

### 3.1 El valor cero debe ser útil

Es una de las decisiones de diseño más importantes de Go. Si tu struct funciona recién declarada, tu API es más simple.

```go
// ✅ La stdlib lo hace así:
var buf bytes.Buffer          // listo para usar
buf.WriteString("hola")

var mu sync.Mutex             // listo para usar
mu.Lock()

var wg sync.WaitGroup         // listo para usar
```

Aplicado a tu código:

```go
// ✅ Counter funciona sin constructor
type Counter struct {
    mu     sync.Mutex
    counts map[string]int // nil hasta el primer uso
}

func (c *Counter) Inc(key string) {
    c.mu.Lock()
    defer c.mu.Unlock()
    if c.counts == nil {          // lazy init: mantiene útil el valor cero
        c.counts = make(map[string]int)
    }
    c.counts[key]++
}

// uso
var c Counter
c.Inc("hits")
```

### 3.2 Constructores: `New` / `NewXxx`

Úsalos cuando el valor cero **no** sea válido (dependencias obligatorias, invariantes).

```go
// Paquete cache. Se usará como cache.New(...)
type Cache struct {
    ttl   time.Duration
    items map[string]item
}

// New crea una Cache con el TTL indicado.
func New(ttl time.Duration) *Cache {
    return &Cache{
        ttl:   ttl,
        items: make(map[string]item),
    }
}

// Si puede fallar la validación, devuelve error (no hagas panic).
func NewFromDSN(dsn string) (*Cache, error) {
    if dsn == "" {
        return nil, errors.New("cache: dsn vacío")
    }
    ...
}
```

Regla: **un constructor no debe hacer trabajo pesado ni I/O sorpresa**; que sea barato y predecible.

### 3.3 Siempre literales con nombre de campo

```go
type Point struct{ X, Y int }

// ✅ resistente a que se añadan/reordenen campos
p := Point{X: 1, Y: 2}

// ❌ posicional: se rompe silenciosamente al cambiar la struct
p := Point{1, 2}
```

(Excepción tolerada: structs muy pequeñas y estables dentro del mismo paquete, típicamente en tablas de tests.)

### 3.4 Agrupa y ordena los campos con intención

```go
type Server struct {
    // Configuración inmutable tras la construcción.
    addr    string
    timeout time.Duration

    // Dependencias.
    logger *slog.Logger
    store  Store

    // Estado mutable protegido por mu.
    mu       sync.Mutex
    conns    map[string]*conn
    shutdown bool
}
```

Convención muy útil: el mutex va **justo encima** de lo que protege, y se documenta.

### 3.5 Structs vacías y sets

```go
// struct{} no ocupa memoria: ideal para sets y señales
seen := make(map[string]struct{})
seen["a"] = struct{}{}
if _, ok := seen["a"]; ok { ... }

done := make(chan struct{}) // canal de señalización
close(done)
```

### 3.6 No copies structs que contengan mutex

```go
type Registry struct {
    mu sync.Mutex
    m  map[string]string
}

// ❌ receptor por valor: copia el mutex → el lock no protege nada
func (r Registry) Add(k, v string) { ... }

// ✅
func (r *Registry) Add(k, v string) { ... }
```

`go vet` detecta esto (`copylocks`). Ejecútalo siempre.

### 3.7 Tags de struct para serialización

```go
type User struct {
    ID        string    `json:"id"`
    Email     string    `json:"email"`
    Password  string    `json:"-"`                 // nunca se serializa
    CreatedAt time.Time `json:"created_at"`
    Nickname  string    `json:"nickname,omitempty"`
}
```

---

## 4. "Clases": métodos y receptores

Un método es una función con un receptor. El tipo puede ser cualquier tipo con nombre del paquete, no solo structs.

```go
// Métodos sobre un tipo básico
type Celsius float64

func (c Celsius) Fahrenheit() Celsius { return c*9/5 + 32 }
func (c Celsius) String() string      { return fmt.Sprintf("%.1f°C", float64(c)) }

// Métodos sobre un slice
type Users []User

func (us Users) Emails() []string {
    out := make([]string, 0, len(us))
    for _, u := range us {
        out = append(out, u.Email)
    }
    return out
}

// Métodos sobre una función (así funciona http.HandlerFunc)
type HandlerFunc func(w http.ResponseWriter, r *http.Request)

func (f HandlerFunc) ServeHTTP(w http.ResponseWriter, r *http.Request) { f(w, r) }
```

### Consistencia de receptor

Si **algún** método necesita puntero, usa puntero en **todos**.

```go
// ❌ mezclado y confuso
func (u User) FullName() string {}
func (u *User) SetEmail(e string) {}

// ✅ coherente
func (u *User) FullName() string {}
func (u *User) SetEmail(e string) {}
```

Nombre del receptor: 1–2 letras derivadas del tipo (`s *Service`, `u *User`, `srv *Server`). Nunca `this` ni `self`.

---

## 5. Punteros vs valores

### 5.1 Cuándo usar receptor puntero

Usa `*T` si:

1. El método **modifica** el receptor.
2. El struct es **grande** (evitar copias).
3. Contiene `sync.Mutex` u otro campo que no debe copiarse.
4. Ya hay otros métodos con receptor puntero (consistencia).
5. Necesitas distinguir "no presente" (`nil`).

Usa `T` (valor) si el tipo es pequeño e inmutable: `time.Time`, `Celsius`, `Point`, IDs.

```go
// ✅ valor: pequeño e inmutable
type Money struct{ cents int64; currency string }
func (m Money) Add(o Money) Money { return Money{m.cents + o.cents, m.currency} }

// ✅ puntero: mutación
type Basket struct{ items []Item }
func (b *Basket) Add(i Item) { b.items = append(b.items, i) }
```

### 5.2 No devuelvas punteros por costumbre

```go
// ❌ puntero innecesario a un valor pequeño: presión sobre el GC y nil posible
func Origin() *Point { return &Point{} }

// ✅
func Origin() Point { return Point{} }
```

### 5.3 Nunca punteros a interfaces, slices o maps

```go
// ❌
func process(r *io.Reader)      {}
func handle(items *[]string)    {}
func lookup(m *map[string]int)  {}

// ✅ las interfaces ya son referencias; slices y maps ya llevan puntero interno
func process(r io.Reader)      {}
func handle(items []string)    {}          // ojo: append no se ve fuera
func lookup(m map[string]int)  {}          // las escrituras SÍ se ven fuera
```

Único caso legítimo de `*[]T`: necesitas que un `append` sea visible para quien llama (raro; mejor devolver el slice).

```go
// ✅ patrón idiomático en lugar de *[]T
func addDefaults(tags []string) []string {
    return append(tags, "default")
}
tags = addDefaults(tags)
```

### 5.4 Punteros para campos opcionales

```go
type UpdateUserRequest struct {
    Email    *string // nil = no cambiar; "" = poner vacío
    Nickname *string
}

func (s *Service) Update(ctx context.Context, id string, req UpdateUserRequest) error {
    u, err := s.store.ByID(ctx, id)
    if err != nil {
        return err
    }
    if req.Email != nil {
        u.Email = *req.Email
    }
    return s.store.Save(ctx, u)
}
```

### 5.5 Cuidado con `nil` en métodos

Un método con receptor puntero puede llamarse sobre `nil`. Puedes aprovecharlo o protegerte:

```go
type Logger struct{ w io.Writer }

// ✅ nil-safe: un *Logger nil simplemente no escribe
func (l *Logger) Printf(format string, args ...any) {
    if l == nil {
        return
    }
    fmt.Fprintf(l.w, format, args...)
}
```

---

## 6. Composición (embedding)

Go no tiene herencia. Tiene **embedding**, que promueve los métodos del tipo interno.

### 6.1 Embedding de structs

```go
type Base struct {
    ID        string
    CreatedAt time.Time
}

func (b *Base) Age() time.Duration { return time.Since(b.CreatedAt) }

type Article struct {
    Base            // embebido, sin nombre de campo
    Title string
    Body  string
}

a := Article{
    Base:  Base{ID: "a1", CreatedAt: time.Now()},
    Title: "Go",
}
fmt.Println(a.ID)     // promovido desde Base
fmt.Println(a.Age())  // método promovido
```

**Importante:** esto no es herencia. No hay polimorfismo: `Base` no "sabe" nada de `Article`, y no existen métodos virtuales ni `super`.

### 6.2 Embedding de interfaces: extender comportamiento

Patrón muy usado en decoradores y en tests.

```go
type Store interface {
    ByID(ctx context.Context, id string) (*User, error)
    Save(ctx context.Context, u *User) error
}

// loggingStore decora cualquier Store añadiendo trazas.
type loggingStore struct {
    Store                 // hereda todos los métodos que no reescribo
    log *slog.Logger
}

func (s loggingStore) ByID(ctx context.Context, id string) (*User, error) {
    start := time.Now()
    u, err := s.Store.ByID(ctx, id)   // delegación explícita
    s.log.Info("store.ByID", "id", id, "dur", time.Since(start), "err", err)
    return u, err
}

func WithLogging(s Store, log *slog.Logger) Store {
    return loggingStore{Store: s, log: log}
}
```

Lo mismo aplica a la stdlib: `bufio.ReadWriter` embebe `*Reader` y `*Writer`.

### 6.3 Cuándo NO embeber

```go
// ❌ embebes Mutex y expones Lock()/Unlock() en tu API pública sin querer
type Cache struct {
    sync.Mutex
    m map[string]string
}

// ✅ campo con nombre: el lock es un detalle interno
type Cache struct {
    mu sync.Mutex
    m  map[string]string
}
```

Regla del Google Style Guide: embebe solo si tiene sentido que **toda** la API del tipo interno forme parte de la API del externo.

---

## 7. Interfaces

### 7.1 Pequeñas. Muy pequeñas.

```go
// ✅ las interfaces más útiles de Go tienen 1 método
type Reader interface { Read(p []byte) (n int, err error) }
type Stringer interface { String() string }

// ❌ interfaz-catálogo: nadie puede implementarla ni testearla cómodamente
type UserManager interface {
    Create(...) error
    Update(...) error
    Delete(...) error
    List(...) ([]User, error)
    Export(...) ([]byte, error)
    SendWelcomeEmail(...) error
    // ...20 métodos más
}
```

### 7.2 La interfaz la define el **consumidor**, no el implementador

Esto es lo que más diferencia a Go de Java/C#.

```go
// ❌ estilo Java: el paquete de la implementación define la interfaz
package postgres
type UserRepository interface { ... }  // y el service depende de postgres
type userRepo struct{}

// ✅ estilo Go: el paquete que la USA declara lo que necesita
package user

type Store interface {                 // 2 métodos: solo lo que Service usa
    ByID(ctx context.Context, id string) (*User, error)
    Save(ctx context.Context, u *User) error
}

package postgres
type UserStore struct{ db *sql.DB }    // no importa "user": solo cumple la forma
func (s *UserStore) ByID(...) (*user.User, error) { ... }
```

Ventajas: el paquete de dominio no depende de la infraestructura, los mocks son triviales y no hay interfaces "por si acaso".

### 7.3 "Acepta interfaces, devuelve structs"

```go
// ✅ flexible en la entrada, concreto (y documentado) en la salida
func Load(r io.Reader) (*Config, error)

// ❌ obliga al llamante a un tipo concreto y oculta la API real de la salida
func Load(f *os.File) (Configurer, error)
```

### 7.4 No crees una interfaz "por si acaso"

Del Code Review Comments: no definas interfaces antes de tener **dos** implementaciones reales (contando el mock de test como media). Empieza con el tipo concreto; extraer la interfaz después es trivial.

### 7.5 Verificación de cumplimiento en tiempo de compilación

```go
// Asegura que *UserStore implementa user.Store; falla al compilar si no.
var _ user.Store = (*UserStore)(nil)
```

### 7.6 Ojo: interfaz con puntero nil no es nil

```go
type myErr struct{}
func (*myErr) Error() string { return "boom" }

func f() error {
    var e *myErr        // nil
    return e            // ¡la interfaz NO es nil!
}

if f() != nil { fmt.Println("entra aquí, sorpresa") }

// ✅ devuelve explícitamente nil
func g() error {
    var e *myErr
    if e == nil {
        return nil
    }
    return e
}
```

---

## 8. Inyección de dependencias

Go no necesita framework de DI. La inyección se hace **por constructor**, pasando interfaces pequeñas.

### 8.1 Patrón base: constructor injection

```go
// internal/user/service.go
package user

import (
	"context"
	"errors"
	"fmt"
	"log/slog"
	"time"
)

var (
	ErrNotFound  = errors.New("user: not found")
	ErrDuplicate = errors.New("user: email already registered")
)

type User struct {
	ID        string
	Email     string
	CreatedAt time.Time
}

// Store abstrae la persistencia que necesita Service.
type Store interface {
	ByEmail(ctx context.Context, email string) (*User, error)
	Save(ctx context.Context, u *User) error
}

// Mailer envía notificaciones transaccionales.
type Mailer interface {
	Send(ctx context.Context, to, subject, body string) error
}

// Clock permite controlar el tiempo en los tests.
type Clock interface {
	Now() time.Time
}

// Service implementa los casos de uso de usuarios.
type Service struct {
	store  Store
	mailer Mailer
	clock  Clock
	log    *slog.Logger
}

// NewService construye un Service. store y mailer son obligatorios.
func NewService(store Store, mailer Mailer, opts ...Option) (*Service, error) {
	if store == nil {
		return nil, errors.New("user: store es obligatorio")
	}
	if mailer == nil {
		return nil, errors.New("user: mailer es obligatorio")
	}
	s := &Service{
		store:  store,
		mailer: mailer,
		clock:  systemClock{},        // default sensato
		log:    slog.Default(),
	}
	for _, opt := range opts {
		opt(s)
	}
	return s, nil
}

func (s *Service) Register(ctx context.Context, email string) (*User, error) {
	if email == "" {
		return nil, errors.New("user: email vacío")
	}

	switch _, err := s.store.ByEmail(ctx, email); {
	case err == nil:
		return nil, ErrDuplicate
	case !errors.Is(err, ErrNotFound):
		return nil, fmt.Errorf("buscando usuario: %w", err)
	}

	u := &User{ID: newID(), Email: email, CreatedAt: s.clock.Now()}
	if err := s.store.Save(ctx, u); err != nil {
		return nil, fmt.Errorf("guardando usuario: %w", err)
	}

	if err := s.mailer.Send(ctx, email, "Bienvenido", "¡Hola!"); err != nil {
		// No es crítico: se registra pero no se falla el caso de uso.
		s.log.WarnContext(ctx, "no se pudo enviar bienvenida", "err", err)
	}
	return u, nil
}

type systemClock struct{}

func (systemClock) Now() time.Time { return time.Now() }
```

### 8.2 Functional options para lo opcional

Evita constructores con 8 parámetros y `nil, nil, nil`.

```go
// Option configura un Service.
type Option func(*Service)

// WithClock sustituye el reloj del sistema (útil en tests).
func WithClock(c Clock) Option {
	return func(s *Service) { s.clock = c }
}

// WithLogger fija el logger.
func WithLogger(l *slog.Logger) Option {
	return func(s *Service) {
		if l != nil {
			s.log = l
		}
	}
}

// uso
svc, err := user.NewService(store, mailer,
	user.WithLogger(logger),
	user.WithClock(fakeClock{}),
)
```

Variante con error (cuando la opción puede ser inválida):

```go
type Option func(*Service) error

func WithTimeout(d time.Duration) Option {
	return func(s *Service) error {
		if d <= 0 {
			return fmt.Errorf("timeout inválido: %v", d)
		}
		s.timeout = d
		return nil
	}
}
```

### 8.3 El cableado ocurre en `main`

Todas las dependencias concretas se resuelven en un único sitio.

```go
// cmd/api/main.go
package main

import (
	"context"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"time"

	"example.com/app/internal/httpapi"
	"example.com/app/internal/postgres"
	"example.com/app/internal/ses"
	"example.com/app/internal/user"
)

func main() {
	if err := run(); err != nil {
		slog.Error("fatal", "err", err)
		os.Exit(1)
	}
}

// run devuelve error en lugar de llamar a os.Exit: es testeable.
func run() error {
	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt)
	defer stop()

	log := slog.New(slog.NewJSONHandler(os.Stdout, nil))

	db, err := postgres.Open(ctx, os.Getenv("DATABASE_URL"))
	if err != nil {
		return fmt.Errorf("conectando a postgres: %w", err)
	}
	defer db.Close()

	// Composición: cada capa recibe la anterior.
	store := postgres.NewUserStore(db)
	mailer := ses.New(os.Getenv("AWS_REGION"))

	svc, err := user.NewService(store, mailer, user.WithLogger(log))
	if err != nil {
		return fmt.Errorf("construyendo servicio: %w", err)
	}

	srv := &http.Server{
		Addr:              ":8080",
		Handler:           httpapi.NewRouter(svc, log),
		ReadHeaderTimeout: 5 * time.Second,
	}

	go func() {
		<-ctx.Done()
		shutCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancel()
		_ = srv.Shutdown(shutCtx)
	}()

	if err := srv.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
		return err
	}
	return nil
}
```

### 8.4 Inyección en la capa HTTP

```go
// internal/httpapi/user.go
package httpapi

// UserService es lo que el handler necesita del dominio.
type UserService interface {
	Register(ctx context.Context, email string) (*user.User, error)
}

type UserHandler struct {
	svc UserService
	log *slog.Logger
}

func NewUserHandler(svc UserService, log *slog.Logger) *UserHandler {
	return &UserHandler{svc: svc, log: log}
}

func (h *UserHandler) Register(w http.ResponseWriter, r *http.Request) {
	var req struct{ Email string `json:"email"` }
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "json inválido", http.StatusBadRequest)
		return
	}

	u, err := h.svc.Register(r.Context(), req.Email)
	switch {
	case errors.Is(err, user.ErrDuplicate):
		http.Error(w, "email ya registrado", http.StatusConflict)
		return
	case err != nil:
		h.log.ErrorContext(r.Context(), "register", "err", err)
		http.Error(w, "error interno", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	_ = json.NewEncoder(w).Encode(u)
}
```

### 8.5 Antipatrones de DI en Go

```go
// ❌ 1. Singleton global mutable: imposible de testear en paralelo
var DB *sql.DB
func init() { DB, _ = sql.Open("postgres", os.Getenv("DSN")) } // + I/O en init()

// ❌ 2. Service locator / contenedor mágico
type Container struct{ deps map[string]any }
func (c *Container) Get(name string) any { return c.deps[name] }

// ❌ 3. Meter dependencias en el context.Context
ctx = context.WithValue(ctx, "db", db)   // el context es para cancelación
                                         // y datos de petición, no para DI

// ❌ 4. Inyección por setter, dejando el objeto en estado inválido
svc := &Service{}
svc.SetStore(store) // ¿y si alguien lo usa antes?
```

`init()` solo para cosas triviales y sin efectos externos. Si necesitas DI generada en un monorepo grande, la herramienta oficial de Google es **Wire** (`github.com/google/wire`), que genera el cableado en tiempo de compilación — pero el 95 % de los proyectos no lo necesita.

### 8.6 Por qué esto hace los tests triviales

```go
// internal/user/service_test.go
package user_test

type fakeStore struct {
	byEmail map[string]*user.User
	saved   []*user.User
}

func (f *fakeStore) ByEmail(_ context.Context, email string) (*user.User, error) {
	if u, ok := f.byEmail[email]; ok {
		return u, nil
	}
	return nil, user.ErrNotFound
}

func (f *fakeStore) Save(_ context.Context, u *user.User) error {
	f.saved = append(f.saved, u)
	return nil
}

type fakeMailer struct{ sent int }

func (f *fakeMailer) Send(context.Context, string, string, string) error {
	f.sent++
	return nil
}

func TestRegister_Duplicado(t *testing.T) {
	store := &fakeStore{byEmail: map[string]*user.User{"a@b.c": {ID: "1"}}}
	svc, err := user.NewService(store, &fakeMailer{})
	if err != nil {
		t.Fatalf("NewService: %v", err)
	}

	if _, err := svc.Register(context.Background(), "a@b.c"); !errors.Is(err, user.ErrDuplicate) {
		t.Errorf("err = %v, quiero ErrDuplicate", err)
	}
}
```

Sin framework de mocks, sin reflexión, sin anotaciones.

---

## 9. Exportación

La visibilidad es léxica: **mayúscula inicial = exportado** (público), minúscula = privado al paquete.

```go
package billing

type Invoice struct {      // exportada
    ID     string          // exportado
    Total  Money           // exportado
    secret string          // privado: invisible fuera del paquete
}

func (i *Invoice) Pay() error      { return i.charge() } // API pública
func (i *Invoice) charge() error   { ... }               // helper privado

const MaxItems = 100        // exportada
const defaultRetries = 3    // privada
```

### 9.1 Exporta lo mínimo

Todo lo exportado es un contrato que tendrás que mantener. Empieza en minúscula y exporta solo cuando alguien lo necesite.

```go
// ✅ superficie mínima: el tipo concreto es privado, se devuelve por interfaz
package ratelimit

type Limiter interface {
    Allow() bool
}

type tokenBucket struct{ ... }

func (b *tokenBucket) Allow() bool { ... }

// New devuelve un Limiter con capacidad n y recarga cada d.
func New(n int, d time.Duration) Limiter { return &tokenBucket{...} }
```

Cuidado con el equilibrio: devolver interfaces oculta métodos y dificulta la evolución (ver 7.3). Úsalo cuando la abstracción sea el punto; si no, devuelve el struct con campos privados.

### 9.2 `internal/`: privacidad a nivel de módulo

Un paquete bajo `internal/` solo puede importarse desde el árbol que contiene ese `internal/`. Lo impone el compilador.

```
example.com/app/
├── cmd/api/main.go
├── internal/          ← nadie fuera de example.com/app puede importar esto
│   ├── user/
│   ├── postgres/
│   └── httpapi/
└── pkg/sdk/           ← API pública si de verdad quieres que otros la usen
```

Consejo del equipo de Go: si dudas, mete el paquete en `internal/`. Sacarlo luego es fácil; retirar una API pública, no.

### 9.3 No exportes campos que rompan invariantes

```go
// ❌ cualquiera puede poner Total en negativo o descuadrar el estado
type Invoice struct {
    Items []Item
    Total Money
}

// ✅ el invariante lo garantiza el tipo
type Invoice struct {
    items []Item
    total Money
}

func (i *Invoice) AddItem(it Item) {
    i.items = append(i.items, it)
    i.total = i.total.Add(it.Price)
}

func (i *Invoice) Total() Money { return i.total }
func (i *Invoice) Items() []Item {
    return slices.Clone(i.items)   // copia defensiva: no exponemos el slice interno
}
```

### 9.4 Estabilidad de la API

- Añadir un campo a una struct exportada **rompe** los literales posicionales de tus usuarios → otra razón para 3.3.
- Añadir un método a una interfaz exportada rompe a todos sus implementadores.
- Truco defensivo si necesitas poder crecer:

```go
type Options struct {
    Timeout time.Duration
    _       struct{}   // obliga a usar campos con nombre
}
```

---

## 10. Errores

### 10.1 Los errores son valores: devuélvelos, no hagas panic

```go
// ✅
func ReadConfig(path string) (*Config, error) {
    b, err := os.ReadFile(path)
    if err != nil {
        return nil, fmt.Errorf("leyendo config %q: %w", path, err)
    }
    ...
}

// ❌ panic en una librería
func ReadConfig(path string) *Config {
    b, err := os.ReadFile(path)
    if err != nil {
        panic(err)
    }
    ...
}
```

`panic` solo para bugs de programación irrecuperables (invariantes roto) o en `main` al arrancar. Las funciones `MustXxx` son la excepción convencional:

```go
// MustCompile hace panic si la expresión es inválida. Pensada para
// inicialización de variables de paquete.
var emailRE = regexp.MustCompile(`^[^@]+@[^@]+$`)
```

### 10.2 Envuelve con contexto usando `%w`

```go
// ❌ pierdes la cadena de causas
return fmt.Errorf("error en la base de datos: %v", err)

// ❌ contexto redundante: "failed to" en cada nivel
return fmt.Errorf("failed to failed to get user: %w", err)

// ✅ contexto que añade información, sin repetir "error"
return fmt.Errorf("obteniendo usuario %s: %w", id, err)
```

Mensajes de error: minúscula, sin punto final, sin salto de línea (se concatenan).

```go
errors.New("connection refused")      // ✅
errors.New("Connection refused.")     // ❌
```

### 10.3 Sentinel errors y tipos de error

```go
// Sentinela: el llamante compara con errors.Is
var ErrNotFound = errors.New("not found")

// Tipo de error: el llamante extrae datos con errors.As
type ValidationError struct {
    Field  string
    Reason string
}

func (e *ValidationError) Error() string {
    return fmt.Sprintf("campo %s inválido: %s", e.Field, e.Reason)
}

// Uso
err := svc.Register(ctx, email)

if errors.Is(err, user.ErrDuplicate) { ... }

var ve *ValidationError
if errors.As(err, &ve) {
    fmt.Println("arregla:", ve.Field)
}

// ❌ nunca compares cadenas ni uses == con errores envueltos
if err == user.ErrDuplicate { ... }             // falla si está envuelto
if strings.Contains(err.Error(), "not found") { ... }
```

### 10.4 Maneja el error una sola vez

```go
// ❌ log + return: el error se reporta dos o tres veces por petición
if err != nil {
    log.Printf("error guardando: %v", err)
    return err
}

// ✅ o lo manejas (log) o lo propagas con contexto
if err != nil {
    return fmt.Errorf("guardando usuario: %w", err)
}
```

### 10.5 Ignorar errores es explícito

```go
_ = resp.Body.Close()                 // decisión consciente y visible

defer func() {
    if err := f.Close(); err != nil { // en escritura, Close SÍ importa
        retErr = errors.Join(retErr, fmt.Errorf("cerrando fichero: %w", err))
    }
}()
```

`errors.Join` (Go 1.20+) agrupa varios errores; `errors.Is` funciona sobre el conjunto.

---

## 11. Concurrencia y context

### 11.1 No arranques una goroutine sin saber cuándo termina

```go
// ❌ goroutine huérfana: fuga garantizada
go doWork()

// ✅ ciclo de vida controlado
var wg sync.WaitGroup
for _, job := range jobs {
    wg.Add(1)
    go func() {                 // Go 1.22+: job ya es por iteración
        defer wg.Done()
        process(ctx, job)
    }()
}
wg.Wait()
```

> En Go < 1.22 hacía falta `job := job` dentro del bucle. Con Go 1.22+ cada iteración tiene su propia variable.

### 11.2 `context.Context` siempre primero, nunca almacenado

```go
// ✅
func (s *Service) Fetch(ctx context.Context, id string) (*User, error)

// ❌ el context no se guarda en la struct
type Service struct { ctx context.Context }

// ❌ nunca pases un context nil; usa context.TODO() si aún no lo tienes
```

### 11.3 La concurrencia no es paralelismo

*"Don't communicate by sharing memory; share memory by communicating."*

```go
// Canales para transferir propiedad de datos
results := make(chan Result, len(urls))
for _, u := range urls {
    go func() { results <- fetch(ctx, u) }()
}

// Mutex para proteger estado compartido pequeño
type SafeMap struct {
    mu sync.RWMutex
    m  map[string]string
}

func (s *SafeMap) Get(k string) (string, bool) {
    s.mu.RLock()
    defer s.mu.RUnlock()
    v, ok := s.m[k]
    return v, ok
}
```

Y una regla más del proverbio: **si dudas, un mutex es más simple y más rápido de razonar que un canal**. Ejecuta siempre `go test -race`.

---

## 12. Estructura de proyecto

La guía oficial (`go.dev/doc/modules/layout`) es deliberadamente minimalista. Empieza plano:

```
myapp/
├── go.mod
├── main.go
└── main_test.go
```

Crece solo cuando duela:

```
example.com/app/
├── go.mod
├── cmd/
│   ├── api/main.go            # un binario por directorio
│   └── worker/main.go
├── internal/
│   ├── user/                  # dominio: entidades + casos de uso
│   │   ├── service.go
│   │   ├── service_test.go
│   │   └── store.go           # interfaz Store (la define el consumidor)
│   ├── postgres/              # infraestructura
│   ├── ses/
│   └── httpapi/               # transporte
├── pkg/                       # solo si publicas API para terceros
└── testdata/                  # ignorado por las herramientas de Go
```

Reglas prácticas:

- Organiza por **dominio**, no por capa técnica. `internal/user/` sí; `internal/models/`, `internal/controllers/`, `internal/utils/` no.
- Un paquete debe tener un propósito que puedas explicar en una frase.
- Sin dependencias circulares (el compilador no las permite): las flechas van de infraestructura → dominio.
- `pkg/` no es obligatorio ni oficial; muchos proyectos de Go no lo usan.

---

## 13. Tests

### 13.1 Table-driven tests: el estándar de facto

```go
func TestParseDuration(t *testing.T) {
	tests := []struct {
		name    string
		in      string
		want    time.Duration
		wantErr bool
	}{
		{name: "segundos", in: "10s", want: 10 * time.Second},
		{name: "mixto", in: "1h30m", want: 90 * time.Minute},
		{name: "vacío", in: "", wantErr: true},
		{name: "basura", in: "abc", wantErr: true},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			t.Parallel()

			got, err := ParseDuration(tt.in)
			if (err != nil) != tt.wantErr {
				t.Fatalf("ParseDuration(%q) error = %v, wantErr = %v", tt.in, err, tt.wantErr)
			}
			if got != tt.want {
				t.Errorf("ParseDuration(%q) = %v, want %v", tt.in, got, tt.want)
			}
		})
	}
}
```

### 13.2 Estilo de mensajes de fallo

Formato oficial: `got, want`.

```go
// ✅
t.Errorf("Sum(%v) = %d, want %d", input, got, want)

// ❌ no dice qué entrada ni qué se esperaba
t.Error("el resultado es incorrecto")
```

### 13.3 Helpers y limpieza

```go
func newTestService(t *testing.T) *user.Service {
	t.Helper()                       // los errores apuntan a la línea del test

	store := &fakeStore{}
	svc, err := user.NewService(store, &fakeMailer{})
	if err != nil {
		t.Fatalf("NewService: %v", err)
	}
	t.Cleanup(func() { store.close() })
	return svc
}
```

### 13.4 Paquete `_test` externo para probar solo la API pública

```go
package user_test   // solo ve lo exportado: comprueba que tu API pública basta

import "example.com/app/internal/user"
```

### 13.5 Tests como documentación

```go
func ExampleService_Register() {
	svc, _ := user.NewService(memStore{}, noopMailer{})
	u, _ := svc.Register(context.Background(), "ana@example.com")
	fmt.Println(u.Email)
	// Output: ana@example.com
}
```

Los `Example` se compilan, se ejecutan y aparecen en la documentación.

---

## 14. Checklist

Antes de abrir un PR:

- [ ] `gofmt -l .` (o `gofumpt`) sin salida
- [ ] `go vet ./...` limpio
- [ ] `go test -race ./...` en verde
- [ ] `staticcheck ./...` o `golangci-lint run` limpio
- [ ] Todo identificador exportado tiene comentario que empieza por su nombre
- [ ] No hay `interface{}`/`any` donde cabe un tipo concreto
- [ ] No hay interfaces con más de 3–4 métodos
- [ ] Ningún `error` se ignora sin `_ =` explícito y justificado
- [ ] Ninguna goroutine sin ciclo de vida definido
- [ ] `context.Context` es el primer parámetro en todo lo que hace I/O
- [ ] Sin estado global mutable
- [ ] Los nombres no tartamudean con el paquete

Herramientas:

```bash
go fmt ./...
go vet ./...
go test -race -cover ./...
go build ./...

# externas, muy recomendables
go install honnef.co/go/tools/cmd/staticcheck@latest
go install github.com/golangci/golangci-lint/cmd/golangci-lint@latest

go doc -all ./internal/user   # lee tu propia API como la verá otro
```

---

## 15. Resumen en 12 líneas

1. `gofmt` no se discute.
2. Nombres cortos en ámbitos cortos; sin tartamudeo con el paquete.
3. Que el valor cero sea útil; `New` solo si hace falta.
4. Literales de struct siempre con nombre de campo.
5. Receptor puntero si muta, es grande o contiene un mutex — y sé consistente.
6. Composición, no herencia; embebe solo si toda la API interna debe ser pública.
7. Interfaces pequeñas, definidas por quien las consume.
8. Inyecta dependencias por constructor; cablea todo en `main`.
9. Exporta lo mínimo; usa `internal/`.
10. Errores como valores, envueltos con `%w`, comparados con `errors.Is`/`As`.
11. Ninguna goroutine sin dueño; `context` primero.
12. Claro es mejor que ingenioso.


---

## 16. Bonus: skill

Como se mencionó al principio, la IA ya se encarga de escribir cualquier código por ti. Para que lo haga siguiendo las mejores prácticas, aquí tienes la skill correspondiente a los puntos abordados en este artículo, para que puedas integrarla en tus proyectos y desarrollar con IA de forma consistente:

### <a href="https://github.com/Lozan0/lozan0.github.io/blob/main/content/posts/buenas-practicas-golang/SKILL.md" target="_blank" rel="noopener noreferrer">SKILL.md</a>
