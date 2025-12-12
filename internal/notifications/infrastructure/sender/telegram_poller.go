package sender

import (
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"time"
)

// TelegramPoller polls Telegram for new updates (useful for local development)
type TelegramPoller struct {
	botToken      string
	client        *http.Client
	offset        int64
	updateHandler func(update TelegramUpdate)
	stopChan      chan bool
}

func NewTelegramPoller(botToken string, handler func(TelegramUpdate)) *TelegramPoller {
	return &TelegramPoller{
		botToken: botToken,
		client: &http.Client{
			Timeout: 30 * time.Second,
		},
		offset:        0,
		updateHandler: handler,
		stopChan:      make(chan bool),
	}
}

// Start begins polling for updates
func (p *TelegramPoller) Start() {
	log.Println("🤖 Telegram Polling started. Waiting for /start commands...")

	for {
		select {
		case <-p.stopChan:
			log.Println("🛑 Telegram Polling stopped")
			return
		default:
			updates, err := p.getUpdates()
			if err != nil {
				log.Printf("⚠️  Error polling Telegram: %v", err)
				time.Sleep(3 * time.Second)
				continue
			}

			for _, update := range updates {
				p.offset = int64(update.UpdateID + 1)
				if p.updateHandler != nil {
					p.updateHandler(update)
				}
			}

			time.Sleep(1 * time.Second)
		}
	}
}

// Stop stops the polling loop
func (p *TelegramPoller) Stop() {
	close(p.stopChan)
}

func (p *TelegramPoller) getUpdates() ([]TelegramUpdate, error) {
	url := fmt.Sprintf("https://api.telegram.org/bot%s/getUpdates?offset=%d&timeout=10", p.botToken, p.offset)

	resp, err := p.client.Get(url)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}

	var result struct {
		Ok     bool             `json:"ok"`
		Result []TelegramUpdate `json:"result"`
	}

	if err := json.Unmarshal(body, &result); err != nil {
		return nil, err
	}

	if !result.Ok {
		return nil, fmt.Errorf("telegram API returned ok=false")
	}

	return result.Result, nil
}

// TelegramUpdate represents an update from Telegram
type TelegramUpdate struct {
	UpdateID int              `json:"update_id"`
	Message  *TelegramMessage `json:"message"`
}

type TelegramMessage struct {
	MessageID int           `json:"message_id"`
	From      *TelegramUser `json:"from"`
	Chat      *TelegramChat `json:"chat"`
	Date      int64         `json:"date"`
	Text      string        `json:"text"`
}

type TelegramUser struct {
	ID        int64  `json:"id"`
	IsBot     bool   `json:"is_bot"`
	FirstName string `json:"first_name"`
	Username  string `json:"username"`
}

type TelegramChat struct {
	ID        int64  `json:"id"`
	Type      string `json:"type"`
	FirstName string `json:"first_name"`
	Username  string `json:"username"`
}
