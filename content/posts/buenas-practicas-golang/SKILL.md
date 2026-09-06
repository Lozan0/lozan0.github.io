---
name: go-idiomatic
description: Escribe, revisa y refactoriza código Go idiomático siguiendo Effective Go, Go Code Review Comments, el Google Go Style Guide y los Go Proverbs. Cubre naming, structs y valor cero, receptores puntero vs valor, composición (embedding), interfaces pequeñas definidas por el consumidor, inyección de dependencias por constructor, exportación pública/privada e `internal/`, errores con `%w`/`errors.Is`/`errors.As`, goroutines y `context`, layout de módulo y tests table-driven. Usa esta skill SIEMPRE que la tarea involucre Go o Golang — escribir código nuevo, revisar un PR, refactorizar, diseñar un paquete o una API, montar un servicio HTTP, depurar goroutines, o tocar cualquier archivo `.go` o `go.mod` — aunque el usuario no pida explícitamente "buenas prácticas", "estilo" o "código idiomático". Also use for English requests about idiomatic Go, Go code review, Go project structure, Go interfaces, dependency injection in Go, pointer vs value receivers, error wrapping.
---

# Go idiomático

Objetivo: que el código que entregues pase un code review del equipo de Go sin comentarios de estilo. Esta skill es prescriptiva a propósito: en Go casi todas las decisiones de forma ya están decididas por la comunidad, así que aplícalas sin preguntar y gasta tu atención en el diseño (límites de paquete, nombres, APIs).

## Cómo trabajar

1. **Antes de escribir**: resuelve las decisiones de la tabla "Decisiones rápidas". No improvises la forma sobre la marcha.
2. **Al escribir**: sigue las 12 reglas no negociables. Si el paquete es de dominio, arranca desde la plantilla canónica de abajo.
3. **Antes de entregar**: pasa el checklist de auto-revisión. Es lo que más sube la calidad percibida.
4. **Si hay toolchain**: ejecuta `gofmt -l .`, `go vet ./...`, `go build ./...` y `go test -race ./...`. Si no hay Go instalado o no hay red, dilo explícitamente y deja los comandos indicados al usuario en vez de inventar que pasaron.

Cuando el usuario pide "haz que funcione" y el código va contra estas reglas, hazlo funcionar **y** señala en una o dos líneas qué cambiaste por idiomática. No conviertas la respuesta en una clase magistral no pedida.

## Las 12 reglas no negociables

1. `gofmt` decide el formato. Nunca discutas indentación, alineación ni orden de imports.
2. `MixedCaps`, jamás `snake_case`. La longitud del nombre es proporcional a su alcance: `i`, `err`, `ctx`, `buf` en ámbitos cortos; nombres descriptivos en lo exportado.
3. Sin *stutter* con el paquete: `user.Service`, no `user.UserService`. Sin `Get` en getters: `c.Owner()`, no `c.GetOwner()`.
4. El valor cero debe ser útil siempre que puedas. Añade `New`/`NewXxx` solo si el cero no es válido (dependencias obligatorias o invariantes).
5. Literales de struct siempre con nombre de campo: `Point{X: 1, Y: 2}`.
6. Receptor puntero si el método muta, si el struct es grande, o si contiene un `sync.Mutex`. Y **consistencia**: si un método usa puntero, todos usan puntero.
7. Composición, no herencia. Embebe solo si toda la API del tipo interno debe formar parte de la API del externo; si no, usa un campo con nombre (`mu sync.Mutex`, nunca `sync.Mutex` embebido).
8. Interfaces pequeñas (1–3 métodos) y **definidas por el paquete que las consume**, no por el que las implementa. Acepta interfaces, devuelve structs.
9. Inyección de dependencias por constructor, con interfaces pequeñas y opciones funcionales para lo opcional. Todo el cableado ocurre en `main`. Cero estado global mutable, cero dependencias en el `context`.
10. Exporta lo mínimo. Empieza en minúscula; usa `internal/`. Cada identificador exportado lleva un comentario que empieza por su propio nombre.
11. Errores como valores: envuelve con `fmt.Errorf("contexto: %w", err)`, compara con `errors.Is`/`errors.As`, nunca con `==` ni comparando strings. Maneja cada error **una sola vez** (o lo logueas o lo propagas, no ambos). Nada de `panic` en librerías.
12. Ninguna goroutine sin ciclo de vida definido. `context.Context` es el primer parámetro de todo lo que hace I/O, nunca se guarda en un struct.

