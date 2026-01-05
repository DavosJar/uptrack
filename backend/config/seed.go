package config

import (
	"log"

	"uptrackai/internal/monitoring/domain"
	"uptrackai/internal/monitoring/infrastructure/postgres"
	userd "uptrackai/internal/user/domain"

	"gorm.io/gorm"
)

// SeedMonitoringTargets inserta targets iniciales si la tabla está vacía
func SeedMonitoringTargets(db *gorm.DB) error {
	// Verificar si ya existen targets
	var count int64
	db.Table("monitoring_targets").Count(&count)
	if count > 0 {
		log.Println("✓ Targets ya existen, omitiendo seed")
		return nil
	}

	log.Println("🌱 Insertando targets iniciales...")

	userId, _ := userd.NewUserId("00000000-0000-0000-0000-000000000000")

	targets := []*domain.MonitoringTarget{
		domain.NewMinimalMonitoringTarget("Google", "https://www.google.com", domain.TargetTypeWEB, userId),
		domain.NewMinimalMonitoringTarget("GitHub", "https://github.com", domain.TargetTypeWEB, userId),
		domain.NewMinimalMonitoringTarget("JSONPlaceholder API", "https://jsonplaceholder.typicode.com/posts/1", domain.TargetTypeAPI, userId),
		domain.NewMinimalMonitoringTarget("HTTPBin", "https://httpbin.org/get", domain.TargetTypeAPI, userId),

		// 🔥 Nuevos (sin duplicados)
		domain.NewMinimalMonitoringTarget("Cloudflare Trace", "https://cloudflare.com/cdn-cgi/trace", domain.TargetTypeAPI, userId),
		domain.NewMinimalMonitoringTarget("Postman Echo", "https://postman-echo.com/get", domain.TargetTypeAPI, userId),
		domain.NewMinimalMonitoringTarget("Example", "https://example.com", domain.TargetTypeWEB, userId),
		domain.NewMinimalMonitoringTarget("Fastly", "https://www.fastly.com", domain.TargetTypeWEB, userId),
		domain.NewMinimalMonitoringTarget("Status 200", "https://httpstat.us/200", domain.TargetTypeAPI, userId),
		domain.NewMinimalMonitoringTarget("Status 503", "https://httpstat.us/503", domain.TargetTypeAPI, userId),
		domain.NewMinimalMonitoringTarget("Latency 2s", "https://deelay.me/2000/https://example.com", domain.TargetTypeWEB, userId),
		domain.NewMinimalMonitoringTarget("Latency 10s", "https://deelay.me/10000/https://example.com", domain.TargetTypeWEB, userId),
		domain.NewMinimalMonitoringTarget("BadSSL Expired", "https://expired.badssl.com", domain.TargetTypeWEB, userId),
		domain.NewMinimalMonitoringTarget("Fake Down 1", "https://thissitedoesnotexist123.com", domain.TargetTypeWEB, userId),

		// 🌐 WEB targets
		domain.NewMinimalMonitoringTarget("Wikipedia", "https://www.wikipedia.org", domain.TargetTypeWEB, userId),
		domain.NewMinimalMonitoringTarget("StackOverflow", "https://stackoverflow.com", domain.TargetTypeWEB, userId),
		domain.NewMinimalMonitoringTarget("Mozilla", "https://www.mozilla.org", domain.TargetTypeWEB, userId),
		domain.NewMinimalMonitoringTarget("W3Schools", "https://www.w3schools.com", domain.TargetTypeWEB, userId),
		domain.NewMinimalMonitoringTarget("DigitalOcean", "https://www.digitalocean.com", domain.TargetTypeWEB, userId),
		domain.NewMinimalMonitoringTarget("Vercel", "https://vercel.com", domain.TargetTypeWEB, userId),
		domain.NewMinimalMonitoringTarget("Netlify", "https://www.netlify.com", domain.TargetTypeWEB, userId),
		domain.NewMinimalMonitoringTarget("Cloudflare Blog", "https://blog.cloudflare.com", domain.TargetTypeWEB, userId),
		domain.NewMinimalMonitoringTarget("OpenAI", "https://platform.openai.com", domain.TargetTypeWEB, userId),
		domain.NewMinimalMonitoringTarget("HackerNews", "https://news.ycombinator.com", domain.TargetTypeWEB, userId),
		domain.NewMinimalMonitoringTarget("Reddit", "https://reddit.com", domain.TargetTypeWEB, userId),
		domain.NewMinimalMonitoringTarget("Imgur", "https://imgur.com", domain.TargetTypeWEB, userId),
		domain.NewMinimalMonitoringTarget("Ubuntu", "https://ubuntu.com", domain.TargetTypeWEB, userId),
		domain.NewMinimalMonitoringTarget("Arch Linux", "https://archlinux.org", domain.TargetTypeWEB, userId),
		domain.NewMinimalMonitoringTarget("Python.org", "https://www.python.org", domain.TargetTypeWEB, userId),

		// 🔧 API targets
		domain.NewMinimalMonitoringTarget("DummyJSON Products", "https://dummyjson.com/products/1", domain.TargetTypeAPI, userId),
		domain.NewMinimalMonitoringTarget("SWAPI", "https://swapi.dev/api/people/1/", domain.TargetTypeAPI, userId),
		domain.NewMinimalMonitoringTarget("PokeAPI Pikachu", "https://pokeapi.co/api/v2/pokemon/25", domain.TargetTypeAPI, userId),
		domain.NewMinimalMonitoringTarget("Cat Facts", "https://catfact.ninja/fact", domain.TargetTypeAPI, userId),
		domain.NewMinimalMonitoringTarget("AdviceSlip", "https://api.adviceslip.com/advice", domain.TargetTypeAPI, userId),
		domain.NewMinimalMonitoringTarget("GeoJS IP", "https://get.geojs.io/v1/ip.json", domain.TargetTypeAPI, userId),
		domain.NewMinimalMonitoringTarget("Open Meteo Weather", "https://api.open-meteo.com/v1/forecast?latitude=0&longitude=0&hourly=temperature_2m", domain.TargetTypeAPI, userId),
		domain.NewMinimalMonitoringTarget("Agify", "https://api.agify.io?name=michael", domain.TargetTypeAPI, userId),
		domain.NewMinimalMonitoringTarget("Genderize", "https://api.genderize.io?name=alexis", domain.TargetTypeAPI, userId),
		domain.NewMinimalMonitoringTarget("BoredAPI", "https://www.boredapi.com/api/activity", domain.TargetTypeAPI, userId),
		domain.NewMinimalMonitoringTarget("IPify", "https://api.ipify.org?format=json", domain.TargetTypeAPI, userId),
		domain.NewMinimalMonitoringTarget("Coindesk BTC Price", "https://api.coindesk.com/v1/bpi/currentprice.json", domain.TargetTypeAPI, userId),
		domain.NewMinimalMonitoringTarget("Chuck Norris Jokes", "https://api.chucknorris.io/jokes/random", domain.TargetTypeAPI, userId),
		domain.NewMinimalMonitoringTarget("Universities List", "http://universities.hipolabs.com/search?country=Ecuador", domain.TargetTypeAPI, userId),
		domain.NewMinimalMonitoringTarget("Dog Facts", "https://dogapi.dog/api/v2/facts", domain.TargetTypeAPI, userId),
		domain.NewMinimalMonitoringTarget("HTTP Status 418 Teapot", "https://httpbin.org/status/418", domain.TargetTypeAPI, userId),
		domain.NewMinimalMonitoringTarget("RandomUser", "https://randomuser.me/api/", domain.TargetTypeAPI, userId),
		domain.NewMinimalMonitoringTarget("Open Data Ecuador", "https://datosabiertos.com/api", domain.TargetTypeAPI, userId),
	}

	repo := postgres.NewPostgresMonitoringTargetRepository(db)

	for _, target := range targets {
		_, err := repo.Save(target)
		if err != nil {
			log.Printf("⚠️  Error guardando target %s: %v", target.Name(), err)
			continue
		}
		log.Printf("  ✓ Target creado: %s", target.Name())
	}

	log.Println("✅ Seed completado")
	return nil
}
