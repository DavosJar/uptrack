package domain

// Entity: CheckConfiguration
type CheckConfiguration struct {
	configId          ConfigId
	timeoutSeconds    int
	retryCount        int
	retryDelaySeconds int
	alertOnFailure    bool
	alertOnRecovery   bool
}

// NewCheckConfiguration crea una nueva instancia de CheckConfiguration
func NewCheckConfiguration(timeoutSeconds int, retryCount int, retryDelaySeconds int) *CheckConfiguration {
	return &CheckConfiguration{
		timeoutSeconds:    timeoutSeconds,
		retryCount:        retryCount,
		retryDelaySeconds: retryDelaySeconds,
		alertOnFailure:    true,
		alertOnRecovery:   true,
	}
}

func NewDefaultCheckConfiguration() *CheckConfiguration {
	return &CheckConfiguration{
		timeoutSeconds:    10,
		retryCount:        3,
		retryDelaySeconds: 1,
		alertOnFailure:    true,
		alertOnRecovery:   true,
	}
}

func NewFullCheckConfiguration(id ConfigId, timeoutSeconds int, retryCount int, retryDelaySeconds int, alertOnFailure bool, alertOnRecovery bool) *CheckConfiguration {
	return &CheckConfiguration{
		configId:          id,
		timeoutSeconds:    timeoutSeconds,
		retryCount:        retryCount,
		retryDelaySeconds: retryDelaySeconds,
		alertOnFailure:    alertOnFailure,
		alertOnRecovery:   alertOnRecovery,
	}
}

// Getters
func (c *CheckConfiguration) ConfigId() ConfigId {
	return c.configId
}

func (c *CheckConfiguration) TimeoutSeconds() int {
	return c.timeoutSeconds
}

func (c *CheckConfiguration) RetryCount() int {
	return c.retryCount
}

func (c *CheckConfiguration) RetryDelaySeconds() int {
	return c.retryDelaySeconds
}

func (c *CheckConfiguration) AlertOnFailure() bool {
	return c.alertOnFailure
}

func (c *CheckConfiguration) AlertOnRecovery() bool {
	return c.alertOnRecovery
}

// Business methods
func (c *CheckConfiguration) UpdateInterval(seconds int) error {
	if seconds <= 0 {
		return ErrInvalidInterval
	}
	c.timeoutSeconds = seconds
	return nil
}

func (c *CheckConfiguration) UpdateRetryPolicy(retries int, delaySeconds int) error {
	if retries < 0 {
		return ErrInvalidRetryCount
	}
	if delaySeconds < 0 {
		return ErrInvalidRetryDelay
	}
	c.retryCount = retries
	c.retryDelaySeconds = delaySeconds
	return nil
}

func (c *CheckConfiguration) IsValid() bool {
	return c.timeoutSeconds > 0 && c.retryCount >= 0 && c.retryDelaySeconds >= 0
}