## Decisiones rápidas

| Duda | Respuesta por defecto | Excepción |
|---|---|---|
| ¿Receptor puntero o valor? | Puntero | Tipo pequeño e inmutable (`Money`, `Point`, IDs, `time.Time`) |
| ¿Devuelvo `*T` o `T`? | `T` si es pequeño y sin identidad | `*T` si es caro de copiar, mutable o `nil` significa algo |
| ¿Puntero a slice/map/interfaz? | Nunca | Solo `*[]T` si el `append` debe verse fuera (mejor: devuelve el slice) |
| ¿Dónde defino la interfaz? | En el paquete que la usa | Interfaces de la stdlib ya existentes (`io.Reader`) |
| ¿Creo una interfaz ya? | No, hasta tener 2 implementaciones reales | Necesitas sustituir I/O en tests |
| ¿`New` o valor cero? | Valor cero si puedes hacerlo útil | Hay dependencias obligatorias o invariantes que validar |
| ¿Constructor con muchos parámetros? | Obligatorios como parámetros + `...Option` | 1–3 parámetros: directos |
| ¿Exporto esto? | No | Alguien fuera del paquete lo necesita **hoy** |
| ¿`internal/` o `pkg/`? | `internal/` | Publicas API estable para terceros |
| ¿Canal o mutex? | Mutex para proteger estado; canal para transferir propiedad | — |
| ¿Sentinel error o tipo de error? | Sentinel (`var ErrX = errors.New(...)`) | El llamante necesita datos del error → tipo + `errors.As` |
| ¿Genéricos? | No | Colecciones o utilidades realmente genéricas, sin `any` disfrazado |

## Plantilla canónica de paquete de dominio

Esta forma resuelve a la vez naming, DI, interfaces, exportación y errores. Úsala como esqueleto y adáptala.

```go
// Package user implementa los casos de uso de usuarios.
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

// User es la entidad del dominio.
type User struct {
	ID        string
	Email     string
	CreatedAt time.Time
}

// Store abstrae la persistencia que necesita Service.
// La define el consumidor: la implementa internal/postgres sin importar este paquete al revés.
type Store interface {
	ByEmail(ctx context.Context, email string) (*User, error)
	Save(ctx context.Context, u *User) error
}

// Clock permite controlar el tiempo en los tests.
type Clock interface{ Now() time.Time }

// Service coordina el ciclo de vida de los usuarios.
type Service struct {
	store Store        // dependencias obligatorias
	clock Clock        // dependencia opcional con default sensato
	log   *slog.Logger
}

// Option configura un Service.
type Option func(*Service)

// WithClock sustituye el reloj del sistema. Útil en tests.
func WithClock(c Clock) Option { return func(s *Service) { s.clock = c } }

// NewService construye un Service. store es obligatorio.
func NewService(store Store, opts ...Option) (*Service, error) {
	if store == nil {
		return nil, errors.New("user: store es obligatorio")
	}
	s := &Service{store: store, clock: systemClock{}, log: slog.Default()}
	for _, opt := range opts {
		opt(s)
	}
	return s, nil
}

// Register crea un usuario y devuelve ErrDuplicate si el email ya existe.
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
	return u, nil
}

type systemClock struct{}

func (systemClock) Now() time.Time { return time.Now() }
```

Cableado en `main` (un único sitio donde viven los tipos concretos):

```go
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

	db, err := postgres.Open(ctx, os.Getenv("DATABASE_URL"))
	if err != nil {
		return fmt.Errorf("conectando a postgres: %w", err)
	}
	defer db.Close()

	svc, err := user.NewService(postgres.NewUserStore(db))
	if err != nil {
		return fmt.Errorf("construyendo servicio: %w", err)
	}
	...
}
```

Layout por defecto: empieza plano (`main.go` + `go.mod`) y crece solo cuando duela, organizando **por dominio, no por capa técnica**:

