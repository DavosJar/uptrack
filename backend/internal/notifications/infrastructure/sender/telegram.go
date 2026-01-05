package sender

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"time"
)

type TelegramSender struct {
	botToken string
	client   *http.Client
}

func NewTelegramSender(botToken string) *TelegramSender {
	return &TelegramSender{
		botToken: botToken,
		client: &http.Client{
			Timeout: 10 * time.Second,
		},
	}
}

func (s *TelegramSender) Send(destination string, message string) error {
	// destination is the Chat ID (stored in ChannelValue)
	url := fmt.Sprintf("https://api.telegram.org/bot%s/sendMessage", s.botToken)

	log.Printf("📤 Sending Telegram message to chat_id=%s: %s", destination, message)

	payload := map[string]string{
		"chat_id": destination,
		"text":    message,
	}

	jsonPayload, err := json.Marshal(payload)
	if err != nil {
		log.Printf("❌ Failed to marshal Telegram payload: %v", err)
		return err
	}

	log.Printf("📦 Telegram payload: %s", string(jsonPayload))

	resp, err := s.client.Post(url, "application/json", bytes.NewBuffer(jsonPayload))
	if err != nil {
		log.Printf("❌ Failed to send Telegram HTTP request: %v", err)
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		log.Printf("❌ Telegram API error response: %s", string(body))
		return fmt.Errorf("failed to send telegram message: status %d, body: %s", resp.StatusCode, string(body))
	}

	log.Printf("✅ Telegram message sent successfully to chat_id=%s", destination)
	return nil
}

// SetWebhook registers the webhook URL with Telegram
func (s *TelegramSender) SetWebhook(webhookURL string) error {
	url := fmt.Sprintf("https://api.telegram.org/bot%s/setWebhook", s.botToken)

	payload := map[string]string{
		"url": webhookURL,
	}

	jsonPayload, err := json.Marshal(payload)
	if err != nil {
		return err
	}

	resp, err := s.client.Post(url, "application/json", bytes.NewBuffer(jsonPayload))
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("failed to set webhook: status %d", resp.StatusCode)
	}

	return nil
}
