---
title: Sistema de emparejamiento de usuarios (Matchmaking) en Go con NATS
date: 2026-02-26
tags: ['desarrollo', 'NATS', 'Golang']
---

# Matchmaking en Go con NATS

Les comparto una PoC que hice sobre el emparejamiento de usuarios, que es la capacidad  de reunir a 2 o mas usuarios en un espacio, lugar o sala virtual, como sucede en los juegos multiplayers que buscan partidas a nivel mundial, dependiendo de ciertos factores y condiciones que pueden ser puntaje, latencia de la red, región o cualquier otra elegida a gusto o según el caso de uso.
Escrito en Golang y utilizando como broker de eventos NATS. Se puede probar en docker o descargando el binario del server de NATS.

### NATS en docker:

```bash
docker run -p 4222:4222 -ti nats:latest
```

### Binario de nats-server directamente desde su pagina oficial:

Para Linux, MacOs y Windows: https://github.com/nats-io/nats-server/releases/latest

Documentación oficial NATS: [https://docs.nats.io/](https://docs.nats.io/)

**Código de server:**

```go
package main

import (
	"encoding/json"
	"fmt"
	"log"
	"math"
	"sync"
	"time"

	"github.com/nats-io/nats.go"
)

// MatchRequest es la solicitud que envía un cliente.
type MatchRequest struct {
	PlayerID string `json:"player_id"`
	MMR      int    `json:"mmr"`
	// ReplyTo no es necesario aquí, NATS lo gestiona con nc.Request
	ReplyTo string // No es parte del JSON, lo llenamos internamente.
}

// MatchResponse es la respuesta cuando se encuentra una partida.
type MatchResponse struct {
	MatchID   string `json:"match_id"`
	ServerURL string `json:"server_url"`
}

// Matchmaker gestiona la cola de jugadores que buscan partida.
type Matchmaker struct {
	mu    sync.Mutex
	queue []MatchRequest
}

func main() {
	// 1. Conectar a NATS
	nc, err := nats.Connect(nats.DefaultURL)
	if err != nil {
		log.Fatalf("Error al conectar a NATS: %v", err)
	}
	defer nc.Close()

	m := &Matchmaker{}
	log.Println("✅ Welcome to the Matchmaking service")
	log.Println("✅ Servicio de Matchmaking iniciado. Escuchando en 'match.find'...")

	// 2. Suscribirse al subject donde los clientes envían solicitudes
	_, err = nc.Subscribe("match.find", func(msg *nats.Msg) {
		var req MatchRequest
		if err := json.Unmarshal(msg.Data, &req); err != nil {
			log.Printf("Error al decodificar la solicitud: %v", err)
			return
		}
		// Guardamos el "inbox" de respuesta que NATS crea para la solicitud
		req.ReplyTo = msg.Reply

		log.Printf("➡️  Jugador %s (%d MMR) entró en la cola.", req.PlayerID, req.MMR)
		m.handleMatchmaking(nc, req)
	})
	if err != nil {
		log.Fatalf("Error al suscribirse al subject 'match.find': %v", err)
	}

	// 3. Mantener el servicio corriendo indefinidamente
	select {}
}

// handleMatchmaking contiene la lógica para encontrar una partida.
func (m *Matchmaker) handleMatchmaking(nc *nats.Conn, req MatchRequest) {
	m.mu.Lock()
	defer m.mu.Unlock()

	// Lógica simplificada: buscar a alguien con diferencia de MMR < 200
	for i, opponent := range m.queue {
		if math.Abs(float64(opponent.MMR-req.MMR)) <= 200 {
			log.Printf("🎉 ¡Match encontrado! %s vs %s", opponent.PlayerID, req.PlayerID)
			matchID := fmt.Sprintf("match_%s_%s_%d", opponent.PlayerID, req.PlayerID, time.Now().UnixNano())
			res := MatchResponse{MatchID: matchID, ServerURL: "udp://server-01.game.com:7777"}
			data, _ := json.Marshal(res)

			// Notificar a ambos jugadores
			nc.Publish(opponent.ReplyTo, data)
			nc.Publish(req.ReplyTo, data)
			log.Printf("📢 Notificando a ambos jugadores sobre la partida %s.", matchID)

			// Eliminar al oponente de la cola
			m.queue = append(m.queue[:i], m.queue[i+1:]...)
			return
		}
	}

	// Si no se encuentra oponente, añadir al jugador a la cola
	log.Printf("⏳ No se encontró oponente para %s. Añadido a la cola.", req.PlayerID)
	m.queue = append(m.queue, req)
}
```

**Código de cliente:**

```go
package main

import (
	"encoding/json"
	"flag"
	"fmt"
	"log"
	"time"

	"github.com/nats-io/nats.go"
)

// MatchRequest debe ser idéntica a la del servidor
type MatchRequest struct {
	PlayerID string `json:"player_id"`
	MMR      int    `json:"mmr"`
}

// MatchResponse debe ser idéntica a la del servidor
type MatchResponse struct {
	MatchID   string `json:"match_id"`
	ServerURL string `json:"server_url"`
}

func main() {
	// Definir flags para la línea de comandos
	playerID := flag.String("playerID", "player1", "ID del jugador")
	mmr := flag.Int("mmr", 1500, "MMR (puntuación) del jugador")
	flag.Parse()

	// Conectar a NATS
	nc, err := nats.Connect(nats.DefaultURL)
	if err != nil {
		log.Fatalf("Error al conectar a NATS: %v", err)
	}
	defer nc.Close()

	// Crear la solicitud de partida
	req := MatchRequest{
		PlayerID: *playerID,
		MMR:      *mmr,
	}
	fmt.Println("MatchRequest: ", req)
	reqData, err := json.Marshal(req)
	fmt.Println("reqData: ", string(reqData))
	if err != nil {
		log.Fatalf("Error al codificar la solicitud: %v", err)
	}

	log.Printf("Jugador %s (%d MMR) buscando partida...", req.PlayerID, req.MMR)

	// Enviar la solicitud y esperar una respuesta con un timeout.
	// nc.Request se encarga de crear un 'inbox' temporal para la respuesta.
	msg, err := nc.Request("match.find", reqData, 30*time.Second)
	if err != nil {
		if err == nats.ErrTimeout {
			log.Printf("No se encontró partida en 30 segundos. Inténtalo de nuevo.")
		} else {
			log.Fatalf("Error al enviar la solicitud: %v", err)
		}
		return
	}

	// Decodificar la respuesta
	var res MatchResponse
	if err := json.Unmarshal(msg.Data, &res); err != nil {
		log.Fatalf("Error al decodificar la respuesta: %v", err)
	}

	log.Printf("¡Partida encontrada! ID: %s, Servidor: %s", res.MatchID, res.ServerURL)
}
```

**Opciones de ejecución:**

Usuario 1:
```bash
go run client.go --playerID player1 --mmr 1500
```

Usuario 2:
```bash
go run client.go --playerID player2 --mmr 1600
```

Esta es solo una base de la cual partir para seguir construyendo un sistemas mas sólido y serio de emparejamiento cualquiera que sea el caso de uso o necesidad especifica.