```
example.com/app/
├── cmd/api/main.go        # cableado
├── internal/user/         # dominio: entidad, casos de uso, interfaces que consume
├── internal/postgres/     # infraestructura
└── internal/httpapi/      # transporte
```

Nunca crees `internal/models/`, `internal/controllers/`, `internal/utils/` ni `internal/common/`.

## Errores frecuentes y su corrección

| Antipatrón | Corrección |
|---|---|
| `type UserService struct` en package `user` | `type Service struct` |
| `func (c *Config) GetOwner() string` | `func (c *Config) Owner() string` |
| Mezclar receptores valor y puntero en el mismo tipo | Puntero en todos |
| `sync.Mutex` embebido en un struct exportado | Campo con nombre `mu sync.Mutex`, justo encima de lo que protege |
| Interfaz de 10 métodos en el paquete de la implementación | Interfaz de 2 métodos en el paquete consumidor |
| `var DB *sql.DB` + `init()` que abre conexión | Dependencia inyectada por constructor, abierta en `run()` |
| `ctx = context.WithValue(ctx, "db", db)` | Pasar la dependencia como parámetro del constructor |
| `fmt.Errorf("error: %v", err)` | `fmt.Errorf("obteniendo usuario %s: %w", id, err)` |
| `log.Printf(...)` seguido de `return err` | Solo `return fmt.Errorf("...: %w", err)` |
| `if err == ErrNotFound` | `if errors.Is(err, ErrNotFound)` |
| `go doWork()` suelto | `sync.WaitGroup`, `errgroup` o un canal de cierre |
| `panic(err)` en una librería | Devolver `error`; `panic` solo para invariantes rotos |
| Devolver `error` no nil por un `*T` nil | Devolver `nil` explícito (ver `references/interfaces-y-di.md`) |

## Checklist de auto-revisión

Recórrelo mentalmente sobre el código que acabas de escribir, antes de entregarlo:

- [ ] Nombres sin tartamudeo con el paquete; nombres cortos solo en ámbitos cortos
- [ ] Todo identificador exportado tiene comentario que empieza por su nombre
- [ ] Superficie exportada mínima: ¿algo de esto puede ser privado?
- [ ] Receptores consistentes en todo el tipo
- [ ] Literales de struct con nombre de campo
- [ ] Ninguna interfaz con más de 3–4 métodos; ninguna definida "por si acaso"
- [ ] `any`/`interface{}` solo donde de verdad no cabe un tipo concreto
- [ ] Todo `error` propagado con `%w` y contexto que añade información, o ignorado con `_ =` justificado
- [ ] `context.Context` primer parámetro en todo lo que hace I/O; no almacenado en structs
- [ ] Ninguna goroutine sin dueño; `defer` para cerrar lo que se abre
- [ ] Sin estado global mutable ni `init()` con efectos externos
- [ ] Tests table-driven con `t.Run`, mensajes en formato `got, want`

## Referencias

Abre el archivo correspondiente cuando necesites el detalle, los ejemplos ✅/❌ largos o el razonamiento de fondo. No hace falta leerlos todos: el SKILL.md ya cubre la mayoría de casos.

- `references/naming.md` — naming completo: paquetes, variables, receptores, interfaces `-er`, comentarios de doc
- `references/structs-y-punteros.md` — valor cero útil, constructores, tags, métodos sobre cualquier tipo, puntero vs valor en detalle, embedding y decoradores
- `references/interfaces-y-di.md` — interfaces pequeñas, interfaz definida por el consumidor, verificación en compilación, DI completa con functional options, capa HTTP, antipatrones y tests con fakes
- `references/api-y-errores.md` — exportación, `internal/`, invariantes y copias defensivas, estabilidad de API, sentinel errors, tipos de error, `errors.Join`
- `references/concurrencia-layout-tests.md` — goroutines con ciclo de vida, `context`, mutex vs canales, layout de módulo, table-driven tests, `t.Helper`, `Example`

Fuentes oficiales: [Effective Go](https://go.dev/doc/effective_go) · [Go Code Review Comments](https://go.dev/wiki/CodeReviewComments) · [Google Go Style Guide](https://google.github.io/styleguide/go/) · [Go Proverbs](https://go-proverbs.github.io/) · [Organizing a Go module](https://go.dev/doc/modules/layout)
