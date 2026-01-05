package app

// APIResponse - Estructura HATEOAS genérica para cualquier respuesta de API
type APIResponse struct {
	Msg     string                 `json:"message,omitempty"`
	Success bool                   `json:"success,omitempty"`
	Data    interface{}            `json:"data,omitempty"`
	Links   map[string]string      `json:"_links,omitempty"`
	Meta    map[string]interface{} `json:"_meta,omitempty"`
}

// NewAPIResponse crea una respuesta HATEOAS básica
func NewAPIResponse(data interface{}) APIResponse {
	return APIResponse{
		Data:  data,
		Links: make(map[string]string),
		Meta:  make(map[string]interface{}),
	}
}

// WithLink agrega un link HATEOAS a la respuesta
func (r APIResponse) WithLink(rel, href string) APIResponse {
	if r.Links == nil {
		r.Links = make(map[string]string)
	}
	r.Links[rel] = href
	return r
}

// WithLinks agrega múltiples links HATEOAS a la respuesta
func (r APIResponse) WithLinks(links map[string]string) APIResponse {
	if r.Links == nil {
		r.Links = make(map[string]string)
	}
	for rel, href := range links {
		r.Links[rel] = href
	}
	return r
}

// WithMeta agrega metadata adicional a la respuesta
func (r APIResponse) WithMeta(key string, value interface{}) APIResponse {
	if r.Meta == nil {
		r.Meta = make(map[string]interface{})
	}
	r.Meta[key] = value
	return r
}

// WithPagination agrega metadata de paginación y links HATEOAS (first, last, next, previous)
// baseURL: ruta base sin query params (ej: "/api/v1/targets")
// page: página actual (1-based)
// limit: elementos por página
// total: total de elementos
func (r APIResponse) WithPagination(baseURL string, page, limit, total int) APIResponse {
	if r.Meta == nil {
		r.Meta = make(map[string]interface{})
	}

	// Calcular total de páginas
	totalPages := (total + limit - 1) / limit
	if totalPages == 0 {
		totalPages = 1
	}

	// Metadata de paginación
	r.Meta["pagination"] = map[string]interface{}{
		"page":        page,
		"limit":       limit,
		"total":       total,
		"total_pages": totalPages,
	}

	// Links HATEOAS de paginación
	if r.Links == nil {
		r.Links = make(map[string]string)
	}

	// first y last siempre están disponibles
	r.Links["first"] = baseURL + "?page=1&limit=" + intToString(limit)
	r.Links["last"] = baseURL + "?page=" + intToString(totalPages) + "&limit=" + intToString(limit)

	// previous solo si no estamos en la primera página
	if page > 1 {
		r.Links["previous"] = baseURL + "?page=" + intToString(page-1) + "&limit=" + intToString(limit)
	}

	// next solo si no estamos en la última página
	if page < totalPages {
		r.Links["next"] = baseURL + "?page=" + intToString(page+1) + "&limit=" + intToString(limit)
	}

	return r
}

//builder respusta standar con msj y success
func BuildOKResponse(msg string, success bool, data interface{}) APIResponse {
	return APIResponse{
		Msg:     msg,
		Success: success,
		Data:    data,
	}
}
func BuildErrorResponse(msg string, success bool) APIResponse {
	return APIResponse{
		Msg:     msg,
		Success: success,
	}
}

// intToString convierte int a string de forma simple
func intToString(n int) string {
	if n == 0 {
		return "0"
	}

	negative := n < 0
	if negative {
		n = -n
	}

	digits := make([]byte, 0, 10)
	for n > 0 {
		digits = append(digits, byte(n%10)+'0')
		n /= 10
	}

	// Invertir
	for i, j := 0, len(digits)-1; i < j; i, j = i+1, j-1 {
		digits[i], digits[j] = digits[j], digits[i]
	}

	if negative {
		return "-" + string(digits)
	}
	return string(digits)
}
