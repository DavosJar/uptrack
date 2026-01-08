package domain

import (
	"time"
)

type NotificationId string

// Notification represents a notification stored for the user interface (history)
type Notification struct {
	id        NotificationId
	userId    string
	title     string
	message   string
	severity  AlertSeverity
	isRead    bool
	createdAt time.Time
}

func NewNotification(userId, title, message string, severity AlertSeverity) *Notification {
	return &Notification{
		userId:    userId,
		title:     title,
		message:   message,
		severity:  severity,
		isRead:    false,
		createdAt: time.Now(),
	}
}

// Getters
func (n *Notification) ID() NotificationId {
	return n.id
}

func (n *Notification) UserID() string {
	return n.userId
}

func (n *Notification) Title() string {
	return n.title
}

func (n *Notification) Message() string {
	return n.message
}

func (n *Notification) Severity() AlertSeverity {
	return n.severity
}

func (n *Notification) IsRead() bool {
	return n.isRead
}

func (n *Notification) CreatedAt() time.Time {
	return n.createdAt
}

// Methods for hydration/persistence

func (n *Notification) AssignId(id string) {
	n.id = NotificationId(id)
}

func (n *Notification) MarkAsRead() {
	n.isRead = true
}

func (n *Notification) SetCreatedAt(t time.Time) {
	n.createdAt = t
}

// Methods
// Methods for hydration/persistence
